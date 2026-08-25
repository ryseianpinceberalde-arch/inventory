import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import { Download, FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { getData } from "../services/api";
import { peso } from "../lib/format";

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

interface ReportData {
  report: string;
  generatedAt: string;
  transactionCount: number;
  itemsSold: number;
  grossSales: string;
  netSales: string;
  profit: string;
  averageTransactionValue: string;
  rows: Array<{ id: string; receiptNo: string; total: string; status: string; createdAt: string }>;
}

export function ReportsIndex() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-slate-500">Sales, profit, inventory, supplier, payment, and forecast reports.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
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
  const { data, isLoading } = useQuery({ queryKey: ["report", type], queryFn: () => getData<ReportData>(`/reports/${type}`) });

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Report", reportMeta?.title ?? data.report],
      ["Transaction Count", data.transactionCount],
      ["Items Sold", data.itemsSold],
      ["Gross Sales", data.grossSales],
      ["Net Sales", data.netSales],
      ["Profit", data.profit],
      ["Average Transaction Value", data.averageTransactionValue]
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    if (!data) return;
    const doc = new jsPDF();
    doc.text(reportMeta?.title ?? data.report, 14, 16);
    doc.text(`Transactions: ${data.transactionCount}`, 14, 28);
    doc.text(`Items sold: ${data.itemsSold}`, 14, 38);
    doc.text(`Gross sales: ${peso(data.grossSales)}`, 14, 48);
    doc.text(`Net sales: ${peso(data.netSales)}`, 14, 58);
    doc.text(`Profit: ${peso(data.profit)}`, 14, 68);
    doc.save(`${type}-report.pdf`);
  }

  if (isLoading || !data) return <Card className="h-40 animate-pulse" />;

  const metrics = [
    ["Transactions", data.transactionCount],
    ["Items Sold", data.itemsSold],
    ["Gross Sales", peso(data.grossSales)],
    ["Net Sales", peso(data.netSales)],
    ["Profit", peso(data.profit)],
    ["Average Ticket", peso(data.averageTransactionValue)]
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">{reportMeta?.title ?? data.report}</h1>
          <p className="text-sm text-slate-500">{reportMeta?.description}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCsv} className="bg-slate-700"><Download size={16} /> CSV</Button>
          <Button onClick={exportPdf} className="bg-accent"><FileText size={16} /> PDF</Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(([label, value]) => <Card key={label}><div className="text-xs uppercase text-slate-500">{label}</div><div className="mt-2 text-2xl font-bold">{value}</div></Card>)}
      </div>
      <Card>
        <h2 className="mb-4 font-semibold">Recent source transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b text-xs uppercase text-slate-500"><th className="py-3">Receipt</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{data.rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="py-3">{row.receiptNo}</td><td>{peso(row.total)}</td><td>{row.status}</td><td>{new Date(row.createdAt).toLocaleString()}</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
