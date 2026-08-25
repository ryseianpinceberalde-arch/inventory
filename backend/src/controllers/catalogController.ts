import { Request, Response } from "express";
import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { audit } from "../services/auditService.js";
import * as catalog from "../services/catalogService.js";
import { serializeForPermissions } from "../rbac/serializers.js";

function parseList(req: Request) {
  return {
    page: Math.max(Number(req.query.page ?? 1), 1),
    limit: Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100),
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    sortBy: typeof req.query.sortBy === "string" ? req.query.sortBy : undefined,
    sortOrder: req.query.sortOrder === "asc" ? "asc" as const : "desc" as const
  };
}

function skuPart(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24);
}

async function generateUniqueSku(name: string, barcode: string) {
  const barcodePart = skuPart(barcode).slice(-12);
  const namePart = skuPart(name).slice(0, 10);
  const baseSku = `SKU-${barcodePart || namePart || Date.now()}`;
  let sku = baseSku;
  let suffix = 2;

  while (await prisma.product.findUnique({ where: { sku } })) {
    sku = `${baseSku}-${suffix}`;
    suffix += 1;
  }

  return sku;
}

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status.toUpperCase() : undefined;
  if (status && status !== "ALL" && status !== ProductStatus.ACTIVE && status !== ProductStatus.ARCHIVED) {
    throw new AppError("Invalid product status filter", 422);
  }
  const result = await catalog.listProducts({
    ...parseList(req),
    categoryId: typeof req.query.categoryId === "string" ? req.query.categoryId : undefined,
    supplierId: typeof req.query.supplierId === "string" ? req.query.supplierId : undefined,
    stockStatus: typeof req.query.stockStatus === "string" ? req.query.stockStatus : undefined,
    status: status as ProductStatus | "ALL" | undefined
  });
  return ok(res, "Products loaded", serializeForPermissions(result.items, req.user?.permissions ?? []), {
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 20),
    total: result.total,
    totalPages: Math.ceil(result.total / Number(req.query.limit ?? 20))
  });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.product.findFirst({ where: { OR: [{ barcode: req.body.barcode }, { barcodes: { some: { code: req.body.barcode } } }] } });
  if (existing) throw new AppError("This barcode is already assigned to another product.", 409);

  const requestedSku = typeof req.body.sku === "string" ? req.body.sku.trim() : "";
  const sku = requestedSku || await generateUniqueSku(req.body.name, req.body.barcode);
  const existingSku = await prisma.product.findUnique({ where: { sku } });
  if (existingSku) throw new AppError("This SKU is already assigned to another product.", 409);

  const product = await prisma.$transaction(async (tx) => {
    const createdProduct = await tx.product.create({
      data: { ...req.body, sku, createdBy: req.user?.id ?? null },
      include: { category: true, primarySupplier: true }
    });
    await tx.productBarcode.create({ data: { productId: createdProduct.id, code: createdProduct.barcode } });
    if (createdProduct.primarySupplierId) {
      await tx.supplierProduct.upsert({
        where: { supplierId_productId: { supplierId: createdProduct.primarySupplierId, productId: createdProduct.id } },
        update: {},
        create: { supplierId: createdProduct.primarySupplierId, productId: createdProduct.id }
      });
    }
    return createdProduct;
  });
  await audit({ userId: req.user?.id, action: "PRODUCT_CREATE", module: "PRODUCTS", recordId: product.id, newData: product });
  return created(res, "Product created", serializeForPermissions(product, req.user?.permissions ?? []));
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true, primarySupplier: true, barcodes: true, stockMovements: { orderBy: { createdAt: "desc" }, take: 20 } }
  });
  if (!product) throw new AppError("Product not found", 404);
  return ok(res, "Product loaded", serializeForPermissions(product, req.user?.permissions ?? []));
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const old = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!old) throw new AppError("Product not found", 404);
  const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body, include: { category: true, primarySupplier: true } });
  await audit({ userId: req.user?.id, action: "PRODUCT_UPDATE", module: "PRODUCTS", recordId: product.id, oldData: old, newData: product });
  return ok(res, "Product updated", serializeForPermissions(product, req.user?.permissions ?? []));
});

export const archiveProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await catalog.archiveProduct(req.params.id);
  await audit({ userId: req.user?.id, action: "PRODUCT_ARCHIVE", module: "PRODUCTS", recordId: product.id });
  return ok(res, "Product archived", serializeForPermissions(product, req.user?.permissions ?? []));
});

export const restoreProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await catalog.restoreProduct(req.params.id);
  return ok(res, "Product restored", serializeForPermissions(product, req.user?.permissions ?? []));
});

export const barcodeLookup = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Barcode lookup complete", serializeForPermissions(await catalog.findProductByBarcode(req.params.code), req.user?.permissions ?? []));
});

export const externalBarcodeLookup = asyncHandler(async (req: Request, res: Response) => {
  const result = await catalog.lookupBarcodeOnline(req.params.code);
  if (result.source === "local") {
    return ok(res, "Barcode lookup complete", {
      success: true,
      source: "local",
      exists_locally: true,
      product: serializeForPermissions(result.product, req.user?.permissions ?? [])
    });
  }
  if (result.source === "none") {
    return ok(res, result.message, {
      success: false,
      source: "none",
      exists_locally: false,
      barcode: result.barcode,
      message: result.message
    });
  }
  return ok(res, "Product information found", {
    success: true,
    source: result.source,
    exists_locally: false,
    product: result.product
  });
});

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const rows = await catalog.categoryMetrics();
  const data = rows.map((category) => {
    const inventoryValue = category.products.reduce((sum, product) => sum.add(product.costPrice.mul(product.currentStock)), new Prisma.Decimal(0));
    const totalSales = category.products.flatMap((product) => product.saleItems).reduce((sum, item) => sum.add(item.lineTotal), new Prisma.Decimal(0));
    const totalProfit = category.products.flatMap((product) => product.saleItems).reduce((sum, item) => sum.add(item.profit), new Prisma.Decimal(0));
    return { ...category, inventoryValue, totalSales, totalProfit };
  });
  return ok(res, "Categories loaded", serializeForPermissions(data, req.user?.permissions ?? []));
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  return created(res, "Category created", await prisma.category.create({ data: req.body }));
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Category updated", await prisma.category.update({ where: { id: req.params.id }, data: req.body }));
});

export const listSuppliers = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Suppliers loaded", serializeForPermissions(await prisma.supplier.findMany({ include: { products: true, deliveries: true, evaluations: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { name: "asc" } }), req.user?.permissions ?? []));
});

export const listSupplierProducts = asyncHandler(async (req: Request, res: Response) => {
  const rows = await prisma.supplierProduct.findMany({
    include: { supplier: true, product: { include: { category: true } } },
    orderBy: [{ supplier: { name: "asc" } }, { product: { name: "asc" } }]
  });
  const data = rows.map((row) => ({
    id: row.id,
    supplier: row.supplier.name,
    product: row.product.name,
    sku: row.product.sku,
    barcode: row.product.barcode,
    category: row.product.category.name,
    currentStock: row.product.currentStock,
    costPrice: row.product.costPrice,
    sellingPrice: row.product.sellingPrice,
    status: row.product.status
  }));
  return ok(res, "Supplier products loaded", serializeForPermissions(data, req.user?.permissions ?? []));
});

export const getSupplier = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await prisma.supplier.findUnique({ where: { id: req.params.id }, include: { products: true, deliveries: { include: { items: true } }, evaluations: true } });
  if (!supplier) throw new AppError("Supplier not found", 404);
  return ok(res, "Supplier loaded", serializeForPermissions(supplier, req.user?.permissions ?? []));
});

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  return created(res, "Supplier created", await prisma.supplier.create({ data: req.body }));
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Supplier updated", await prisma.supplier.update({ where: { id: req.params.id }, data: req.body }));
});

export const listCustomers = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, "Customers loaded", await prisma.customer.findMany({ include: { sales: { take: 5, orderBy: { createdAt: "desc" } } }, orderBy: { fullName: "asc" } }));
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await prisma.customer.findUnique({ where: { id: req.params.id }, include: { sales: { include: { items: { include: { product: true } } }, orderBy: { createdAt: "desc" } } } });
  if (!customer) throw new AppError("Customer not found", 404);
  return ok(res, "Customer loaded", serializeForPermissions(customer, req.user?.permissions ?? []));
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  return created(res, "Customer created", await prisma.customer.create({ data: req.body }));
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Customer updated", await prisma.customer.update({ where: { id: req.params.id }, data: req.body }));
});
