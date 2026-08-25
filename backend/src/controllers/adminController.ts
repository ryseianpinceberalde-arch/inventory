import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { Request, Response } from "express";
import { Prisma, RoleName } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, ok } from "../utils/apiResponse.js";
import { audit } from "../services/auditService.js";
import { AppError } from "../utils/AppError.js";
import { serializeForPermissions } from "../rbac/serializers.js";

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  status: true,
  role: true,
  createdAt: true,
  updatedAt: true
};

function isAdminRoleName(name?: string) {
  return name === RoleName.ADMIN;
}

async function ensureCanTouchUser(actor: Express.User | undefined, targetRoleId?: string) {
  if (!actor) throw new AppError("Authentication is required.", 401);
  if (!targetRoleId) return;
  const targetRole = await prisma.role.findUnique({ where: { id: targetRoleId } });
  if (!targetRole) throw new AppError("Role not found", 404);
  if (isAdminRoleName(targetRole.name) && !isAdminRoleName(actor.roleName)) {
    throw new AppError("You do not have permission to perform this action.", 403);
  }
}

function has(permission: string, user?: Express.User) {
  return Boolean(user?.permissions.includes(permission));
}

export const users = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, "Users loaded", await prisma.user.findMany({ select: userSelect, orderBy: { fullName: "asc" } }));
});

export const user = asyncHandler(async (req: Request, res: Response) => {
  const row = await prisma.user.findUnique({ where: { id: req.params.id }, select: userSelect });
  if (!row) throw new AppError("User not found", 404);
  await ensureCanTouchUser(req.user, row.role.id);
  return ok(res, "User loaded", row);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  await ensureCanTouchUser(req.user, req.body.roleId);
  const user = await prisma.user.create({
    data: { ...req.body, passwordHash: await bcrypt.hash(req.body.password, 12), password: undefined },
    select: userSelect
  });
  await audit({ userId: req.user?.id, action: "USER_CREATE", module: "USERS", recordId: user.id, newData: user });
  return created(res, "User created", user);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const old = await prisma.user.findUnique({ where: { id: req.params.id }, select: userSelect });
  if (!old) throw new AppError("User not found", 404);
  await ensureCanTouchUser(req.user, old.role.id);
  if (req.body.roleId) {
    if (!has("users.assign_role", req.user)) throw new AppError("You do not have permission to perform this action.", 403);
    await ensureCanTouchUser(req.user, req.body.roleId);
  }
  const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body, select: userSelect });
  await audit({ userId: req.user?.id, action: "USER_UPDATE", module: "USERS", recordId: user.id, oldData: old, newData: user, ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "User updated", user);
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = req.body.status;
  if (status !== "ACTIVE" && status !== "INACTIVE") throw new AppError("Invalid user status", 422);
  if (req.params.id === req.user?.id && status === "INACTIVE") throw new AppError("You cannot deactivate your own account.", 409);
  if (status === "ACTIVE" && !has("users.activate", req.user)) throw new AppError("You do not have permission to perform this action.", 403);
  if (status === "INACTIVE" && !has("users.deactivate", req.user)) throw new AppError("You do not have permission to perform this action.", 403);
  const old = await prisma.user.findUnique({ where: { id: req.params.id }, select: userSelect });
  if (!old) throw new AppError("User not found", 404);
  await ensureCanTouchUser(req.user, old.role.id);
  if (status === "INACTIVE" && isAdminRoleName(old.role.name)) {
    const activeAdmins = await prisma.user.count({ where: { status: "ACTIVE", role: { name: RoleName.ADMIN } } });
    if (activeAdmins <= 1) throw new AppError("The final active Admin cannot be deactivated.", 409);
  }
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status }, select: userSelect });
  await audit({ userId: req.user?.id, action: status === "ACTIVE" ? "USER_ACTIVATED" : "USER_DEACTIVATED", module: "USERS", recordId: user.id, oldData: old, newData: user, ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "User status updated", user);
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const roleId = req.body.roleId;
  if (typeof roleId !== "string") throw new AppError("roleId is required", 422);
  const old = await prisma.user.findUnique({ where: { id: req.params.id }, select: userSelect });
  if (!old) throw new AppError("User not found", 404);
  await ensureCanTouchUser(req.user, old.role.id);
  await ensureCanTouchUser(req.user, roleId);
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { roleId }, select: userSelect });
  await audit({ userId: req.user?.id, action: "USER_ROLE_CHANGED", module: "USERS", recordId: user.id, oldData: old.role, newData: user.role, ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "User role updated", user);
});

export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const password = typeof req.body.password === "string" ? req.body.password : crypto.randomUUID();
  const old = await prisma.user.findUnique({ where: { id: req.params.id }, select: userSelect });
  if (!old) throw new AppError("User not found", 404);
  await ensureCanTouchUser(req.user, old.role.id);
  await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  await audit({ userId: req.user?.id, action: "USER_PASSWORD_RESET", module: "USERS", recordId: req.params.id, ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "Password reset", process.env.NODE_ENV === "development" ? { password } : {});
});

export const roles = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, "Roles loaded", await prisma.role.findMany({ include: { rolePermissions: { include: { permission: true } }, _count: { select: { users: true } } }, orderBy: { name: "asc" } }));
});

export const role = asyncHandler(async (req: Request, res: Response) => {
  const row = await prisma.role.findUnique({ where: { id: req.params.id }, include: { rolePermissions: { include: { permission: true } }, users: { select: userSelect } } });
  if (!row) throw new AppError("Role not found", 404);
  return ok(res, "Role loaded", row);
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (name.length < 2) throw new AppError("Role name is required", 422);
  const role = await prisma.role.create({ data: { name, description: req.body.description, isSystem: false } });
  await audit({ userId: req.user?.id, action: "ROLE_CREATED", module: "ROLES", recordId: role.id, newData: role, ipAddress: req.ip, userAgent: req.get("user-agent") });
  return created(res, "Role created", role);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const old = await prisma.role.findUnique({ where: { id: req.params.id } });
  if (!old) throw new AppError("Role not found", 404);
  if (old.name === RoleName.ADMIN && !isAdminRoleName(req.user?.roleName)) throw new AppError("You do not have permission to perform this action.", 403);
  const role = await prisma.role.update({ where: { id: req.params.id }, data: { name: req.body.name, description: req.body.description } });
  await audit({ userId: req.user?.id, action: "ROLE_UPDATED", module: "ROLES", recordId: role.id, oldData: old, newData: role, ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "Role updated", role);
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await prisma.role.findUnique({ where: { id: req.params.id }, include: { _count: { select: { users: true } } } });
  if (!role) throw new AppError("Role not found", 404);
  if (role.isSystem) throw new AppError("System roles cannot be deleted.", 409);
  if (role._count.users > 0) throw new AppError("Role still has assigned users.", 409);
  await prisma.role.delete({ where: { id: role.id } });
  await audit({ userId: req.user?.id, action: "ROLE_DELETED", module: "ROLES", recordId: role.id, oldData: role, ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "Role deleted", {});
});

export const updateRolePermissions = asyncHandler(async (req: Request, res: Response) => {
  const keys = Array.isArray(req.body.permissionKeys) ? req.body.permissionKeys : req.body.permissions;
  if (!Array.isArray(keys) || keys.some((key) => typeof key !== "string")) throw new AppError("permissionKeys must be an array", 422);
  const updated = await prisma.$transaction(async (tx) => {
    const role = await tx.role.findUnique({ where: { id: req.params.id }, include: { rolePermissions: { include: { permission: true } } } });
    if (!role) throw new AppError("Role not found", 404);
    if (role.name === RoleName.ADMIN && !isAdminRoleName(req.user?.roleName)) throw new AppError("You do not have permission to perform this action.", 403);
    const permissions = await tx.permission.findMany({ where: { key: { in: keys } } });
    if (permissions.length !== new Set(keys).size) throw new AppError("One or more permissions are invalid.", 422);
    const currentKeys = new Set(role.rolePermissions.map((row) => row.permission.key));
    const nextKeys = new Set(keys);
    const removed = [...currentKeys].filter((key) => !nextKeys.has(key));
    const added = [...nextKeys].filter((key) => !currentKeys.has(key));
    if (!isAdminRoleName(req.user?.roleName)) {
      const unauthorized = [...added, ...removed].filter((key) => !req.user?.permissions.includes(key));
      if (unauthorized.length > 0) throw new AppError("You cannot assign permissions you do not control.", 403, unauthorized);
    }
    await tx.rolePermission.deleteMany({ where: { roleId: role.id, permission: { key: { in: removed } } } });
    for (const permission of permissions.filter((permission) => added.includes(permission.key))) {
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id }
      });
    }
    await tx.auditLog.create({ data: { userId: req.user?.id, action: "ROLE_PERMISSIONS_UPDATED", module: "ROLES", recordId: role.id, oldData: { permissions: [...currentKeys] }, newData: { permissions: keys }, ipAddress: req.ip, userAgent: req.get("user-agent") } });
    return tx.role.findUniqueOrThrow({ where: { id: role.id }, include: { rolePermissions: { include: { permission: true } }, _count: { select: { users: true } } } });
  });
  return ok(res, "Role permissions updated", updated);
});

export const permissions = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, "Permissions loaded", await prisma.permission.findMany({ orderBy: [{ module: "asc" }, { key: "asc" }] }));
});

export const groupedPermissions = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await prisma.permission.findMany({ orderBy: [{ module: "asc" }, { key: "asc" }] });
  const grouped = rows.reduce<Record<string, typeof rows>>((acc, permission) => {
    acc[permission.module] = acc[permission.module] ?? [];
    acc[permission.module].push(permission);
    return acc;
  }, {});
  return ok(res, "Grouped permissions loaded", grouped);
});

export const auditLogs = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, "Audit logs loaded", await prisma.auditLog.findMany({ include: { user: { select: userSelect } }, orderBy: { createdAt: "desc" }, take: 300 }));
});

export const settings = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, "Settings loaded", await prisma.systemSetting.findMany({ orderBy: { key: "asc" } }));
});

export const saveSetting = asyncHandler(async (req: Request, res: Response) => {
  const setting = await prisma.systemSetting.upsert({
    where: { key: req.body.key },
    update: { value: req.body.value },
    create: { key: req.body.key, value: req.body.value }
  });
  await audit({ userId: req.user?.id, action: "SETTINGS_UPDATE", module: "SETTINGS", recordId: setting.id, newData: setting });
  return ok(res, "Setting saved", setting);
});

export const dashboard = asyncHandler(async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startYear = new Date(today.getFullYear(), 0, 1);
  const [sales, products, customers, suppliers, employees, pendingDeliveries, movements] = await Promise.all([
    prisma.sale.findMany({ where: { status: "COMPLETED" }, include: { items: { include: { product: { include: { category: true } } } }, cashier: true, payments: true }, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE" }, include: { category: true } }),
    prisma.customer.count(),
    prisma.supplier.count(),
    prisma.user.count(),
    prisma.supplierDelivery.count({ where: { completedAt: null } }),
    prisma.stockMovement.findMany({ include: { product: true, employee: true }, orderBy: { createdAt: "desc" }, take: 10 })
  ]);
  const sumSales = (from: Date) => sales.filter((sale) => sale.createdAt >= from).reduce((sum, sale) => sum.add(sale.total), new Prisma.Decimal(0));
  const inventoryValue = products.reduce((sum, product) => sum.add(product.costPrice.mul(product.currentStock)), new Prisma.Decimal(0));
  const grossProfit = sales.reduce((sum, sale) => sum.add(sale.grossProfit), new Prisma.Decimal(0));
  const lowStock = products.filter((product) => product.currentStock <= product.reorderLevel);
  const salesByCategory = new Map<string, Prisma.Decimal>();
  const productSales = new Map<string, { id: string; name: string; sku: string; quantitySold: number; revenue: Prisma.Decimal }>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const name = item.product.category.name;
      salesByCategory.set(name, (salesByCategory.get(name) ?? new Prisma.Decimal(0)).add(item.lineTotal));
      const current = productSales.get(item.productId) ?? {
        id: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        quantitySold: 0,
        revenue: new Prisma.Decimal(0)
      };
      current.quantitySold += item.quantity;
      current.revenue = current.revenue.add(item.lineTotal);
      productSales.set(item.productId, current);
    }
  }
  const bestSellingProducts = Array.from(productSales.values())
    .sort((a, b) => b.quantitySold - a.quantitySold || Number(b.revenue.sub(a.revenue)))
    .slice(0, 3)
    .map((product) => ({ ...product, revenue: Number(product.revenue) }));
  const dailySales = Array.from({ length: 14 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (13 - index));
    const next = new Date(date);
    next.setDate(date.getDate() + 1);
    return {
      date: date.toISOString().slice(0, 10),
      sales: sales.filter((sale) => sale.createdAt >= date && sale.createdAt < next).reduce((sum, sale) => sum + Number(sale.total), 0),
      profit: sales.filter((sale) => sale.createdAt >= date && sale.createdAt < next).reduce((sum, sale) => sum + Number(sale.grossProfit), 0)
    };
  });
  return ok(res, "Dashboard loaded", serializeForPermissions({
    summary: {
      todaySales: sumSales(today),
      monthlySales: sumSales(startMonth),
      yearlySales: sumSales(startYear),
      grossSales: sales.reduce((sum, sale) => sum.add(sale.subtotal), new Prisma.Decimal(0)),
      netSales: sales.reduce((sum, sale) => sum.add(sale.total), new Prisma.Decimal(0)),
      grossProfit,
      totalProducts: products.length,
      totalCustomers: customers,
      totalSuppliers: suppliers,
      totalEmployees: employees,
      inventoryValue,
      lowStockProducts: lowStock.length,
      outOfStockProducts: products.filter((product) => product.currentStock === 0).length,
      pendingSupplierDeliveries: pendingDeliveries
    },
    charts: {
      dailySales,
      salesByCategory: Array.from(salesByCategory.entries()).map(([name, value]) => ({ name, value: Number(value) })),
      paymentMethods: Object.values(RoleName).map((name) => ({ name, value: 0 }))
    },
    tables: {
      recentTransactions: sales.slice(0, 10),
      bestSellingProducts,
      lowStockProducts: lowStock.slice(0, 10),
      outOfStockProducts: products.filter((product) => product.currentStock === 0).slice(0, 10),
      recentStockMovements: movements
    }
  }, req.user?.permissions ?? []));
});

export const report = asyncHandler(async (req: Request, res: Response) => {
  const sales = await prisma.sale.findMany({ include: { items: { include: { product: { include: { category: true } } } }, payments: true, cashier: true }, orderBy: { createdAt: "desc" } });
  const grossSales = sales.reduce((sum, sale) => sum.add(sale.subtotal), new Prisma.Decimal(0));
  const netSales = sales.reduce((sum, sale) => sum.add(sale.total), new Prisma.Decimal(0));
  const profit = sales.reduce((sum, sale) => sum.add(sale.grossProfit), new Prisma.Decimal(0));
  if (req.params.type === "profit" && !req.user?.permissions.includes("reports.profit")) {
    throw new AppError("You do not have permission to perform this action.", 403);
  }
  const itemsSold = sales.flatMap((sale) => sale.items).reduce((sum, item) => sum + item.quantity, 0);
  return ok(res, "Report loaded", serializeForPermissions({
    report: req.params.type ?? "summary",
    generatedAt: new Date(),
    transactionCount: sales.length,
    itemsSold,
    grossSales,
    netSales,
    profit,
    averageTransactionValue: sales.length ? netSales.div(sales.length) : new Prisma.Decimal(0),
    rows: sales.slice(0, 100)
  }, req.user?.permissions ?? []));
});

export const supplierPerformance = asyncHandler(async (req: Request, res: Response) => {
  const suppliers = await prisma.supplier.findMany({ include: { deliveries: true, evaluations: { orderBy: { createdAt: "desc" }, take: 1 } } });
  return ok(res, "Supplier performance loaded", serializeForPermissions(suppliers.map((supplier) => ({
    supplier,
    completedDeliveries: supplier.deliveries.filter((delivery) => delivery.completedAt).length,
    onTimeRate: supplier.evaluations[0]?.onTimeDeliveryPercentage ?? 0,
    performanceScore: supplier.evaluations[0]?.performanceScore ?? 0
  })), req.user?.permissions ?? []));
});
