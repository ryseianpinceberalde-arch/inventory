const productCostFields = new Set(["costPrice", "supplierCost", "historicalCost", "markup", "profit", "grossProfit"]);
const inventoryValueFields = new Set(["inventoryValue", "totalInventoryCost", "expectedSellingValue", "potentialInventoryProfit"]);
const profitFields = new Set(["grossProfit", "netProfit", "profit", "profitMargin", "costOfGoodsSold", "totalProfit"]);

function stripFields(value: unknown, blocked: Set<string>): unknown {
  if (Array.isArray(value)) return value.map((item) => stripFields(item, blocked));
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  if ("toJSON" in value && typeof value.toJSON === "function") return value;
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (!blocked.has(key)) result[key] = stripFields(nested, blocked);
  }
  return result;
}

export function serializeForPermissions<T>(value: T, permissions: string[]): T {
  const blocked = new Set<string>();
  if (!permissions.includes("products.view_cost")) productCostFields.forEach((field) => blocked.add(field));
  if (!permissions.includes("inventory.view_value")) inventoryValueFields.forEach((field) => blocked.add(field));
  if (!permissions.includes("reports.profit")) profitFields.forEach((field) => blocked.add(field));
  if (blocked.size === 0) return value;
  return stripFields(value, blocked) as T;
}
