import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KeyboardEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { getData } from "../services/api";
import { peso } from "../lib/format";
import { useAuth } from "../contexts/AuthContext";

interface DashboardData {
  summary: Record<string, number | string>;
  charts: { dailySales: Array<{ date: string; sales: number; profit: number }>; salesByCategory: Array<{ name: string; value: number }> };
  tables: {
    recentTransactions: Array<{ id: string; receiptNo: string; total: string }>;
    bestSellingProducts: Array<{ id: string; name: string; sku: string; quantitySold: number; revenue: number }>;
    lowStockProducts: Array<{ id: string; name: string; currentStock: number; reorderLevel: number }>;
  };
}

const summaryRoutes: Record<string, { to: string; permissions: string[] }> = {
  todaySales: { to: "/sales", permissions: ["sales.view_all", "sales.view_own"] },
  monthlySales: { to: "/sales", permissions: ["sales.view_all", "sales.view_own"] },
  yearlySales: { to: "/sales", permissions: ["sales.view_all", "sales.view_own"] },
  grossSales: { to: "/sales", permissions: ["sales.view_all", "sales.view_own"] },
  netSales: { to: "/sales", permissions: ["sales.view_all", "sales.view_own"] },
  grossProfit: { to: "/reports/profit", permissions: ["reports.profit"] },
  totalProducts: { to: "/products", permissions: ["products.view"] },
  totalCustomers: { to: "/customers", permissions: ["customers.view"] },
  totalSuppliers: { to: "/suppliers", permissions: ["suppliers.view"] },
  totalEmployees: { to: "/employees", permissions: ["users.view"] },
  inventoryValue: { to: "/reports/inventory-value", permissions: ["reports.inventory_value"] },
  lowStockProducts: { to: "/inventory/low-stock", permissions: ["inventory.view"] }
};

const summaryCardColors: Record<string, string> = {
  todaySales: "!border-teal-300 !bg-teal-200 dark:!border-teal-700 dark:!bg-teal-900",
  monthlySales: "!border-sky-300 !bg-sky-200 dark:!border-sky-700 dark:!bg-sky-900",
  yearlySales: "!border-purple-300 !bg-purple-200 dark:!border-purple-700 dark:!bg-purple-900",
  grossSales: "!border-green-300 !bg-green-200 dark:!border-green-700 dark:!bg-green-900",
  netSales: "!border-blue-300 !bg-blue-200 dark:!border-blue-700 dark:!bg-blue-900",
  grossProfit: "!border-amber-300 !bg-amber-200 dark:!border-amber-700 dark:!bg-amber-900",
  totalProducts: "!border-orange-300 !bg-orange-200 dark:!border-orange-700 dark:!bg-orange-900",
  totalCustomers: "!border-teal-300 !bg-teal-200 dark:!border-teal-700 dark:!bg-teal-900",
  totalSuppliers: "!border-slate-300 !bg-slate-200 dark:!border-slate-600 dark:!bg-slate-700",
  totalEmployees: "!border-purple-300 !bg-purple-200 dark:!border-purple-700 dark:!bg-purple-900",
  inventoryValue: "!border-green-300 !bg-green-200 dark:!border-green-700 dark:!bg-green-900",
  lowStockProducts: "!border-red-300 !bg-red-200 dark:!border-red-700 dark:!bg-red-900",
  outOfStockProducts: "!border-red-300 !bg-red-200 dark:!border-red-700 dark:!bg-red-900",
  pendingSupplierDeliveries: "!border-amber-300 !bg-amber-200 dark:!border-amber-700 dark:!bg-amber-900"
};

function labelForSummaryKey(key: string) {
  return key.replace(/[A-Z]/g, " $&");
}

function summaryValue(key: string, value: number | string) {
  return String(key).toLowerCase().includes("sales") || String(key).toLowerCase().includes("profit") || String(key).toLowerCase().includes("value") ? peso(value) : value;
}

function DashboardSummaryCard({ children, to, label, colorClass }: { children: ReactNode; to?: string; label: string; colorClass: string }) {
  const navigate = useNavigate();

  function onKeyDown(event: KeyboardEvent<HTMLAnchorElement>) {
    if (event.key !== " ") return;
    event.preventDefault();
    navigate(to ?? "/dashboard");
  }

  const card = (
    <Card className={`${colorClass} dashboard-card-zoom ${to ? "dashboard-card-clickable" : ""}`}>
      {children}
    </Card>
  );

  if (!to) return card;

  return (
    <Link to={to} className="dashboard-card-link focus-visible:no-underline" aria-label={`Open ${label}`} onKeyDown={onKeyDown}>
      {card}
    </Link>
  );
}

export function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => getData<DashboardData>("/dashboard") });
  const { hasAnyPermission } = useAuth();
  if (isLoading || !data) return <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Card key={i} className="h-28 animate-pulse" />)}</div>;
  const summary = data.summary;
  const bestSellingProducts = data.tables.bestSellingProducts.slice(0, 3);
  return (
    <div className="space-y-6">
      <div className="dashboard-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(summary).slice(0, 12).map(([key, value]) => {
          const route = summaryRoutes[key];
          const label = labelForSummaryKey(key);
          const to = route && hasAnyPermission(route.permissions) ? route.to : undefined;
          const colorClass = summaryCardColors[key] ?? "!border-slate-300 !bg-slate-200 dark:!border-slate-600 dark:!bg-slate-700";
          return (
            <DashboardSummaryCard key={key} to={to} label={label} colorClass={colorClass}>
              <div className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-200">{label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{summaryValue(key, value)}</div>
            </DashboardSummaryCard>
          );
        })}
        <Card className="dashboard-card-zoom !border-indigo-300 !bg-indigo-200 dark:!border-indigo-700 dark:!bg-indigo-900 sm:col-span-2 lg:col-span-2">
          <div className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-200">Top 3 best sale products</div>
          {bestSellingProducts.length > 0 ? (
            <div className="mt-3 space-y-3">
              {bestSellingProducts.map((product, index) => (
                <div className="flex items-center justify-between gap-4 border-t border-indigo-300 pt-3 first:border-t-0 first:pt-0 dark:border-indigo-700" key={product.id}>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-950 dark:text-white" title={product.name}>{index + 1}. {product.name}</div>
                    <div className="text-xs text-slate-700 dark:text-slate-200">{product.sku}</div>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <div className="font-semibold text-slate-950 dark:text-white">{product.quantitySold} sold</div>
                    <div className="text-slate-700 dark:text-slate-200">{peso(product.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">No completed sales yet</div>
          )}
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><h2 className="mb-4 font-semibold">Revenue versus profit</h2><ResponsiveContainer width="100%" height={280}><LineChart data={data.charts.dailySales}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line dataKey="sales" stroke="#0f766e" /><Line dataKey="profit" stroke="#c2410c" /></LineChart></ResponsiveContainer></Card>
        <Card><h2 className="mb-4 font-semibold">Sales by category</h2><ResponsiveContainer width="100%" height={280}><PieChart><Pie dataKey="value" data={data.charts.salesByCategory} fill="#0f766e" label /></PieChart></ResponsiveContainer></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><h2 className="mb-4 font-semibold">Recent transactions</h2>{data.tables.recentTransactions.map((sale) => <div className="flex justify-between border-t py-2 text-sm" key={sale.id}><span>{sale.receiptNo}</span><strong>{peso(sale.total)}</strong></div>)}</Card>
        <Card><h2 className="mb-4 font-semibold">Low-stock products</h2><ResponsiveContainer width="100%" height={240}><BarChart data={data.tables.lowStockProducts}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="currentStock" fill="#c2410c" /></BarChart></ResponsiveContainer></Card>
      </div>
    </div>
  );
}
