import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export interface ListParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder: "asc" | "desc";
}

function paging(params: ListParams) {
  return { skip: (params.page - 1) * params.limit, take: params.limit };
}

export async function listProducts(params: ListParams & { categoryId?: string; supplierId?: string; stockStatus?: string; status?: ProductStatus | "ALL" }) {
  const where: Prisma.ProductWhereInput = {
    status: params.status === "ALL" ? undefined : params.status ?? ProductStatus.ACTIVE,
    categoryId: params.categoryId,
    primarySupplierId: params.supplierId,
    OR: params.search
      ? [
          { name: { contains: params.search, mode: "insensitive" } },
          { sku: { contains: params.search, mode: "insensitive" } },
          { barcode: { contains: params.search, mode: "insensitive" } }
        ]
      : undefined
  };
  if (params.stockStatus === "low") where.currentStock = { lte: prisma.product.fields.reorderLevel };
  if (params.stockStatus === "out") where.currentStock = 0;
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      ...paging(params),
      include: { category: true, primarySupplier: true },
      orderBy: { [params.sortBy ?? "updatedAt"]: params.sortOrder }
    }),
    prisma.product.count({ where })
  ]);
  return { items, total };
}

export async function findProductByBarcode(code: string) {
  const product = await prisma.product.findFirst({
    where: {
      status: ProductStatus.ACTIVE,
      OR: [{ barcode: code }, { barcodes: { some: { code } } }]
    },
    include: { category: true, primarySupplier: true }
  });
  if (!product) throw new AppError("Barcode is not registered", 404);
  return product;
}

export interface ExternalProductDraft {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  image?: string;
  manufacturer?: string;
  size?: string;
  source: "upcitemdb" | "openfoodfacts";
  importedFields: string[];
}

export type BarcodeLookupResult =
  | { source: "local"; existsLocally: true; product: Awaited<ReturnType<typeof findProductByBarcode>> }
  | { source: "upcitemdb" | "openfoodfacts"; existsLocally: false; product: ExternalProductDraft }
  | { source: "none"; existsLocally: false; barcode: string; message: string };

interface UpcItemDbItem {
  ean?: unknown;
  upc?: unknown;
  title?: unknown;
  brand?: unknown;
  category?: unknown;
  description?: unknown;
  images?: unknown;
  manufacturer?: unknown;
  size?: unknown;
}

interface UpcItemDbResponse {
  total?: unknown;
  items?: unknown;
}

interface OpenFoodFactsResponse {
  status?: unknown;
  product?: unknown;
}

const lookupCache = new Map<string, { expiresAt: number; result: BarcodeLookupResult }>();
const cacheTtlMs = 24 * 60 * 60 * 1000;

export function normalizeBarcode(rawCode: string) {
  const code = rawCode.trim().replace(/[^A-Za-z0-9._-]/g, "");
  if (!code) throw new AppError("Barcode is required", 422);
  if (code.length < 3 || code.length > 64) throw new AppError("Barcode must be between 3 and 64 supported characters", 422);
  return code;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstImage(value: unknown) {
  if (!Array.isArray(value)) return "";
  const image = value.find((item) => typeof item === "string" && item.trim().startsWith("http"));
  return typeof image === "string" ? image.trim() : "";
}

function importedFields(product: Omit<ExternalProductDraft, "source" | "importedFields">) {
  return Object.entries(product)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key]) => key);
}

async function fetchJson(url: string, headers: HeadersInit = {}) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(7000)
  });
  if (!response.ok) return null;
  return response.json() as Promise<unknown>;
}

async function lookupUpcItemDb(barcode: string): Promise<ExternalProductDraft | null> {
  const headers: HeadersInit = {};
  const endpoint = env.UPCITEMDB_API_KEY ? "https://api.upcitemdb.com/prod/v1/lookup" : "https://api.upcitemdb.com/prod/trial/lookup";
  if (env.UPCITEMDB_API_KEY) {
    headers.user_key = env.UPCITEMDB_API_KEY;
    headers.key_type = env.UPCITEMDB_KEY_TYPE;
  }

  const payload = await fetchJson(`${endpoint}?upc=${encodeURIComponent(barcode)}`, headers) as UpcItemDbResponse | null;
  if (!payload || typeof payload.total !== "number" || payload.total < 1 || !Array.isArray(payload.items)) return null;
  const item = payload.items[0] as UpcItemDbItem | undefined;
  if (!item) return null;

  const product = {
    barcode: stringValue(item.ean) || stringValue(item.upc) || barcode,
    name: stringValue(item.title),
    brand: stringValue(item.brand) || undefined,
    category: stringValue(item.category) || undefined,
    description: stringValue(item.description) || undefined,
    image: firstImage(item.images) || undefined,
    manufacturer: stringValue(item.manufacturer) || undefined,
    size: stringValue(item.size) || undefined
  };
  if (!product.name) return null;
  return { ...product, barcode, source: "upcitemdb", importedFields: importedFields(product) };
}

async function lookupOpenFoodFacts(barcode: string): Promise<ExternalProductDraft | null> {
  const payload = await fetchJson(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`) as OpenFoodFactsResponse | null;
  if (!payload || payload.status !== 1 || !payload.product || typeof payload.product !== "object") return null;
  const productData = payload.product as Record<string, unknown>;
  const name = stringValue(productData.product_name) || stringValue(productData.generic_name);
  if (!name) return null;
  const product = {
    barcode,
    name,
    brand: stringValue(productData.brands) || undefined,
    category: stringValue(productData.categories) || undefined,
    description: stringValue(productData.generic_name) || undefined,
    image: stringValue(productData.image_front_url) || stringValue(productData.image_url) || undefined,
    manufacturer: stringValue(productData.manufacturing_places) || undefined,
    size: stringValue(productData.quantity) || undefined
  };
  return { ...product, source: "openfoodfacts", importedFields: importedFields(product) };
}

export async function lookupBarcodeOnline(rawCode: string): Promise<BarcodeLookupResult> {
  const barcode = normalizeBarcode(rawCode);

  const localProduct = await prisma.product.findFirst({
    where: { OR: [{ barcode }, { barcodes: { some: { code: barcode } } }] },
    include: { category: true, primarySupplier: true }
  });
  if (localProduct) return { source: "local", existsLocally: true, product: localProduct };

  const cached = lookupCache.get(barcode);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  let result: BarcodeLookupResult = { source: "none", existsLocally: false, barcode, message: "Product not found" };
  try {
    const upcItem = await lookupUpcItemDb(barcode);
    if (upcItem) result = { source: "upcitemdb", existsLocally: false, product: upcItem };
    else {
      const foodItem = await lookupOpenFoodFacts(barcode);
      if (foodItem) result = { source: "openfoodfacts", existsLocally: false, product: foodItem };
    }
  } catch {
    result = { source: "none", existsLocally: false, barcode, message: "Online product lookup is currently unavailable. You can still add this product manually." };
  }

  lookupCache.set(barcode, { expiresAt: Date.now() + cacheTtlMs, result });
  return result;
}

export async function archiveProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: { saleItems: true, stockMovements: true } });
  if (!product) throw new AppError("Product not found", 404);
  return prisma.product.update({ where: { id }, data: { status: ProductStatus.ARCHIVED } });
}

export async function restoreProduct(id: string) {
  return prisma.product.update({ where: { id }, data: { status: ProductStatus.ACTIVE } });
}

export async function categoryMetrics() {
  return prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
      products: { select: { currentStock: true, costPrice: true, sellingPrice: true, saleItems: { select: { lineTotal: true, profit: true } } } }
    },
    orderBy: { name: "asc" }
  });
}
