import { saleLineTotals, saleTotals } from "../utils/saleTotals.js";
import { PaymentMethod, Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError.js";
import { businessDateKey, businessDayStart } from "../utils/businessDate.js";
import { prisma } from "../config/prisma.js";

type CellValue = string | number;
type ValueKind = "text" | "number" | "currency" | "percent" | "date" | "datetime" | "time";

export interface ReportColumn {
  key: string;
  label: string;
  type?: ValueKind;
}

export interface ReportSection {
  title: string;
  columns: ReportColumn[];
  rows: Record<string, CellValue>[];
}

export interface ReportPayload {
  report: string;
  title: string;
  period: string;
  generatedAt: Date;
  generatedBy: string;
  business: { name: string; address: string; contactNumber: string; email: string; logoUrl?: string };
  summary: Array<{ label: string; value: CellValue; type?: ValueKind }>;
  columns: ReportColumn[];
  rows: Record<string, CellValue>[];
  sections: ReportSection[];
}

function number(value: Prisma.Decimal | number | string | null | undefined) {
  return Number(value ?? 0);
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function margin(profit: number, sales: number) {
  return sales === 0 ? 0 : round((profit / sales) * 100);
}

function dateKey(value: Date) {
  return businessDateKey(value);
}

function startOfDay(value: Date) {
  return businessDayStart(value);
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function defaultPeriod(type: string) {
  const today = startOfDay(new Date());
  const key = dateKey(today);
  if (type === "monthly-sales") {
    const first = new Date(`${key.slice(0, 7)}-01T00:00:00+08:00`);
    const next = new Date(`${key.slice(0, 7)}-01T00:00:00Z`);
    next.setUTCMonth(next.getUTCMonth() + 1);
    return { from: first, to: addDays(new Date(next.getTime() - 8 * 3600000), -1) };
  }
  if (type === "yearly-sales") return { from: new Date(`${key.slice(0, 4)}-01-01T00:00:00+08:00`), to: new Date(`${key.slice(0, 4)}-12-31T00:00:00+08:00`) };
  if (type === "daily-sales") return { from: today, to: today };
  return { from: undefined, to: undefined };
}

function parsePeriod(query: Record<string, unknown>, type: string) {
  const fallback = defaultPeriod(type);
  function parse(value: unknown, fallbackDate?: Date) {
    if (value === undefined || value === "") return fallbackDate;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new AppError("Use a valid date in YYYY-MM-DD format", 422);
    const parsed = new Date(`${value}T00:00:00+08:00`);
    if (!Number.isFinite(parsed.getTime()) || dateKey(parsed) !== value) throw new AppError("Invalid report date", 422);
    return parsed;
  }
  const from = parse(query.from, fallback.from);
  const toBase = parse(query.to, fallback.to);
  if (from && toBase && from > toBase) throw new AppError("Start date must be before end date", 422);
  return { from, to: toBase ? addDays(toBase, 1) : undefined, labelTo: toBase };
}

function inPeriod<T extends { createdAt: Date }>(rows: T[], from?: Date, to?: Date) {
  return rows.filter((row) => (!from || row.createdAt >= from) && (!to || row.createdAt < to));
}

function filterSales(sales: Awaited<ReturnType<typeof baseSales>>, query: Record<string, unknown>) {
  return sales.filter((sale) => {
    if (typeof query.employeeId === "string" && sale.cashierId !== query.employeeId) return false;
    if (typeof query.paymentMethod === "string" && sale.paymentMethod !== query.paymentMethod) return false;
    if (typeof query.productId === "string" && !sale.items.some((item) => item.productId === query.productId)) return false;
    if (typeof query.categoryId === "string" && !sale.items.some((item) => item.product.categoryId === query.categoryId)) return false;
    if (typeof query.supplierId === "string" && !sale.items.some((item) => item.product.primarySupplierId === query.supplierId)) return false;
    return true;
  });
}

function periodLabel(from?: Date, labelTo?: Date) {
  if (!from && !labelTo) return "All Time";
  const start = from ? dateKey(from) : "Beginning";
  const end = labelTo ? dateKey(labelTo) : "Present";
  return start === end ? start : `${start} to ${end}`;
}

async function business() {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "business" } });
  const value = setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value) ? setting.value as Record<string, unknown> : {};
  return {
    name: typeof value.name === "string" ? value.name : "SmartStock",
    address: typeof value.address === "string" ? value.address : "",
    contactNumber: typeof value.contactNumber === "string" ? value.contactNumber : "",
    email: typeof value.email === "string" ? value.email : "",
    logoUrl: typeof value.logoUrl === "string" ? value.logoUrl : undefined
  };
}

const transactionColumns: ReportColumn[] = [
  { key: "invoice", label: "Invoice Number" },
  { key: "date", label: "Date", type: "date" },
  { key: "time", label: "Time", type: "time" },
  { key: "cashier", label: "Cashier" },
  { key: "itemsSold", label: "Items Sold", type: "number" },
  { key: "grossSales", label: "Gross Sales", type: "currency" },
  { key: "discount", label: "Discount", type: "currency" },
  { key: "refund", label: "Refund", type: "currency" },
  { key: "netSales", label: "Net Sales", type: "currency" },
  { key: "cogs", label: "COGS", type: "currency" },
  { key: "profit", label: "Profit", type: "currency" },
  { key: "paymentMethod", label: "Payment Method" }
];

async function baseSales() {
  return prisma.sale.findMany({
    where: { status: { in: ["COMPLETED", "PARTIALLY_REFUNDED", "REFUNDED"] } },
    include: { customer: true, cashier: true, payments: true, refunds: { include: { items: true } }, items: { include: { product: { include: { category: true, primarySupplier: true } } } } },
    orderBy: { createdAt: "desc" }
  });
}

function saleRows(sales: Awaited<ReturnType<typeof baseSales>>) {
  return sales.map((sale) => {
    const totals = saleTotals(sale);
    return {
      invoice: sale.receiptNo,
      date: dateKey(sale.createdAt),
      time: new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit" }).format(sale.createdAt),
      cashier: sale.cashier?.fullName ?? "Deleted employee",
      ...totals,
      paymentMethod: sale.paymentMethod
    };
  });
}

function salesSummary(rows: Record<string, CellValue>[], labelPrefix = "") {
  const gross = rows.reduce((sum, row) => sum + Number(row.grossSales ?? 0), 0);
  const discount = rows.reduce((sum, row) => sum + Number(row.discount ?? 0), 0);
  const refund = rows.reduce((sum, row) => sum + Number(row.refund ?? 0), 0);
  const net = rows.reduce((sum, row) => sum + Number(row.netSales ?? 0), 0);
  const cogs = rows.reduce((sum, row) => sum + Number(row.cogs ?? 0), 0);
  const profit = rows.reduce((sum, row) => sum + Number(row.profit ?? 0), 0);
  const items = rows.reduce((sum, row) => sum + Number(row.itemsSold ?? 0), 0);
  return [
    { label: `${labelPrefix}Transactions`.trim(), value: rows.length, type: "number" as const },
    { label: "Items Sold", value: items, type: "number" as const },
    { label: "Gross Sales", value: round(gross), type: "currency" as const },
    { label: "Discounts", value: round(discount), type: "currency" as const },
    { label: "Refunds", value: round(refund), type: "currency" as const },
    { label: "Net Sales", value: round(net), type: "currency" as const },
    { label: "COGS", value: round(cogs), type: "currency" as const },
    { label: "Gross Profit", value: round(profit), type: "currency" as const },
    { label: "Profit Margin", value: margin(profit, net), type: "percent" as const },
    { label: "Average Transaction Value", value: rows.length ? round(net / rows.length) : 0, type: "currency" as const }
  ];
}

function aggregateRows(rows: Record<string, CellValue>[], key: string): Record<string, CellValue>[] {
  const map = new Map<string, Record<string, CellValue>>();
  for (const row of rows) {
    const group = String(row[key] ?? "Unassigned");
    const current = map.get(group) ?? { [key]: group, transactions: 0, itemsSold: 0, grossSales: 0, discount: 0, refund: 0, netSales: 0, cogs: 0, profit: 0 };
    current.transactions = Number(current.transactions) + 1;
    for (const field of ["itemsSold", "grossSales", "discount", "refund", "netSales", "cogs", "profit"]) current[field] = round(Number(current[field]) + Number(row[field] ?? 0));
    map.set(group, current);
  }
  return Array.from(map.values()).map((row): Record<string, CellValue> => ({ ...row, profitMargin: margin(Number(row.profit), Number(row.netSales)) })).sort((a, b) => Number(b.netSales) - Number(a.netSales));
}

function section(title: string, columns: ReportColumn[], rows: Record<string, CellValue>[]): ReportSection {
  return { title, columns, rows };
}

export async function buildReport(type: string, query: Record<string, unknown>, generatedBy: string): Promise<ReportPayload> {
  const { from, to, labelTo } = parsePeriod(query, type);
  const biz = await business();
  const sales = filterSales(inPeriod(await baseSales(), from, to), query);
  if (["products", "categories"].includes(type)) for (const sale of sales) sale.items = sale.items.filter((item) => (!query.productId || item.productId === query.productId) && (!query.categoryId || item.product.categoryId === query.categoryId) && (!query.supplierId || item.product.primarySupplierId === query.supplierId));
  const transactions = saleRows(sales);
  const title = titleFor(type);
  const period = periodLabel(from, labelTo);

  if (type === "inventory-value") return inventoryValueReport(title, period, generatedBy, biz, query);
  if (type === "supplier-performance") return supplierReport(title, period, generatedBy, biz);
  if (type === "forecast") return forecastReport(title, period, generatedBy, biz, saleRows(await baseSales()));
  if (type === "products") return productSalesReport(title, period, generatedBy, biz, sales);
  if (type === "categories") return categorySalesReport(title, period, generatedBy, biz, sales);
  if (type === "employees") return employeeSalesReport(title, period, generatedBy, biz, transactions);
  if (type === "payments") return paymentReport(title, period, generatedBy, biz, transactions);
  if (type === "profit") return profitReport(title, period, generatedBy, biz, transactions);
  if (type === "monthly-sales") return monthlyReport(title, period, generatedBy, biz, transactions);
  if (type === "yearly-sales") return yearlyReport(title, period, generatedBy, biz, transactions);

  return {
    report: type,
    title,
    period,
    generatedAt: new Date(),
    generatedBy,
    business: biz,
    summary: salesSummary(transactions),
    columns: transactionColumns,
    rows: transactions,
    sections: []
  };
}

function titleFor(type: string) {
  const titles: Record<string, string> = {
    "daily-sales": "Daily Sales Report",
    "monthly-sales": "Monthly Sales Report",
    "yearly-sales": "Yearly Sales Report",
    products: "Product Sales Report",
    categories: "Category Sales Report",
    employees: "Employee Sales Report",
    payments: "Payment Methods Report",
    profit: "Profit Analysis Report",
    "inventory-value": "Inventory Value Report",
    "supplier-performance": "Supplier Performance Report",
    forecast: "Sales Forecast Report"
  };
  return titles[type] ?? "Report";
}

function monthlyReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], rows: Record<string, CellValue>[]): ReportPayload {
  const dailyColumns: ReportColumn[] = [
    { key: "date", label: "Date", type: "date" },
    { key: "transactions", label: "Transactions", type: "number" },
    { key: "itemsSold", label: "Items Sold", type: "number" },
    { key: "grossSales", label: "Gross Sales", type: "currency" },
    { key: "netSales", label: "Net Sales", type: "currency" },
    { key: "cogs", label: "COGS", type: "currency" },
    { key: "profit", label: "Profit", type: "currency" },
    { key: "profitMargin", label: "Profit Margin", type: "percent" }
  ];
  const daily = aggregateRows(rows, "date").sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return { report: "monthly-sales", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: salesSummary(rows, "Monthly"), columns: dailyColumns, rows: daily, sections: [section("Transaction Details", transactionColumns, rows)] };
}

function yearlyReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], rows: Record<string, CellValue>[]): ReportPayload {
  const monthly = aggregateRows(rows.map((row) => ({ ...row, month: String(row.date).slice(0, 7) })), "month").sort((a, b) => String(a.month).localeCompare(String(b.month)));
  const columns: ReportColumn[] = [
    { key: "month", label: "Month" },
    { key: "transactions", label: "Transactions", type: "number" },
    { key: "itemsSold", label: "Items Sold", type: "number" },
    { key: "netSales", label: "Net Sales", type: "currency" },
    { key: "cogs", label: "COGS", type: "currency" },
    { key: "profit", label: "Profit", type: "currency" },
    { key: "profitMargin", label: "Profit Margin", type: "percent" }
  ];
  return { report: "yearly-sales", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: salesSummary(rows, "Annual"), columns, rows: monthly, sections: [section("Transaction Details", transactionColumns, rows)] };
}

function productSalesReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], sales: Awaited<ReturnType<typeof baseSales>>): ReportPayload {
  const map = new Map<string, Record<string, CellValue>>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const totals = saleLineTotals(sale, item);
      const current = map.get(item.productId) ?? { sku: item.product.sku, productName: item.product.name, category: item.product.category.name, quantitySold: 0, grossSales: 0, discount: 0, netSales: 0, cogs: 0, profit: 0 };
      current.quantitySold = Number(current.quantitySold) + totals.itemsSold;
      current.grossSales = round(Number(current.grossSales) + totals.grossSales);
      current.discount = round(Number(current.discount) + totals.discount);
      current.netSales = round(Number(current.netSales) + totals.netSales);
      current.cogs = round(Number(current.cogs) + totals.cogs);
      current.profit = round(Number(current.profit) + totals.profit);
      map.set(item.productId, current);
    }
  }
  const rows = Array.from(map.values()).sort((a, b) => Number(b.quantitySold) - Number(a.quantitySold)).map((row, index) => ({ ...row, profitMargin: margin(Number(row.profit), Number(row.netSales)), salesRank: index + 1 }));
  const columns: ReportColumn[] = [
    { key: "sku", label: "SKU" }, { key: "productName", label: "Product Name" }, { key: "category", label: "Category" }, { key: "quantitySold", label: "Quantity Sold", type: "number" }, { key: "grossSales", label: "Gross Sales", type: "currency" }, { key: "discount", label: "Discount", type: "currency" }, { key: "netSales", label: "Net Sales", type: "currency" }, { key: "cogs", label: "COGS", type: "currency" }, { key: "profit", label: "Profit", type: "currency" }, { key: "profitMargin", label: "Profit Margin", type: "percent" }, { key: "salesRank", label: "Sales Rank", type: "number" }
  ];
  return { report: "products", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: salesSummary(saleRows(sales)), columns, rows, sections: [section("Least Selling Products", columns, [...rows].reverse())] };
}

function categorySalesReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], sales: Awaited<ReturnType<typeof baseSales>>): ReportPayload {
  const map = new Map<string, Record<string, CellValue>>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const totals = saleLineTotals(sale, item);
      const category = item.product.category.name;
      const current = map.get(category) ?? { category, itemsSold: 0, grossSales: 0, discount: 0, netSales: 0, cogs: 0, profit: 0 };
      current.itemsSold = Number(current.itemsSold) + totals.itemsSold;
      current.grossSales = round(Number(current.grossSales) + totals.grossSales);
      current.discount = round(Number(current.discount) + totals.discount);
      current.netSales = round(Number(current.netSales) + totals.netSales);
      current.cogs = round(Number(current.cogs) + totals.cogs);
      current.profit = round(Number(current.profit) + totals.profit);
      map.set(category, current);
    }
  }
  const groupedRows: Record<string, CellValue>[] = Array.from(map.values()).map((row): Record<string, CellValue> => ({ ...row, profitMargin: margin(Number(row.profit), Number(row.netSales)) }));
  const rows = groupedRows.sort((a, b) => Number(b.netSales) - Number(a.netSales));
  const columns: ReportColumn[] = [
    { key: "category", label: "Category" }, { key: "itemsSold", label: "Items Sold", type: "number" }, { key: "grossSales", label: "Gross Sales", type: "currency" }, { key: "discount", label: "Discount", type: "currency" }, { key: "netSales", label: "Net Sales", type: "currency" }, { key: "cogs", label: "COGS", type: "currency" }, { key: "profit", label: "Profit", type: "currency" }, { key: "profitMargin", label: "Profit Margin", type: "percent" }
  ];
  return { report: "categories", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: salesSummary(saleRows(sales)), columns, rows, sections: [] };
}

function employeeSalesReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], rows: Record<string, CellValue>[]): ReportPayload {
  const employeeRows = aggregateRows(rows.map((row) => ({ ...row, employee: row.cashier })), "employee");
  return { report: "employees", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: salesSummary(rows), columns: aggregateColumns("employee", "Employee"), rows: employeeRows, sections: [] };
}

function paymentReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], rows: Record<string, CellValue>[]): ReportPayload {
  const netSales = rows.reduce((sum, row) => sum + Number(row.netSales ?? 0), 0);
  const paymentRows = Object.values(PaymentMethod).map((method) => {
    const methodRows = rows.filter((row) => row.paymentMethod === method);
    const amount = methodRows.reduce((sum, row) => sum + Number(row.netSales ?? 0), 0);
    return { paymentMethod: method, transactionCount: methodRows.length, amountCollected: round(amount), percentageOfTotalSales: margin(amount, netSales) };
  }).filter((row) => row.transactionCount > 0);
  const columns: ReportColumn[] = [
    { key: "paymentMethod", label: "Payment Method" }, { key: "transactionCount", label: "Transaction Count", type: "number" }, { key: "amountCollected", label: "Amount Collected", type: "currency" }, { key: "percentageOfTotalSales", label: "Percentage of Total Sales", type: "percent" }
  ];
  return { report: "payments", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: salesSummary(rows), columns, rows: paymentRows, sections: [] };
}

function profitReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], rows: Record<string, CellValue>[]): ReportPayload {
  return { report: "profit", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: salesSummary(rows), columns: aggregateColumns("date", "Day"), rows: aggregateRows(rows, "date"), sections: [section("By Employee", aggregateColumns("employee", "Employee"), aggregateRows(rows.map((row) => ({ ...row, employee: row.cashier })), "employee")), section("Transaction Details", transactionColumns, rows)] };
}

function aggregateColumns(key: string, label: string): ReportColumn[] {
  return [
    { key, label },
    { key: "transactions", label: "Transaction Count", type: "number" },
    { key: "itemsSold", label: "Items Sold", type: "number" },
    { key: "grossSales", label: "Gross Sales", type: "currency" },
    { key: "discount", label: "Discount", type: "currency" },
    { key: "refund", label: "Refund", type: "currency" },
    { key: "netSales", label: "Net Sales", type: "currency" },
    { key: "cogs", label: "COGS", type: "currency" },
    { key: "profit", label: "Profit", type: "currency" },
    { key: "profitMargin", label: "Profit Margin", type: "percent" }
  ];
}

async function inventoryValueReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], query: Record<string, unknown> = {}): Promise<ReportPayload> {
  const products = await prisma.product.findMany({
    where: {
      id: typeof query.productId === "string" ? query.productId : undefined,
      categoryId: typeof query.categoryId === "string" ? query.categoryId : undefined,
      primarySupplierId: typeof query.supplierId === "string" ? query.supplierId : undefined
    },
    include: { category: true, primarySupplier: true },
    orderBy: { name: "asc" }
  });
  const rows = products.map((product) => {
    const inventoryCost = number(product.costPrice) * product.currentStock;
    const expectedSellingValue = number(product.sellingPrice) * product.currentStock;
    return {
      sku: product.sku,
      product: product.name,
      category: product.category.name,
      supplier: product.primarySupplier?.name ?? "",
      currentStock: product.currentStock,
      unitCost: number(product.costPrice),
      inventoryCost: round(inventoryCost),
      sellingPrice: number(product.sellingPrice),
      expectedSellingValue: round(expectedSellingValue),
      potentialGrossProfit: round(expectedSellingValue - inventoryCost),
      stockStatus: product.currentStock === 0 ? "Out of Stock" : product.currentStock <= product.reorderLevel ? "Low Stock" : "In Stock"
    };
  });
  const columns: ReportColumn[] = [
    { key: "sku", label: "SKU" }, { key: "product", label: "Product" }, { key: "category", label: "Category" }, { key: "supplier", label: "Supplier" }, { key: "currentStock", label: "Current Stock", type: "number" }, { key: "unitCost", label: "Unit Cost", type: "currency" }, { key: "inventoryCost", label: "Inventory Cost", type: "currency" }, { key: "sellingPrice", label: "Selling Price", type: "currency" }, { key: "expectedSellingValue", label: "Expected Selling Value", type: "currency" }, { key: "potentialGrossProfit", label: "Potential Gross Profit", type: "currency" }, { key: "stockStatus", label: "Stock Status" }
  ];
  return { report: "inventory-value", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: [{ label: "Total Products", value: rows.length, type: "number" }, { label: "Total Units", value: rows.reduce((sum, row) => sum + Number(row.currentStock), 0), type: "number" }, { label: "Total Inventory Cost", value: round(rows.reduce((sum, row) => sum + Number(row.inventoryCost), 0)), type: "currency" }, { label: "Expected Selling Value", value: round(rows.reduce((sum, row) => sum + Number(row.expectedSellingValue), 0)), type: "currency" }, { label: "Potential Gross Profit", value: round(rows.reduce((sum, row) => sum + Number(row.potentialGrossProfit), 0)), type: "currency" }, { label: "Low Stock Items", value: rows.filter((row) => row.stockStatus === "Low Stock").length, type: "number" }, { label: "Out of Stock Items", value: rows.filter((row) => row.stockStatus === "Out of Stock").length, type: "number" }], columns, rows, sections: [] };
}

async function supplierReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"]): Promise<ReportPayload> {
  const suppliers = await prisma.supplier.findMany({ include: { deliveries: { include: { items: true } }, evaluations: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { name: "asc" } });
  const rows = suppliers.map((supplier) => {
    const totalPurchaseValue = supplier.deliveries.reduce((sum, delivery) => sum + number(delivery.totalAmount), 0);
    const completed = supplier.deliveries.filter((delivery) => delivery.completedAt);
    const onTime = completed.filter((delivery) => delivery.expectedDate && delivery.completedAt && delivery.completedAt <= delivery.expectedDate).length;
    const late = completed.length - onTime;
    return { supplier: supplier.name, totalPurchaseValue: round(totalPurchaseValue), deliveries: supplier.deliveries.length, completedDeliveries: completed.length, onTimeDeliveries: onTime, lateDeliveries: late, returnedItems: 0, returnRate: number(supplier.evaluations[0]?.returnRate), onTimeRate: number(supplier.evaluations[0]?.onTimeDeliveryPercentage), performanceScore: number(supplier.evaluations[0]?.performanceScore) };
  });
  const columns: ReportColumn[] = [
    { key: "supplier", label: "Supplier" }, { key: "totalPurchaseValue", label: "Total Purchase Value", type: "currency" }, { key: "deliveries", label: "Deliveries", type: "number" }, { key: "completedDeliveries", label: "Completed Deliveries", type: "number" }, { key: "onTimeDeliveries", label: "On-Time Deliveries", type: "number" }, { key: "lateDeliveries", label: "Late Deliveries", type: "number" }, { key: "returnedItems", label: "Returned Items", type: "number" }, { key: "returnRate", label: "Return Rate", type: "percent" }, { key: "onTimeRate", label: "On-Time Rate", type: "percent" }, { key: "performanceScore", label: "Performance Score", type: "number" }
  ];
  return { report: "supplier-performance", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: [{ label: "Suppliers", value: rows.length, type: "number" }, { label: "Total Purchase Value", value: round(rows.reduce((sum, row) => sum + Number(row.totalPurchaseValue), 0)), type: "currency" }, { label: "Completed Deliveries", value: rows.reduce((sum, row) => sum + Number(row.completedDeliveries), 0), type: "number" }], columns, rows, sections: [] };
}

function forecastReport(title: string, period: string, generatedBy: string, biz: ReportPayload["business"], rows: Record<string, CellValue>[]): ReportPayload {
  const monthly = aggregateRows(rows.map((row) => ({ ...row, month: String(row.date).slice(0, 7) })), "month").sort((a, b) => String(a.month).localeCompare(String(b.month)));
  const forecastRows = monthly.map((row, index) => {
    const previous = monthly.slice(Math.max(0, index - 2), index + 1);
    const movingAverage = previous.length ? previous.reduce((sum, item) => sum + Number(item.netSales), 0) / previous.length : 0;
    return { historicalSalesPeriod: row.month, historicalSales: Number(row.netSales), movingAverage: round(movingAverage), forecastSales: round(movingAverage), suggestedDemand: round(movingAverage), suggestedReorderQuantity: 0 };
  });
  const columns: ReportColumn[] = [
    { key: "historicalSalesPeriod", label: "Historical Sales Period" }, { key: "historicalSales", label: "Historical Sales", type: "currency" }, { key: "movingAverage", label: "Moving Average", type: "currency" }, { key: "forecastSales", label: "Forecast Sales", type: "currency" }, { key: "suggestedDemand", label: "Suggested Demand", type: "currency" }, { key: "suggestedReorderQuantity", label: "Suggested Reorder Quantity", type: "number" }
  ];
  return { report: "forecast", title, period, generatedAt: new Date(), generatedBy, business: biz, summary: [{ label: "Historical Periods", value: forecastRows.length, type: "number" }, { label: "Forecast Method", value: "3-month moving average" }, { label: "Latest Forecast / Estimated", value: forecastRows.at(-1)?.forecastSales ?? 0, type: "currency" }], columns, rows: forecastRows, sections: [] };
}
