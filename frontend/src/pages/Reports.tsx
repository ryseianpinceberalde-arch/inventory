import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { getData } from "../services/api";
import { peso } from "../lib/format";
import { QueryState } from "../components/ui/QueryState";
import { Pagination } from "../components/ui/Pagination";
import { Input } from "../components/ui/Input";
import { useAuth } from "../contexts/AuthContext";
import type { ReportData } from "../services/reportExporters";

export const reports = [
  { slug: "daily-sales", title: "Daily Sales", description: "Transactions, items sold, net sales, COGS, profit, and average transaction value." },
  { slug: "monthly-sales", title: "Monthly Sales", description: "Sales per day, best sellers, category totals, payment methods, and employee sales." },
  { slug: "yearly-sales", title: "Yearly Sales", description: "Annual revenue, annual profit, monthly performance, and year comparison." },
  { slug: "products", title: "Product Sales", description: "Best-selling, least-selling, fast-moving, and slow-moving product summaries." },
  { slug: "categories", title: "Category Sales", description: "Quantity sold, gross sales, cost, profit, and margin by category." },
  { slug: "employees", title: "Employee Sales", description: "Transaction count, items sold, discounts, refunds, net sales, and average ticket." },
  { slug: "payments", title: "Payment Methods", description: "Collections by cash, GCash, Maya, bank transfer, cards, credit, and mixed payments." },
  { slug: "profit", title: "Profit Analysis", description: "Gross profit and profit margin by product, category, employee, day, month, and year." },
  { slug: "inventory-value", title: "Inventory Value", description: "Inventory cost, expected selling value, potential profit, category, and supplier value." },
  { slug: "supplier-performance", title: "Supplier Performance", description: "Completed deliveries, on-time rate, return rate, purchase value, and score." },
  { slug: "forecast", title: "Sales Forecast", description: "Three-month moving-average sales forecast and suggested reorder demand." }
];

function reportPermission(slug: string) {
  const names: Record<string, string> = { "daily-sales": "daily", "monthly-sales": "monthly", "yearly-sales": "yearly", "inventory-value": "inventory_value", "supplier-performance": "supplier_performance" };
  return `reports.${names[slug] ?? slug}`;
}

export function ReportsIndex() {
  const { hasPermission } = useAuth();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-slate-500">Sales, profit, inventory, supplier, payment, and forecast reports.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.filter((report) => hasPermission(reportPermission(report.slug))).map((report) => (
          <Link key={report.slug} to={`/reports/${report.slug}`}>
            <Card className="h-full transition hover:border-brand">
              <h2 className="font-bold">{report.title}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{report.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ReportDetail() {
  const { type = "daily-sales" } = useParams();
  const reportMeta = reports.find((report) => report.slug === type);
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const [page, setPage] = useState(1);
  const allowed = hasPermission(reportPermission(type));
  useEffect(() => { setPage(1); setFrom(searchParams.get("from") ?? ""); setTo(searchParams.get("to") ?? ""); }, [type, searchParams]);
  const [exporting, setExporting] = useState<"csv" | "excel" | "pdf" | null>(null);
  const queryString = searchParams.toString();
  const reportUrl = queryString ? `/reports/${type}?${queryString}` : `/reports/${type}`;
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["report", type, queryString], queryFn: () => getData<ReportData>(reportUrl), enabled: allowed });

  async function exportReport(format: "csv" | "excel" | "pdf") {
    if (!data) return;
    setExporting(format);
    try {
      const { exportReportCsv, exportReportExcel, exportReportPdf } = await import("../services/reportExporters");
      if (format === "csv") exportReportCsv(data);
      if (format === "excel") await exportReportExcel(data);
      if (format === "pdf") exportReportPdf(data);
      toast.success("Report exported successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Report export failed.");
    } finally {
      setExporting(null);
    }
  }

  if (!allowed) return <QueryState empty="You do not have permission to view this report." />;
  if (isError) return <QueryState error onRetry={() => void refetch()} />;
  if (isLoading || !data) return <QueryState loading />;

  const metrics = data.summary.map((item) => [
    item.label,
    item.type === "currency" ? peso(item.value) : item.type === "percent" ? `${Number(item.value).toFixed(2)}%` : item.value
  ]);
  const exportDisabled = Boolean(exporting);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">{reportMeta?.title ?? data.report}</h1>
          <p className="text-sm text-slate-500">{reportMeta?.description}</p>
        </div>
        {hasPermission("reports.export") && <div className="flex flex-wrap gap-2">
          <Button disabled={exportDisabled} onClick={() => void exportReport("csv")} className="bg-slate-700"><Download size={16} /> {exporting === "csv" ? "Generating..." : "CSV"}</Button>
          <Button disabled={exportDisabled} onClick={() => void exportReport("excel")} className="bg-emerald-700 hover:bg-emerald-800"><FileSpreadsheet size={16} /> {exporting === "excel" ? "Generating..." : "Excel"}</Button>
          <Button disabled={exportDisabled} onClick={() => void exportReport("pdf")} className="bg-accent"><FileText size={16} /> {exporting === "pdf" ? "Generating..." : "PDF"}</Button>
        </div>}
      </div>
      <Card><form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); if (from && to && from > to) { toast.error("Start date must be before end date"); return; } const params = new URLSearchParams(searchParams); if (from) params.set("from", from); else params.delete("from"); if (to) params.set("to", to); else params.delete("to"); setSearchParams(params); }}><label className="text-sm font-medium">From<Input className="mt-1" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label className="text-sm font-medium">To<Input className="mt-1" type="date" min={from || undefined} value={to} onChange={(event) => setTo(event.target.value)} /></label><Button type="submit">Apply dates</Button><Button type="button" className="bg-slate-700" onClick={() => setSearchParams({})}>Reset filters</Button></form><p className="mt-3 text-sm text-slate-500">Reporting period: {data.period} ? Asia/Manila</p></Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(([label, value]) => <Card key={label}><div className="text-xs uppercase text-slate-500">{label}</div><div className="mt-2 text-2xl font-bold">{value}</div></Card>)}
      </div>
      <Card>
        <h2 className="mb-4 font-semibold">Report details</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b text-xs uppercase text-slate-500">{data.columns.map((column) => <th key={column.key} className="py-3 pr-4">{column.label}</th>)}</tr></thead>
            <tbody>
              {data.rows.length === 0 && <tr><td className="py-6 text-slate-500" colSpan={data.columns.length}>No data is available for the selected reporting period.</td></tr>}
              {data.rows.slice((page - 1) * 25, page * 25).map((row, index) => (
                <tr key={index} className="border-b last:border-0">
                  {data.columns.map((column) => (
                    <td key={column.key} className="py-3 pr-4">
                      {column.type === "currency" ? peso(row[column.key] ?? 0) : column.type === "percent" ? `${Number(row[column.key] ?? 0).toFixed(2)}%` : String(row[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} pageSize={25} totalItems={data.rows.length} onPageChange={setPage} />
      </Card>
    </div>
  );
}
