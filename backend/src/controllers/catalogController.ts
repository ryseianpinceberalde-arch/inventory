import { Request, Response } from "express";
import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { audit } from "../services/auditService.js";
import * as customers from "../services/customerService.js";
import { defaultLoyaltySettings, getLoyaltySettings, loyaltySettingKey, normalizeLoyaltySettings } from "../services/loyaltyService.js";
import { paginationQuery } from "../validators/common.js";
import * as catalog from "../services/catalogService.js";
import { serializeForPermissions } from "../rbac/serializers.js";

function parseList(req: Request) {
  return paginationQuery.parse(req.query);
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

function assertCustomerPrices(sellingPrice: Prisma.Decimal | string | number, memberPrice?: Prisma.Decimal | string | number | null, wholesalePrice?: Prisma.Decimal | string | number | null) {
  const retail = new Prisma.Decimal(sellingPrice);
  if (memberPrice != null && new Prisma.Decimal(memberPrice).gt(retail)) throw new AppError("Member price cannot exceed the retail price.", 422);
  if (wholesalePrice != null && new Prisma.Decimal(wholesalePrice).gt(retail)) throw new AppError("Wholesale price cannot exceed the retail price.", 422);
}

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status.toUpperCase() : undefined;
  if (status && status !== "ALL" && status !== ProductStatus.ACTIVE && status !== ProductStatus.ARCHIVED) {
    throw new AppError("Invalid product status filter", 422);
  }
  const paging = parseList(req);
  const result = await catalog.listProducts({
    ...paging,
    categoryId: typeof req.query.categoryId === "string" ? req.query.categoryId : undefined,
    supplierId: typeof req.query.supplierId === "string" ? req.query.supplierId : undefined,
    stockStatus: typeof req.query.stockStatus === "string" ? req.query.stockStatus : undefined,
    status: status as ProductStatus | "ALL" | undefined
  });
  return ok(res, "Products loaded", serializeForPermissions(result.items, req.user?.permissions ?? []), {
    page: paging.page,
    limit: paging.limit,
    total: result.total,
    totalPages: Math.ceil(result.total / paging.limit)
  });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  if ((req.body.memberPrice != null || req.body.wholesalePrice != null) && !req.user?.permissions.includes("settings.update")) {
    throw new AppError("Only authorized administrators can configure customer pricing.", 403);
  }
  assertCustomerPrices(req.body.sellingPrice, req.body.memberPrice, req.body.wholesalePrice);
  const existing = await prisma.product.findFirst({ where: { OR: [{ barcode: req.body.barcode }, { barcodes: { some: { code: req.body.barcode } } }] } });
  if (existing) throw new AppError("This barcode is already assigned to another product.", 409);

  const requestedSku = typeof req.body.sku === "string" ? req.body.sku.trim() : "";
  const sku = requestedSku || await generateUniqueSku(req.body.name, req.body.barcode);
  const existingSku = await prisma.product.findUnique({ where: { sku } });
  if (existingSku) throw new AppError("This SKU is already assigned to another product.", 409);

  const product = await prisma.$transaction(async (tx) => {
    const createdProduct = await tx.product.create({
      data: { ...req.body, tracksExpiration: true, sku, createdBy: req.user?.id ?? null },
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
  const changesCustomerPricing = req.body.memberPrice !== undefined || req.body.wholesalePrice !== undefined || (req.body.wholesaleMinQuantity !== undefined && old.wholesalePrice !== null);
  if (changesCustomerPricing && !req.user?.permissions.includes("settings.update")) {
    throw new AppError("Only authorized administrators can configure customer pricing.", 403);
  }
  assertCustomerPrices(req.body.sellingPrice ?? old.sellingPrice, req.body.memberPrice === undefined ? old.memberPrice : req.body.memberPrice, req.body.wholesalePrice === undefined ? old.wholesalePrice : req.body.wholesalePrice);
  const product = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${req.params.id}::uuid FOR UPDATE`;
    const current = await tx.product.findUniqueOrThrow({ where: { id: req.params.id } });
    if (req.body.barcode && req.body.barcode !== current.barcode) {
      const duplicate = await tx.product.findFirst({ where: { id: { not: current.id }, OR: [{ barcode: req.body.barcode }, { barcodes: { some: { code: req.body.barcode } } }] } });
      if (duplicate) throw new AppError("This barcode is already assigned to another product.", 409);
      await tx.productBarcode.upsert({ where: { code: req.body.barcode }, update: {}, create: { productId: current.id, code: req.body.barcode } });
    }
    if (req.body.currentStock !== undefined && req.body.currentStock !== current.currentStock) {
      if (!req.user?.permissions.includes("inventory.adjustment_approve")) throw new AppError("Use Inventory adjustment to change an existing stock quantity.", 403);
      await tx.stockMovement.create({ data: { productId: current.id, employeeId: req.user.id, previousQuantity: current.currentStock, quantityChanged: req.body.currentStock - current.currentStock, newQuantity: req.body.currentStock, movementType: "ADJUSTMENT", referenceNo: `EDIT-${current.id}-${Date.now()}`, reason: "Product stock correction" } });
    }
    if (req.body.primarySupplierId) await tx.supplierProduct.upsert({ where: { supplierId_productId: { supplierId: req.body.primarySupplierId, productId: current.id } }, update: {}, create: { supplierId: req.body.primarySupplierId, productId: current.id } });
    return tx.product.update({ where: { id: current.id }, data: { ...req.body, tracksExpiration: true }, include: { category: true, primarySupplier: true } });
  });
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
    supplierId: row.supplierId,
    productId: row.productId,
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

export const createSupplierProduct = asyncHandler(async (req: Request, res: Response) => {
  const [supplier, product] = await Promise.all([
    prisma.supplier.findUnique({ where: { id: req.body.supplierId }, select: { id: true, status: true } }),
    prisma.product.findUnique({ where: { id: req.body.productId }, select: { id: true, status: true } })
  ]);
  if (!supplier || supplier.status !== "ACTIVE") throw new AppError("Select an active supplier.", 422);
  if (!product || product.status !== ProductStatus.ACTIVE) throw new AppError("Select an active product.", 422);

  const existing = await prisma.supplierProduct.findUnique({
    where: { supplierId_productId: { supplierId: req.body.supplierId, productId: req.body.productId } },
    select: { id: true }
  });
  if (existing) throw new AppError("This supplier product already exists.", 409);

  const row = await prisma.supplierProduct.create({
    data: { supplierId: req.body.supplierId, productId: req.body.productId },
    include: { supplier: true, product: { include: { category: true } } }
  });
  const data = {
    id: row.id,
    supplierId: row.supplierId,
    productId: row.productId,
    supplier: row.supplier.name,
    product: row.product.name,
    sku: row.product.sku,
    barcode: row.product.barcode,
    category: row.product.category.name,
    currentStock: row.product.currentStock,
    costPrice: row.product.costPrice,
    sellingPrice: row.product.sellingPrice,
    status: row.product.status
  };
  await audit({ userId: req.user?.id, action: "SUPPLIER_PRODUCT_CREATE", module: "SUPPLIERS", recordId: row.id, newData: row });
  return created(res, "Supplier product added", serializeForPermissions(data, req.user?.permissions ?? []));
});

export const updateSupplierProduct = asyncHandler(async (req: Request, res: Response) => {
  const old = await prisma.supplierProduct.findUnique({ where: { id: req.params.id }, include: { supplier: true, product: true } });
  if (!old) throw new AppError("Supplier product not found", 404);

  const duplicate = await prisma.supplierProduct.findFirst({
    where: {
      supplierId: req.body.supplierId,
      productId: req.body.productId,
      id: { not: req.params.id }
    }
  });
  if (duplicate) throw new AppError("This supplier product already exists.", 409);

  const row = await prisma.supplierProduct.update({
    where: { id: req.params.id },
    data: { supplierId: req.body.supplierId, productId: req.body.productId },
    include: { supplier: true, product: { include: { category: true } } }
  });
  const data = {
    id: row.id,
    supplierId: row.supplierId,
    productId: row.productId,
    supplier: row.supplier.name,
    product: row.product.name,
    sku: row.product.sku,
    barcode: row.product.barcode,
    category: row.product.category.name,
    currentStock: row.product.currentStock,
    costPrice: row.product.costPrice,
    sellingPrice: row.product.sellingPrice,
    status: row.product.status
  };
  await audit({ userId: req.user?.id, action: "SUPPLIER_PRODUCT_UPDATE", module: "SUPPLIERS", recordId: row.id, oldData: old, newData: row });
  return ok(res, "Supplier product updated", serializeForPermissions(data, req.user?.permissions ?? []));
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

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const customerType = typeof req.query.customerType === "string" ? req.query.customerType : undefined;
  if (customerType && !["Regular", "Member", "Wholesale", "Walk-in"].includes(customerType)) throw new AppError("Invalid customer type filter", 422);
  const status = typeof req.query.status === "string" ? req.query.status.toUpperCase() : "ALL";
  if (!(["ALL", "ACTIVE", "ARCHIVED"] as string[]).includes(status)) throw new AppError("Invalid customer status filter", 422);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const phoneDigits = search.replace(/\D/g, "");
  const where: Prisma.CustomerWhereInput = {
    customerType: customerType === "Regular" ? { in: ["Regular", "Walk-in"] } : customerType,
    status: status === "ALL" ? undefined : status as ProductStatus,
    ...(search ? { OR: [
      { fullName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      ...(phoneDigits ? [{ phone: { contains: phoneDigits } }] : []),
      { email: { contains: search, mode: "insensitive" } }
    ] } : {})
  };
  const rows = await prisma.customer.findMany({
    where,
    include: {
      _count: { select: { sales: { where: { status: { in: ["COMPLETED", "PARTIALLY_REFUNDED", "REFUNDED"] } } } } }
    },
    orderBy: { fullName: "asc" }
  });
  return ok(res, "Customers loaded", serializeForPermissions(rows.map(({ _count, ...customer }) => ({ ...customer, totalPurchases: _count.sales })), req.user?.permissions ?? []));
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const include: Prisma.CustomerInclude = { loyaltyTransactions: { orderBy: { createdAt: "desc" }, take: 100 } };
  if (req.user?.permissions.includes("customers.view_purchase_history")) {
    include.sales = { include: { items: { include: { product: true } }, refunds: { include: { items: true } }, payments: true }, orderBy: { createdAt: "desc" }, take: 100 };
  }
  const customer = await prisma.customer.findUnique({ where: { id: req.params.id }, include });
  if (!customer) throw new AppError("Customer not found", 404);
  return ok(res, "Customer loaded", serializeForPermissions(customer, req.user?.permissions ?? []));
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customers.createCustomer(req.body);
  await audit({ userId: req.user?.id, action: "CUSTOMER_CREATE", module: "CUSTOMERS", recordId: customer.id, newData: customer });
  return created(res, "Customer created", customer);
});

export const createAnonymousMember = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customers.createAnonymousMember();
  await audit({ userId: req.user?.id, action: "CUSTOMER_ANONYMOUS_MEMBER_CREATE", module: "CUSTOMERS", recordId: customer.id, newData: customer });
  return created(res, "Anonymous member loyalty account created", customer);
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const old = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!old) throw new AppError("Customer not found", 404);
  if (req.body.customerType !== undefined && req.body.customerType !== old.customerType && !req.user?.permissions.includes("settings.update")) {
    throw new AppError("Only authorized administrators can change customer types.", 403);
  }
  const customer = await customers.updateCustomer(req.params.id, req.body);
  await audit({ userId: req.user?.id, action: "CUSTOMER_UPDATE", module: "CUSTOMERS", recordId: customer.id, oldData: old, newData: customer });
  return ok(res, "Customer updated", customer);
});

export const updateCustomerStatus = asyncHandler(async (req: Request, res: Response) => {
  const old = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!old) throw new AppError("Customer not found", 404);
  const customer = await customers.setCustomerStatus(req.params.id, req.body.status as ProductStatus);
  await audit({ userId: req.user?.id, action: "CUSTOMER_STATUS_UPDATE", module: "CUSTOMERS", recordId: customer.id, oldData: old, newData: customer });
  return ok(res, "Customer status updated", customer);
});

export const adjustCustomerLoyaltyPoints = asyncHandler(async (req: Request, res: Response) => {
  const result = await customers.adjustCustomerPoints(req.params.id, req.body.pointsDelta as number, req.body.reason as string);
  await audit({ userId: req.user?.id, action: "CUSTOMER_LOYALTY_ADJUSTMENT", module: "CUSTOMERS", recordId: req.params.id, newData: result });
  return created(res, "Customer points adjusted", result);
});

export const customerLoyaltySettings = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, "Loyalty settings loaded", await getLoyaltySettings());
});

export const updateCustomerLoyaltySettings = asyncHandler(async (req: Request, res: Response) => {
  const rules = normalizeLoyaltySettings(req.body);
  const old = await prisma.systemSetting.findUnique({ where: { key: loyaltySettingKey } });
  const setting = await prisma.systemSetting.upsert({
    where: { key: loyaltySettingKey },
    update: { value: rules as unknown as Prisma.InputJsonObject },
    create: { key: loyaltySettingKey, value: rules as unknown as Prisma.InputJsonObject }
  });
  await audit({ userId: req.user?.id, action: "LOYALTY_SETTINGS_UPDATE", module: "CUSTOMERS", recordId: setting.id, oldData: old?.value ?? defaultLoyaltySettings, newData: rules });
  return ok(res, "Loyalty settings saved", rules);
});
