import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, ReactNode, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { QueryState } from "../components/ui/QueryState";
import { api, errorMessage, getAllProducts, getData } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { isMoneyInputWithinLimit, MAX_MONEY_INPUT, peso } from "../lib/format";
import type { Product } from "../types/api";

const selectClass = "mt-1 h-11 w-full rounded-lg border border-line px-3 text-sm dark:border-slate-700";

interface StockInLine {
  id: string;
  productId: string;
  quantity: string;
  unitCost: string;
  sellingPrice: string;
  expirationDate: string;
}

function emptyStockInLine(): StockInLine {
  return { id: crypto.randomUUID(), productId: "", quantity: "1", unitCost: "", sellingPrice: "", expirationDate: "" };
}

export function StockActions({ initialTab }: { initialTab?: "in" | "out" }) {
  const { hasPermission } = useAuth();
  const canStockIn = hasPermission("inventory.stock_in");
  const canStockOut = hasPermission("inventory.stock_out");
  const [activeTab, setActiveTab] = useState<"in" | "out">(initialTab ?? (canStockIn ? "in" : "out"));
  const selectedTab = activeTab === "in" && canStockIn || activeTab === "out" && canStockOut
    ? activeTab
    : canStockIn ? "in" : "out";

  return <div className="space-y-4">
    <div role="group" aria-label="Stock actions" className="flex gap-2 border-b border-line dark:border-slate-800">
      {canStockIn && <button type="button" aria-pressed={selectedTab === "in"} onClick={() => setActiveTab("in")} className={`border-b-2 px-4 py-3 text-sm font-semibold ${selectedTab === "in" ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-brand"}`}>Stock In</button>}
      {canStockOut && <button type="button" aria-pressed={selectedTab === "out"} onClick={() => setActiveTab("out")} className={`border-b-2 px-4 py-3 text-sm font-semibold ${selectedTab === "out" ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-brand"}`}>Stock Out</button>}
    </div>
    {selectedTab === "in" ? <StockIn /> : <StockOut />}
  </div>;
}

export function StockIn() {
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<StockInLine[]>(() => [emptyStockInLine()]);
  const [error, setError] = useState("");
  const { hasPermission } = useAuth();
  const canUpdateProduct = hasPermission("products.update");
  const queryClient = useQueryClient();
  const suppliers = useQuery({ queryKey: ["/suppliers"], queryFn: () => getData<Array<{ id: string; name: string; status: string }>>("/suppliers") });
  const products = useQuery({ queryKey: ["inventory-products"], queryFn: () => getAllProducts<Product>() });
  const activeProducts = products.data ?? [];
  const totalUnits = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const receiptTotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0), 0);
  const mutation = useMutation({
    mutationFn: async () => api.post("/stock-in", {
      referenceNo: `SIN-${crypto.randomUUID()}`,
      supplierId,
      deliveryDate: new Date().toISOString(),
      items: items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitCost: item.unitCost,
        expirationDate: item.expirationDate || null,
        ...(canUpdateProduct && item.sellingPrice.trim() ? { sellingPrice: item.sellingPrice } : {})
      }))
    }),
    onSuccess: async () => {
      toast.success("Stock-in recorded successfully");
      setSupplierId("");
      setItems([emptyStockInLine()]);
      setError("");
      await queryClient.invalidateQueries();
    },
    onError: (error) => setError(errorMessage(error))
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    if (new Set(items.map((item) => item.productId)).size !== items.length) {
      setError("Choose each product only once per receipt.");
      return;
    }
    setError("");
    mutation.mutate();
  }

  return <Card className="mx-auto max-w-4xl"><h1 className="text-2xl font-bold">Stock-in</h1><p className="mt-1 text-sm text-slate-500">Record a supplier delivery. Add each received product once; stock and receipt history update together. Enter the printed expiration date when the item has one.</p>
    {suppliers.isError && <QueryState error onRetry={() => void suppliers.refetch()} />}
    {products.isError && <QueryState error onRetry={() => void products.refetch()} />}
    {suppliers.data && !suppliers.data.some((row) => row.status === "ACTIVE") && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Add an active supplier before recording a delivery.</p>}
    {products.data && activeProducts.length === 0 && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">No active products are available to receive.</p>}
    <form className="mt-6 space-y-4" onSubmit={submit}><fieldset disabled={mutation.isPending} className="space-y-4">
      <label className="block text-sm font-medium">Supplier<select required disabled={suppliers.isLoading || suppliers.isError} className={selectClass} value={supplierId} onChange={(event) => setSupplierId(event.target.value)}><option value="">{suppliers.isLoading ? "Loading suppliers..." : "Select supplier"}</option>{suppliers.data?.filter((row) => row.status === "ACTIVE").map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      {items.map((item, index) => {
        const selectedElsewhere = new Set(items.filter((other) => other.id !== item.id).map((other) => other.productId));
        const choices = activeProducts.filter((product) => product.id === item.productId || !selectedElsewhere.has(product.id));
        return <div key={item.id} className="space-y-3 rounded-lg border border-line p-4 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Product {index + 1}</h2>{items.length > 1 && <button type="button" className="text-sm text-red-700 hover:underline" onClick={() => setItems((rows) => rows.filter((row) => row.id !== item.id))}>Remove</button>}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">Product<select required disabled={products.isLoading || products.isError} className={selectClass} value={item.productId} onChange={(event) => setItems((rows) => rows.map((row) => row.id === item.id ? { ...row, productId: event.target.value, unitCost: "", sellingPrice: "" } : row))}><option value="">{products.isLoading ? "Loading products..." : "Select product"}</option>{choices.map((product) => <option key={product.id} value={product.id}>{product.name} — {product.currentStock} {product.unit} in stock</option>)}</select></label>
            <label className="block text-sm font-medium">Quantity received<Input required className="mt-1" type="number" min="1" step="1" value={item.quantity} onChange={(event) => setItems((rows) => rows.map((row) => row.id === item.id ? { ...row, quantity: event.target.value } : row))} /></label>
            <label className="block text-sm font-medium">Unit cost (PHP)<Input required className="mt-1" type="number" min="0" max={MAX_MONEY_INPUT} step="0.01" value={item.unitCost} onChange={(event) => { const value = event.target.value; if (isMoneyInputWithinLimit(value)) setItems((rows) => rows.map((row) => row.id === item.id ? { ...row, unitCost: value } : row)); }} /></label>
            <label className="block text-sm font-medium">Expiration date (if applicable)<Input className="mt-1" type="date" value={item.expirationDate} onChange={(event) => setItems((rows) => rows.map((row) => row.id === item.id ? { ...row, expirationDate: event.target.value } : row))} /></label>
            {canUpdateProduct && <label className="block text-sm font-medium">New selling price (PHP)<Input className="mt-1" type="number" min="0" max={MAX_MONEY_INPUT} step="0.01" placeholder="Leave blank to keep current price" value={item.sellingPrice} onChange={(event) => { const value = event.target.value; if (isMoneyInputWithinLimit(value)) setItems((rows) => rows.map((row) => row.id === item.id ? { ...row, sellingPrice: value } : row)); }} /></label>}
          </div>
        </div>;
      })}
      <Button type="button" className="bg-slate-700" disabled={products.isLoading || products.isError || items.length >= 200 || items.length >= activeProducts.length} onClick={() => setItems((rows) => [...rows, emptyStockInLine()])}>Add another product</Button>
      <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900"><div className="flex justify-between"><span>Total units</span><strong>{totalUnits}</strong></div><div className="mt-1 flex justify-between"><span>Estimated receipt total</span><strong>{peso(receiptTotal)}</strong></div></div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button type="submit" busy={mutation.isPending} disabled={suppliers.isLoading || suppliers.isError || products.isLoading || products.isError || activeProducts.length === 0}>{mutation.isPending ? "Saving..." : "Record stock-in"}</Button>
    </fieldset></form>
  </Card>;
}

export function StockOut() {
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("Manual correction");
  return <ActionCard title="Stock-out" confirm={(product) => `Remove ${quantity} ${product?.unit ?? "unit(s)"} of ${product?.name ?? "this product"} from stock?`} productsInStockOnly onSuccess={() => { setQuantity("1"); setReason("Manual correction"); }} onSubmit={async (productId) => { await api.post("/stock-out", { referenceNo: `SOUT-${crypto.randomUUID()}`, productId, quantity: Number(quantity), reason }); }}>
    {(product) => <>
      <label className="block text-sm font-medium">Quantity<Input required className="mt-1" type="number" min="1" max={product?.currentStock} step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
      {product && <p className="-mt-3 text-xs text-slate-500">Available stock: {product.currentStock} {product.unit}</p>}
      <label className="block text-sm font-medium">Reason<select className={selectClass} value={reason} onChange={(event) => setReason(event.target.value)}>{["Damaged", "Expired", "Returned to supplier", "Lost", "Internal use", "Product transfer", "Manual correction"].map((item) => <option key={item}>{item}</option>)}</select></label>
    </>}
  </ActionCard>;
}

export function InventoryAdjustment() {
  const { hasPermission, user } = useAuth();
  const queryClient = useQueryClient();
  const [physicalQuantity, setPhysicalQuantity] = useState("0");
  const [reason, setReason] = useState("");
  const adjustments = useQuery({ queryKey: ["adjustments"], queryFn: () => getData<Array<{ id: string; product: Product; physicalQuantity: number; approvalStatus: string; requestedById: string }>>("/inventory-adjustments"), enabled: hasPermission("inventory.view") });
  const approve = useMutation({ mutationFn: (id: string) => api.post(`/inventory-adjustments/${id}/approve`), onSuccess: async () => { toast.success("Adjustment approved"); await queryClient.invalidateQueries(); }, onError: (error) => toast.error(errorMessage(error)) });
  return <div className="space-y-6"><ActionCard title="Inventory adjustment" onSubmit={async (productId) => { await api.post("/inventory-adjustments", { productId, physicalQuantity: Number(physicalQuantity), reason }); }}>
    <p className="text-sm text-slate-500">Changes of 10 units or more require approval from another authorized employee.</p>
    <label className="block text-sm font-medium">Physical count<Input required className="mt-1" type="number" min="0" step="1" value={physicalQuantity} onChange={(event) => setPhysicalQuantity(event.target.value)} /></label>
    <label className="block text-sm font-medium">Reason<Input required minLength={3} className="mt-1" value={reason} onChange={(event) => setReason(event.target.value)} /></label>
  </ActionCard>{adjustments.isError && <QueryState error onRetry={() => void adjustments.refetch()} />}
    {adjustments.data && <Card><h2 className="mb-4 font-semibold">Adjustment history</h2>{adjustments.data.length === 0 && <p className="text-sm text-slate-500">No adjustments recorded.</p>}{adjustments.data.map((row) => <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3 text-sm" key={row.id}><div><strong>{row.product.name}</strong><p className="text-slate-500">Physical count: {row.physicalQuantity} ? {row.approvalStatus}</p></div>{row.approvalStatus === "PENDING" && row.requestedById !== user?.id && hasPermission("inventory.adjustment_approve") && <Button busy={approve.isPending} onClick={() => { if (window.confirm("Approve this physical count and update stock?")) approve.mutate(row.id); }}>Approve</Button>}</div>)}</Card>}
  </div>;
}

function ActionCard({ title, confirm, children, onSubmit, onSuccess, productsInStockOnly = false }: { title: string; confirm?: string | ((product: Product | undefined) => string); children: ReactNode | ((product: Product | undefined) => ReactNode); onSubmit: (id: string) => Promise<void>; onSuccess?: () => void; productsInStockOnly?: boolean }) {
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ["inventory-products"], queryFn: () => getAllProducts<Product>() });
  const [productId, setProductId] = useState("");
  const [error, setError] = useState("");
  const availableProducts = products.data?.filter((product) => !productsInStockOnly || product.currentStock > 0) ?? [];
  const selectedProduct = availableProducts.find((product) => product.id === productId);
  const mutation = useMutation({ mutationFn: () => onSubmit(productId), onSuccess: async () => { toast.success(`${title} recorded successfully`); setProductId(""); setError(""); onSuccess?.(); await queryClient.invalidateQueries(); }, onError: (error) => setError(errorMessage(error)) });
  function submit(event: FormEvent) { event.preventDefault(); const confirmation = typeof confirm === "function" ? confirm(selectedProduct) : confirm; if (mutation.isPending || (confirmation && !window.confirm(confirmation))) return; setError(""); mutation.mutate(); }
  return <Card className="mx-auto max-w-2xl"><h1 className="text-2xl font-bold">{title}</h1><p className="mt-1 text-sm text-slate-500">Record an inventory change and keep the stock history up to date.</p>
    {products.isError && <QueryState error onRetry={() => void products.refetch()} />}
    {productsInStockOnly && products.data && availableProducts.length === 0 && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">No products currently have stock available to remove.</p>}
    <form className="mt-6 space-y-4" onSubmit={submit}><fieldset disabled={mutation.isPending} className="space-y-4">
      <label className="block text-sm font-medium">Product<select required className={selectClass} value={productId} disabled={products.isLoading} onChange={(event) => setProductId(event.target.value)}><option value="">{products.isLoading ? "Loading products..." : "Select product"}</option>{availableProducts.map((product) => <option key={product.id} value={product.id}>{product.name} — {product.currentStock} {product.unit} available</option>)}</select></label>{typeof children === "function" ? children(selectedProduct) : children}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button busy={mutation.isPending} disabled={!productId || products.isError} type="submit">{mutation.isPending ? "Saving?" : `Save ${title.toLowerCase()}`}</Button>
    </fieldset></form></Card>;
}
