import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import jsPDF from "jspdf";
import { Archive, Barcode, Camera, Download, FileText, Hash, Plus, Printer, RotateCcw, Search, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BarcodeLabel } from "../components/barcode/BarcodeLabel";
import { CameraBarcodeScanner } from "../components/barcode/CameraBarcodeScanner";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { api, getData } from "../services/api";
import { Can } from "../components/rbac/Can";

interface ResourcePageProps {
  title: string;
  endpoint: string;
  columns: string[];
  showCreate?: boolean;
}

type Row = Record<string, unknown>;

interface ProductFormState {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  primarySupplierId: string;
  description: string;
  costPrice: string;
  sellingPrice: string;
  currentStock: string;
  reorderLevel: string;
  unit: string;
  imageUrl: string;
  tracksExpiration: boolean;
}

const emptyProductForm: ProductFormState = {
  name: "",
  sku: "",
  barcode: "",
  categoryId: "",
  primarySupplierId: "",
  description: "",
  costPrice: "",
  sellingPrice: "",
  currentStock: "0",
  reorderLevel: "0",
  unit: "pcs",
  imageUrl: "",
  tracksExpiration: false
};

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("name" in value && typeof value.name === "string") return value.name;
    if ("fullName" in value && typeof value.fullName === "string") return value.fullName;
    return "";
  }
  return String(value);
}

function filename(title: string, extension: "csv" | "pdf") {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "export"}.${extension}`;
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function ean13CheckDigit(firstTwelveDigits: string) {
  const sum = [...firstTwelveDigits].reduce((total, digit, index) => {
    return total + Number(digit) * (index % 2 === 0 ? 1 : 3);
  }, 0);
  return String((10 - (sum % 10)) % 10);
}

function generateProductBarcode() {
  const firstTwelveDigits = `20${Date.now().toString().slice(-10)}`;
  return `${firstTwelveDigits}${ean13CheckDigit(firstTwelveDigits)}`;
}

function generateSkuFromBarcode(barcode: string) {
  return `SKU-${barcode.replace(/[^A-Za-z0-9]+/g, "").slice(-12) || Date.now()}`;
}

function resourcePermissionPrefix(title: string) {
  const firstWord = title.toLowerCase().split(" ")[0];
  if (firstWord === "product" || firstWord === "products") return "products";
  if (firstWord === "employee" || firstWord === "employees") return "users";
  if (firstWord === "stock") return "inventory";
  return firstWord;
}

export function ResourcePage({ title, endpoint, columns, showCreate = true }: ResourcePageProps) {
  const [search, setSearch] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showBarcodeCamera, setShowBarcodeCamera] = useState(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Row | null>(null);
  const [labelQuantity, setLabelQuantity] = useState("1");
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [importedSource, setImportedSource] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: [endpoint], queryFn: () => getData<Row[]>(endpoint) });
  const productList = endpoint.startsWith("/products");
  const archivedList = productList && endpoint.toLowerCase().includes("status=archived");
  const activeProductList = productList && !archivedList;
  const { data: categories = [] } = useQuery({ queryKey: ["/categories"], queryFn: () => getData<Row[]>("/categories"), enabled: activeProductList && showProductForm });
  const { data: suppliers = [] } = useQuery({ queryKey: ["/suppliers"], queryFn: () => getData<Row[]>("/suppliers"), enabled: activeProductList && showProductForm });
  const statusColumn = columns.includes("status");
  const showProductArchiveActions = productList && statusColumn;
  const showBarcodeActions = productList || title.toLowerCase().startsWith("barcode");
  const createProduct = useMutation({
    mutationFn: async (payload: ProductFormState) => api.post("/products", {
      name: payload.name.trim(),
      sku: payload.sku.trim(),
      barcode: payload.barcode.trim(),
      categoryId: payload.categoryId,
      primarySupplierId: payload.primarySupplierId || null,
      description: payload.description.trim() || undefined,
      imageUrl: payload.imageUrl.trim() || undefined,
      costPrice: payload.costPrice,
      sellingPrice: payload.sellingPrice,
      currentStock: Number(payload.currentStock),
      reorderLevel: Number(payload.reorderLevel),
      unit: payload.unit.trim() || "pcs",
      tracksExpiration: payload.tracksExpiration,
      status: "ACTIVE"
    }),
    onSuccess: (_response, payload) => {
      toast.success("Product added");
      setProductForm(emptyProductForm);
      setImportedSource("");
      setShowProductForm(false);
      setShowBarcodeCamera(false);
      if (searchParams.get("returnTo") === "pos" && searchParams.get("addToCartAfterSave") === "1") {
        navigate(`/pos?addBarcode=${encodeURIComponent(payload.barcode.trim())}`);
        return;
      }
      if (searchParams.has("barcode")) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("barcode");
        nextParams.delete("name");
        nextParams.delete("description");
        nextParams.delete("imageUrl");
        nextParams.delete("unit");
        nextParams.delete("importedSource");
        nextParams.delete("returnTo");
        nextParams.delete("addToCartAfterSave");
        setSearchParams(nextParams, { replace: true });
      }
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && ["/products", "/supplier-products"].some((prefix) => key.startsWith(prefix));
        }
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => toast.error(error.response?.data?.message ?? "Product create failed")
  });
  const productStatusAction = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "archive" | "restore" }) => api.post(`/products/${id}/${action}`),
    onSuccess: (_response, variables) => {
      toast.success(variables.action === "archive" ? "Product archived" : "Product restored");
      void queryClient.invalidateQueries({
        predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/products")
      });
    },
    onError: () => toast.error("Product status update failed")
  });
  const rows = useMemo(() => data.filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase())), [data, search]);
  const resource = resourcePermissionPrefix(title);
  const colSpan = columns.length + (showProductArchiveActions || showBarcodeActions ? 1 : 0);

  useEffect(() => {
    const barcodeParam = searchParams.get("barcode");
    if (!activeProductList || !barcodeParam) return;
    const nameParam = searchParams.get("name") ?? "";
    const descriptionParam = searchParams.get("description") ?? "";
    const imageUrlParam = searchParams.get("imageUrl") ?? "";
    const unitParam = searchParams.get("unit") ?? "";
    const sourceParam = searchParams.get("importedSource") ?? "";
    setImportedSource(sourceParam);
    setProductForm((current) => ({
      ...current,
      barcode: barcodeParam,
      name: nameParam || current.name,
      sku: current.sku || generateSkuFromBarcode(barcodeParam),
      description: descriptionParam || current.description,
      imageUrl: imageUrlParam || current.imageUrl,
      unit: unitParam || current.unit
    }));
    setShowProductForm(true);
  }, [activeProductList, searchParams]);

  function openProductForm() {
    setProductForm((current) => ({ ...current, sku: current.sku || generateSkuFromBarcode(current.barcode) }));
    setShowProductForm(true);
  }

  function updateProductForm<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setProductForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "barcode" && !current.sku && typeof value === "string") {
        next.sku = generateSkuFromBarcode(value);
      }
      return next;
    });
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productForm.categoryId) {
      toast.error("Category is required");
      return;
    }
    try {
      await getData(`/barcodes/${encodeURIComponent(productForm.barcode.trim())}`);
      toast.error("Barcode already belongs to another product");
      return;
    } catch (error) {
      const status = error instanceof AxiosError ? error.response?.status : undefined;
      if (status && status !== 404) {
        toast.error("Could not validate barcode");
        return;
      }
    }
    createProduct.mutate({ ...productForm, sku: productForm.sku.trim() || generateSkuFromBarcode(productForm.barcode) });
  }

  function closeProductForm() {
    setShowProductForm(false);
    setShowBarcodeCamera(false);
    setImportedSource("");
    if (!searchParams.has("barcode")) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("barcode");
    nextParams.delete("name");
    nextParams.delete("description");
    nextParams.delete("imageUrl");
    nextParams.delete("unit");
    nextParams.delete("importedSource");
    nextParams.delete("returnTo");
    nextParams.delete("addToCartAfterSave");
    setSearchParams(nextParams, { replace: true });
  }

  function printBarcodeLabels() {
    window.print();
  }

  function exportCsv() {
    if (rows.length === 0) {
      toast.error("No records to export");
      return;
    }
    const csvRows = [
      columns.map(csvCell).join(","),
      ...rows.map((row) => columns.map((column) => csvCell(text(row[column]))).join(","))
    ];
    const blob = new Blob([`\uFEFF${csvRows.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename(title, "csv");
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    if (rows.length === 0) {
      toast.error("No records to export");
      return;
    }
    const doc = new jsPDF({ orientation: columns.length > 5 ? "landscape" : "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const columnWidth = (pageWidth - margin * 2) / columns.length;
    let y = 18;

    doc.setFontSize(14);
    doc.text(title, margin, y);
    y += 10;
    doc.setFontSize(8);
    doc.text(`${rows.length} records exported ${new Date().toLocaleString()}`, margin, y);
    y += 10;

    function drawHeader() {
      doc.setFont("helvetica", "bold");
      columns.forEach((column, index) => doc.text(column, margin + index * columnWidth, y, { maxWidth: columnWidth - 2 }));
      doc.setFont("helvetica", "normal");
      y += 8;
    }

    drawHeader();
    rows.forEach((row) => {
      if (y > pageHeight - 16) {
        doc.addPage();
        y = 18;
        drawHeader();
      }
      columns.forEach((column, index) => {
        doc.text(text(row[column]) || "-", margin + index * columnWidth, y, { maxWidth: columnWidth - 2 });
      });
      y += 7;
    });
    doc.save(filename(title, "pdf"));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-slate-500">{rows.length} records</p></div>
        <div className="flex gap-2">
          {showProductArchiveActions && <Link to={archivedList ? "/products" : "/products/archive"} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"><Archive size={16} /> {archivedList ? "Active" : "Archive"}</Link>}
          {showCreate && (!productList || activeProductList) && <Can permission={`${resource}.create`}><Button onClick={activeProductList ? openProductForm : undefined}><Plus size={16} /> Add</Button></Can>}
          <Can anyPermissions={[`${resource}.export`, "reports.export"]}><Button onClick={exportCsv} disabled={isLoading} className="bg-slate-700"><Download size={16} /> CSV</Button></Can>
          <Can anyPermissions={[`${resource}.export`, "reports.export"]}><Button onClick={exportPdf} disabled={isLoading} className="bg-accent"><FileText size={16} /> PDF</Button></Can>
        </div>
      </div>
      {showProductForm && (
        <Card>
          <form className="space-y-4" onSubmit={submitProduct}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Add product</h2>
              <button type="button" className="rounded-md border border-line p-2 dark:border-slate-700" onClick={closeProductForm} aria-label="Close product form"><X size={18} /></button>
            </div>
            {importedSource && (
              <div className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
                Product details were imported from {importedSource === "upcitemdb" ? "UPCitemdb" : "Open Food Facts"}. Review and edit them before saving. Price, cost, stock, supplier, and local category still need your local values.
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1">
                <Input required placeholder="Product name" value={productForm.name} onChange={(event) => updateProductForm("name", event.target.value)} />
                {importedSource && <span className="text-xs text-teal-700">Imported from external API</span>}
              </label>
              <div className="flex gap-2">
                <Input placeholder="SKU" value={productForm.sku} onChange={(event) => updateProductForm("sku", event.target.value)} />
                <Button type="button" className="shrink-0 bg-slate-700 px-3 hover:bg-slate-800" onClick={() => updateProductForm("sku", generateSkuFromBarcode(productForm.barcode))}><Hash size={16} /> Generate</Button>
              </div>
              <div className="flex gap-2">
                <Input required placeholder="Barcode" value={productForm.barcode} onChange={(event) => updateProductForm("barcode", event.target.value)} />
                <Button type="button" className="shrink-0 bg-slate-700 px-3 hover:bg-slate-800" onClick={() => updateProductForm("barcode", generateProductBarcode())}><Barcode size={16} /> Generate</Button>
                <Button type="button" className="shrink-0 bg-slate-700 px-3 hover:bg-slate-800" onClick={() => setShowBarcodeCamera((isOpen) => !isOpen)}><Camera size={16} /> Scan</Button>
              </div>
              <select required className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" value={productForm.categoryId} onChange={(event) => updateProductForm("categoryId", event.target.value)}>
                <option value="">Select category</option>
                {categories.map((category) => <option key={String(category.id)} value={String(category.id)}>{text(category.name)}</option>)}
              </select>
              <select className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" value={productForm.primarySupplierId} onChange={(event) => updateProductForm("primarySupplierId", event.target.value)}>
                <option value="">No supplier</option>
                {suppliers.map((supplier) => <option key={String(supplier.id)} value={String(supplier.id)}>{text(supplier.name)}</option>)}
              </select>
              <Input placeholder="Unit" value={productForm.unit} onChange={(event) => updateProductForm("unit", event.target.value)} />
              <label className="space-y-1">
                <Input placeholder="Product image URL" value={productForm.imageUrl} onChange={(event) => updateProductForm("imageUrl", event.target.value)} />
                {importedSource && productForm.imageUrl && <span className="text-xs text-teal-700">Imported image URL</span>}
              </label>
              <Input required min="0" step="0.01" type="number" placeholder="Cost price" value={productForm.costPrice} onChange={(event) => updateProductForm("costPrice", event.target.value)} />
              <Input required min="0" step="0.01" type="number" placeholder="Selling price" value={productForm.sellingPrice} onChange={(event) => updateProductForm("sellingPrice", event.target.value)} />
              <Input required min="0" step="1" type="number" placeholder="Current stock" value={productForm.currentStock} onChange={(event) => updateProductForm("currentStock", event.target.value)} />
              <Input required min="0" step="1" type="number" placeholder="Reorder level" value={productForm.reorderLevel} onChange={(event) => updateProductForm("reorderLevel", event.target.value)} />
              <label className="flex h-10 items-center gap-2 rounded-md border border-line px-3 text-sm dark:border-slate-700">
                <input type="checkbox" checked={productForm.tracksExpiration} onChange={(event) => updateProductForm("tracksExpiration", event.target.checked)} />
                Tracks expiration
              </label>
              <label className="space-y-1 md:col-span-3">
                <Input placeholder="Description" value={productForm.description} onChange={(event) => updateProductForm("description", event.target.value)} />
                {importedSource && productForm.description && <span className="text-xs text-teal-700">Imported from external API</span>}
              </label>
            </div>
            {productForm.imageUrl && (
              <div className="flex items-center gap-3 rounded-md border border-line p-3 text-sm dark:border-slate-700">
                <img className="h-20 w-20 rounded-md object-contain" src={productForm.imageUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                <span className="text-slate-600 dark:text-slate-300">Product image preview</span>
              </div>
            )}
            {showBarcodeCamera && <CameraBarcodeScanner onClose={() => setShowBarcodeCamera(false)} onScan={(scannedBarcode) => { updateProductForm("barcode", scannedBarcode); setShowBarcodeCamera(false); }} />}
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto] md:items-end">
              <BarcodeLabel value={productForm.barcode} productName={productForm.name || "New product"} price={productForm.sellingPrice ? `PHP ${Number(productForm.sellingPrice).toFixed(2)}` : undefined} />
              <Input min="1" step="1" type="number" placeholder="Labels" value={labelQuantity} onChange={(event) => setLabelQuantity(event.target.value)} />
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" disabled={!productForm.barcode.trim()} onClick={printBarcodeLabels}><Printer size={16} /> Print barcode</Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={closeProductForm}>Cancel</Button>
              <Button type="submit" disabled={createProduct.isPending}>{createProduct.isPending ? "Saving..." : "Save product"}</Button>
            </div>
          </form>
        </Card>
      )}
      <Card>
        <div className="mb-4 flex items-center gap-2"><Search size={18} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b text-xs uppercase text-slate-500">{columns.map((column) => <th className="py-3 pr-4" key={column}>{column}</th>)}{(showProductArchiveActions || showBarcodeActions) && <th className="py-3 pr-4">actions</th>}</tr></thead>
            <tbody>
              {isLoading && <tr><td className="py-6 text-slate-500" colSpan={colSpan}>Loading...</td></tr>}
              {!isLoading && rows.length === 0 && <tr><td className="py-6 text-slate-500" colSpan={colSpan}>No records found.</td></tr>}
              {rows.map((row) => {
                const rowId = typeof row.id === "string" ? row.id : "";
                const rowArchived = text(row.status) === "ARCHIVED";
                return (
                  <tr className="border-b last:border-0" key={String(row.id ?? JSON.stringify(row))}>
                    {columns.map((column) => <td className="py-3 pr-4" key={column}>{text(row[column])}</td>)}
                    {(showProductArchiveActions || showBarcodeActions) && (
                      <td className="space-y-2 py-3 pr-4">
                        {showBarcodeActions && <Button className="h-8 bg-slate-700 px-3 text-xs hover:bg-slate-800" disabled={!text(row.barcode)} onClick={() => setSelectedBarcodeProduct(row)}><Barcode size={14} /> Barcode</Button>}
                        {rowArchived ? (
                          <Can permission="products.restore"><Button className="h-8 bg-teal-700 px-3 text-xs" disabled={!rowId || productStatusAction.isPending} onClick={() => productStatusAction.mutate({ id: rowId, action: "restore" })}><RotateCcw size={14} /> Restore</Button></Can>
                        ) : (
                          <Can permission="products.archive"><Button className="h-8 bg-slate-700 px-3 text-xs hover:bg-slate-800" disabled={!rowId || productStatusAction.isPending} onClick={() => productStatusAction.mutate({ id: rowId, action: "archive" })}><Archive size={14} /> Archive</Button></Can>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {selectedBarcodeProduct && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Product barcode</h2>
              <button type="button" className="rounded-md border border-line p-2 dark:border-slate-700" onClick={() => setSelectedBarcodeProduct(null)} aria-label="Close barcode preview"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {Array.from({ length: Math.max(1, Number(labelQuantity || 1)) }).map((_, index) => (
                <BarcodeLabel
                  key={index}
                  value={text(selectedBarcodeProduct.barcode)}
                  productName={text(selectedBarcodeProduct.name)}
                  price={text(selectedBarcodeProduct.sellingPrice) ? `PHP ${Number(text(selectedBarcodeProduct.sellingPrice)).toFixed(2)}` : undefined}
                />
              ))}
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input min="1" step="1" type="number" placeholder="Number of labels" value={labelQuantity} onChange={(event) => setLabelQuantity(event.target.value)} />
                <Button type="button" onClick={printBarcodeLabels}><Printer size={16} /> Print labels</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
