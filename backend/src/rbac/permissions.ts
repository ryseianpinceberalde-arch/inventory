import { RoleName } from "@prisma/client";

export interface PermissionDefinition {
  key: string;
  name: string;
  module: string;
  description?: string;
}

const keys = [
  "dashboard.view",
  "products.view",
  "products.create",
  "products.update",
  "products.archive",
  "products.restore",
  "products.import",
  "products.export",
  "products.view_cost",
  "products.view_profit",
  "categories.view",
  "categories.create",
  "categories.update",
  "categories.archive",
  "barcodes.view",
  "barcodes.generate",
  "barcodes.print",
  "suppliers.view",
  "suppliers.create",
  "suppliers.update",
  "suppliers.archive",
  "suppliers.view_performance",
  "customers.view",
  "customers.create",
  "customers.update",
  "customers.archive",
  "customers.view_purchase_history",
  "inventory.view",
  "inventory.view_value",
  "inventory.stock_in",
  "inventory.stock_out",
  "inventory.adjustment_create",
  "inventory.adjustment_approve",
  "inventory.movement_view",
  "inventory.movement_export",
  "pos.access",
  "sales.create",
  "sales.view_own",
  "sales.view_all",
  "sales.cancel",
  "sales.hold",
  "sales.resume",
  "sales.reprint_receipt",
  "payments.process",
  "payments.view",
  "refunds.create",
  "refunds.approve",
  "refunds.view",
  "reports.daily",
  "reports.monthly",
  "reports.yearly",
  "reports.products",
  "reports.categories",
  "reports.payments",
  "reports.employees",
  "reports.profit",
  "reports.inventory_value",
  "reports.supplier_performance",
  "reports.forecast",
  "reports.export",
  "notifications.view",
  "notifications.manage",
  "users.view",
  "users.create",
  "users.update",
  "users.activate",
  "users.deactivate",
  "users.reset_password",
  "users.assign_role",
  "roles.view",
  "roles.create",
  "roles.update",
  "roles.delete",
  "roles.assign_permissions",
  "audit_logs.view",
  "settings.view",
  "settings.update"
] as const;

function titleFromKey(key: string) {
  const [, action] = key.split(".");
  return action.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const permissionDefinitions: PermissionDefinition[] = keys.map((key) => ({
  key,
  name: titleFromKey(key),
  module: key.split(".")[0],
  description: key
}));

export const allPermissionKeys = permissionDefinitions.map((permission) => permission.key);

export const defaultRolePermissions: Record<RoleName, string[]> = {
  [RoleName.ADMIN]: allPermissionKeys,
  [RoleName.MANAGER]: allPermissionKeys.filter((key) => ![
    "users.create",
    "users.deactivate",
    "users.reset_password",
    "users.assign_role",
    "roles.create",
    "roles.update",
    "roles.delete",
    "roles.assign_permissions",
    "audit_logs.view",
    "settings.update"
  ].includes(key)),
  [RoleName.CASHIER]: [
    "dashboard.view",
    "barcodes.view",
    "customers.view",
    "customers.create",
    "customers.update",
    "pos.access",
    "sales.create",
    "sales.view_own",
    "sales.hold",
    "sales.resume",
    "sales.reprint_receipt",
    "payments.process",
    "payments.view",
    "refunds.create",
    "refunds.view",
    "notifications.view"
  ],
  [RoleName.INVENTORY_STAFF]: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.update",
    "categories.view",
    "barcodes.view",
    "barcodes.generate",
    "barcodes.print",
    "suppliers.view",
    "inventory.view",
    "inventory.stock_in",
    "inventory.stock_out",
    "inventory.adjustment_create",
    "inventory.movement_view",
    "notifications.view"
  ]
};
