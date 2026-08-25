import { Request, Response } from "express";
import { RoleName } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import * as inventory from "../services/inventoryService.js";
import * as sales from "../services/salesService.js";
import { audit } from "../services/auditService.js";
import { serializeForPermissions } from "../rbac/serializers.js";

export const stockIn = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const receipt = await inventory.stockIn({ ...req.body, receivedById: req.user.id });
  await audit({ userId: req.user.id, action: "STOCK_IN", module: "INVENTORY", recordId: receipt.id, newData: receipt });
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
  const where = req.user.permissions.includes("sales.view_all") ? {} : { cashierId: req.user.id };
  return ok(res, "Sales loaded", serializeForPermissions(await prisma.sale.findMany({ where, include: { customer: true, cashier: true, items: { include: { product: true } }, payments: true }, orderBy: { createdAt: "desc" }, take: 200 }), req.user.permissions));
});

export const saleDetail = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication is required.", 401);
  const sale = await prisma.sale.findFirst({ where: { id: req.params.id, ...(req.user.permissions.includes("sales.view_all") ? {} : { cashierId: req.user.id }) }, include: { customer: true, cashier: true, items: { include: { product: true } }, payments: true, refunds: { include: { items: true } } } });
  if (!sale) throw new AppError("Sale not found", 404);
  return ok(res, "Sale loaded", serializeForPermissions(sale, req.user.permissions));
});

export const notifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const role = Object.values(RoleName).includes(req.user.roleName as RoleName) ? req.user.roleName as RoleName : undefined;
  return ok(res, "Notifications loaded", await prisma.notification.findMany({ where: { OR: [{ recipientRole: role }, { recipientRole: null }] }, include: { product: true }, orderBy: { createdAt: "desc" } }));
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, "Notification marked as read", await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } }));
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const role = Object.values(RoleName).includes(req.user.roleName as RoleName) ? req.user.roleName as RoleName : undefined;
  await prisma.notification.updateMany({ where: { recipientRole: role }, data: { isRead: true } });
  return ok(res, "Notifications marked as read", {});
});

export function canApprove(role?: RoleName) {
  return role === RoleName.ADMIN || role === RoleName.MANAGER;
}
