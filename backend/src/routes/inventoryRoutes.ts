import { Router } from "express";
import { authenticate, requireAnyPermission, requirePermission } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as controller from "../controllers/inventoryController.js";
import { adjustmentSchema, refundSchema, saleSchema, stockInSchema, stockOutSchema } from "../validators/inventoryValidators.js";

export const inventoryRoutes = Router();
inventoryRoutes.use(authenticate);
inventoryRoutes.get("/", requirePermission("inventory.view"), controller.lowStock);
inventoryRoutes.get("/low-stock", requirePermission("inventory.view"), controller.lowStock);

export const stockInRoutes = Router();
stockInRoutes.use(authenticate);
stockInRoutes.post("/", requirePermission("inventory.stock_in"), validate(stockInSchema), controller.stockIn);

export const stockOutRoutes = Router();
stockOutRoutes.use(authenticate);
stockOutRoutes.post("/", requirePermission("inventory.stock_out"), validate(stockOutSchema), controller.stockOut);

export const movementRoutes = Router();
movementRoutes.use(authenticate);
movementRoutes.get("/", requirePermission("inventory.movement_view"), controller.movements);

export const adjustmentRoutes = Router();
adjustmentRoutes.use(authenticate);
adjustmentRoutes.get("/", requirePermission("inventory.view"), controller.adjustments);
adjustmentRoutes.post("/", requirePermission("inventory.adjustment_create"), validate(adjustmentSchema), controller.createAdjustment);
adjustmentRoutes.post("/:id/approve", requirePermission("inventory.adjustment_approve"), controller.approveAdjustment);

export const posRoutes = Router();
posRoutes.use(authenticate);
posRoutes.post("/sales", requirePermission("pos.access"), requirePermission("sales.create"), validate(saleSchema), controller.completeSale);

export const salesRoutes = Router();
salesRoutes.use(authenticate);
salesRoutes.get("/", requireAnyPermission(["sales.view_all", "sales.view_own"]), controller.salesList);
salesRoutes.post("/", requirePermission("sales.create"), validate(saleSchema), controller.completeSale);
salesRoutes.get("/:id", requireAnyPermission(["sales.view_all", "sales.view_own"]), controller.saleDetail);

export const refundRoutes = Router();
refundRoutes.use(authenticate);
refundRoutes.post("/", requirePermission("refunds.create"), validate(refundSchema), controller.processRefund);

export const notificationRoutes = Router();
notificationRoutes.use(authenticate);
notificationRoutes.get("/", requirePermission("notifications.view"), controller.notifications);
notificationRoutes.post("/mark-all-read", requirePermission("notifications.manage"), controller.markAllRead);
notificationRoutes.post("/:id/read", requirePermission("notifications.view"), controller.markNotificationRead);
