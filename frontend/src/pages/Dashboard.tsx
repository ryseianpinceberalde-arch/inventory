import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "../components/ui/Card";
import { getData } from "../services/api";
import { peso } from "../lib/format";

interface DashboardData {
  summary: Record<string, number | string>;
  charts: { dailySales: Array<{ date: string; sales: number; profit: number }>; salesByCategory: Array<{ name: string; value: number }> };
  tables: {
    recentTransactions: Array<{ id: string; receiptNo: string; total: string }>;
    bestSellingProducts: Array<{ id: string; name: string; sku: string; quantitySold: number; revenue: number }>;
    lowStockProducts: Array<{ id: string; name: string; currentStock: number; reorderLevel: number }>;
  };
}

export function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => getData<DashboardData>("/dashboard") });
  if (isLoading || !data) return <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Card key={i} className="h-28 animate-pulse" />)}</div>;
  const summary = data.summary;
  const bestSellingProducts = data.tables.bestSellingProducts.slice(0, 3);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(summary).slice(0, 12).map(([key, value]) => (
          <Card key={key}><div className="text-xs uppercase text-slate-500">{key.replace(/[A-Z]/g, " $&")}</div><div className="mt-2 text-2xl font-bold">{String(key).toLowerCase().includes("sales") || String(key).toLowerCase().includes("profit") || String(key).toLowerCase().includes("value") ? peso(value) : value}</div></Card>
        ))}
        <Card className="sm:col-span-2 lg:col-span-2">
          <div className="text-xs uppercase text-slate-500">Top 3 best sale products</div>
          {bestSellingProducts.length > 0 ? (
            <div className="mt-3 space-y-3">
              {bestSellingProducts.map((product, index) => (
                <div className="flex items-center justify-between gap-4 border-t pt-3 first:border-t-0 first:pt-0" key={product.id}>
                  <div className="min-w-0">
                    <div className="truncate font-semibold" title={product.name}>{index + 1}. {product.name}</div>
                    <div className="text-xs text-slate-500">{product.sku}</div>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <div className="font-semibold">{product.quantitySold} sold</div>
                    <div className="text-slate-500">{peso(product.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-500">No completed sales yet</div>
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
