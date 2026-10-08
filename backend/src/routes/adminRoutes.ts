import { Router } from "express";
import { authenticate, requireAnyPermission, requirePermission } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as controller from "../controllers/adminController.js";
import { createUserSchema, updateUserSchema } from "../validators/userValidators.js";
import { z } from "zod";

export const userRoutes = Router();
userRoutes.use(authenticate);
userRoutes.get("/", requirePermission("users.view"), controller.users);
userRoutes.post("/", requirePermission("users.create"), validate(createUserSchema), controller.createUser);
userRoutes.get("/:id", requirePermission("users.view"), controller.user);
userRoutes.put("/:id", requirePermission("users.update"), validate(updateUserSchema), controller.updateUser);
userRoutes.patch("/:id", requirePermission("users.update"), validate(updateUserSchema), controller.updateUser);
userRoutes.patch("/:id/status", requireAnyPermission(["users.activate", "users.deactivate"]), controller.updateUserStatus);
userRoutes.patch("/:id/role", requirePermission("users.assign_role"), validate(z.object({ roleId: z.string().uuid() })), controller.updateUserRole);
userRoutes.post("/:id/reset-password", requirePermission("users.reset_password"), validate(z.object({ password: z.string().min(8).max(72) })), controller.resetUserPassword);

export const roleRoutes = Router();
roleRoutes.use(authenticate);
roleRoutes.get("/", requirePermission("roles.view"), controller.roles);
roleRoutes.post("/", requirePermission("roles.create"), validate(z.object({ name: z.string().trim().min(2).max(80), description: z.string().max(500).optional() })), controller.createRole);
roleRoutes.get("/:id", requirePermission("roles.view"), controller.role);
roleRoutes.patch("/:id", requirePermission("roles.update"), validate(z.object({ name: z.string().trim().min(2).max(80).optional(), description: z.string().max(500).optional() })), controller.updateRole);
roleRoutes.delete("/:id", requirePermission("roles.delete"), controller.deleteRole);
roleRoutes.put("/:id/permissions", requirePermission("roles.assign_permissions"), controller.updateRolePermissions);

export const permissionRoutes = Router();
permissionRoutes.use(authenticate);
permissionRoutes.get("/", requirePermission("roles.view"), controller.permissions);
permissionRoutes.get("/grouped", requirePermission("roles.view"), controller.groupedPermissions);

export const auditRoutes = Router();
auditRoutes.use(authenticate);
auditRoutes.get("/filter-options", requirePermission("audit_logs.view"), controller.auditLogFilterOptions);
auditRoutes.get("/", requirePermission("audit_logs.view"), controller.auditLogs);

export const settingRoutes = Router();
settingRoutes.use(authenticate);
settingRoutes.get("/", requirePermission("settings.view"), controller.settings);
settingRoutes.post("/", requirePermission("settings.update"), validate(z.object({ key: z.string().min(1), value: z.unknown() })), controller.saveSetting);

export const dashboardRoutes = Router();
dashboardRoutes.use(authenticate);
dashboardRoutes.get("/", requirePermission("dashboard.view"), controller.dashboard);

export const reportRoutes = Router();
reportRoutes.use(authenticate);
reportRoutes.get("/:type", requireAnyPermission(["reports.daily", "reports.monthly", "reports.yearly", "reports.products", "reports.categories", "reports.payments", "reports.employees", "reports.profit", "reports.inventory_value", "reports.supplier_performance", "reports.forecast"]), controller.report);

export const supplierPerformanceRoutes = Router();
supplierPerformanceRoutes.use(authenticate);
supplierPerformanceRoutes.get("/", requirePermission("reports.supplier_performance"), controller.supplierPerformance);
