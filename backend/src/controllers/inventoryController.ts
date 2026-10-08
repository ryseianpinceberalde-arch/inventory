import { Request, Response } from "express";
import { Prisma, RoleName } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import * as inventory from "../services/inventoryService.js";
import * as sales from "../services/salesService.js";
import { audit } from "../services/auditService.js";
import { serializeForPermissions } from "../rbac/serializers.js";
import { salesListQuerySchema } from "../validators/inventoryValidators.js";

export const stockIn = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const priceUpdates = (req.body.items as { productId: string; sellingPrice?: string }[]).filter((item) => item.sellingPrice !== undefined);
  if (priceUpdates.length && !req.user.permissions.includes("products.update")) throw new AppError("You do not have permission to update product prices.", 403);
  const receipt = await inventory.stockIn({ ...req.body, receivedById: req.user.id });
  await audit({ userId: req.user.id, action: "STOCK_IN", module: "INVENTORY", recordId: receipt.id, newData: priceUpdates.length ? { ...receipt, productSellingPrices: priceUpdates } : receipt });
  return created(res, "Stock-in completed", serializeForPermissions(receipt, req.user.permissions));
});

export const stockOut = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const movement = await inventory.stockOut({ ...req.body, employeeId: req.user.id });
  await audit({ userId: req.user.id, action: "STOCK_OUT", module: "INVENTORY", recordId: movement.id, newData: movement });
  return created(res, "Stock-out completed", serializeForPermissions(movement, req.user.permissions));
});

export const createAdjustment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const adjustment = await inventory.requestAdjustment({ ...req.body, requestedById: req.user.id });
  return created(res, "Inventory adjustment recorded", adjustment);
});

export const heldSales = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  return ok(res, "Held orders loaded", serializeForPermissions(await sales.listHeldSales(req.user.id), req.user.permissions));
});

export const holdSale = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const heldSale = await sales.holdSale({ ...req.body, cashierId: req.user.id });
  await audit({ userId: req.user.id, action: "SALE_HOLD", module: "SALES", recordId: heldSale.id, newData: heldSale });
  return created(res, "Order held", serializeForPermissions(heldSale, req.user.permissions));
});

export const deleteHeldSale = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  await sales.deleteHeldSale(req.params.id, req.user.id);
  await audit({ userId: req.user.id, action: "SALE_RESUME", module: "SALES", recordId: req.params.id });
  return ok(res, "Held order removed", {});
});

export const approveAdjustment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const adjustment = await inventory.approveAdjustment(req.params.id, req.user.id);
  await audit({ userId: req.user.id, action: "INVENTORY_ADJUSTMENT_APPROVED", module: "INVENTORY", recordId: adjustment.id });
  return ok(res, "Inventory adjustment approved", serializeForPermissions(adjustment, req.user.permissions));
});

export const movements = asyncHandler(async (req: Request, res: Response) => {
  const where = {
    productId: typeof req.query.productId === "string" ? req.query.productId : undefined,
    createdAt: typeof req.query.from === "string" || typeof req.query.to === "string"
      ? { gte: typeof req.query.from === "string" ? new Date(req.query.from) : undefined, lte: typeof req.query.to === "string" ? new Date(req.query.to) : undefined }
      : undefined
  };
  return ok(res, "Stock movements loaded", serializeForPermissions(await prisma.stockMovement.findMany({ where, include: { product: true, employee: true }, orderBy: { createdAt: "desc" }, take: 200 }), req.user?.permissions ?? []));
});

export const adjustments = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Adjustments loaded", serializeForPermissions(await prisma.inventoryAdjustment.findMany({ include: { product: true, requestedBy: true, approvedBy: true }, orderBy: { createdAt: "desc" } }), req.user?.permissions ?? []));
});

export const lowStock = asyncHandler(async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({ where: { status: "ACTIVE" }, include: { category: true } });
  return ok(res, "Low stock products loaded", serializeForPermissions(products.filter((product) => product.currentStock <= product.reorderLevel), req.user?.permissions ?? []));
});

export const completeSale = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const sale = await sales.completeSale({ ...req.body, cashierId: req.user.id });
  await audit({ userId: req.user.id, action: "COMPLETED_SALE", module: "SALES", recordId: sale.id, newData: sale });
  return created(res, "Sale completed", serializeForPermissions(sale, req.user.permissions));
});

export const processRefund = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const refund = await sales.processRefund({ ...req.body, processedById: req.user.id });
  await audit({ userId: req.user.id, action: "REFUND", module: "REFUNDS", recordId: refund.id, newData: refund });
  return created(res, "Refund processed", refund);
});

export const salesList = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication is required.", 401);
  const filters = salesListQuerySchema.parse(req.query);
  const where: Prisma.SaleWhereInput = req.user.permissions.includes("sales.view_all") ? {} : { cashierId: req.user.id };
  if (filters.status) where.status = filters.status;
  if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;

  const from = filters.from ? new Date(`${filters.from}T00:00:00+08:00`) : undefined;
  const to = filters.to ? new Date(`${filters.to}T00:00:00+08:00`) : undefined;
  if (to) to.setUTCDate(to.getUTCDate() + 1);
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) };
  return ok(res, "Sales loaded", serializeForPermissions(await prisma.sale.findMany({ where, include: { customer: true, cashier: true, items: { include: { product: true } }, payments: true }, orderBy: { createdAt: "desc" }, take: 200 }), req.user.permissions));
});

export const saleDetail = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication is required.", 401);
  const sale = await prisma.sale.findFirst({ where: { id: req.params.id, ...(req.user.permissions.includes("sales.view_all") ? {} : { cashierId: req.user.id }) }, include: { customer: true, cashier: true, items: { include: { product: true } }, payments: true, refunds: { include: { items: true } } } });
  if (!sale) throw new AppError("Sale not found", 404);
  return ok(res, "Sale loaded", serializeForPermissions(sale, req.user.permissions));
});

export function notificationScope(roleName: string): Prisma.NotificationWhereInput {
  const role = Object.values(RoleName).find((name) => name === roleName);
  return role ? { OR: [{ recipientRole: role }, { recipientRole: null }] } : { recipientRole: null };
}

export const notifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  return ok(res, "Notifications loaded", serializeForPermissions(await prisma.notification.findMany({ where: notificationScope(req.user.roleName), include: { product: true }, orderBy: { createdAt: "desc" } }), req.user.permissions));
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const result = await prisma.notification.updateMany({ where: { id: req.params.id, ...notificationScope(req.user.roleName) }, data: { isRead: true } });
  if (!result.count) throw new AppError("Notification not found", 404);
  return ok(res, "Notification marked as read", {});
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  await prisma.notification.updateMany({ where: notificationScope(req.user.roleName), data: { isRead: true } });
  return ok(res, "Notifications marked as read", {});
});

export function canApprove(role?: RoleName) {
  return role === RoleName.ADMIN || role === RoleName.MANAGER;
}
