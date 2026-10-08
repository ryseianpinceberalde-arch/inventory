import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, ReactNode, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { QueryState } from "../components/ui/QueryState";
import { api, errorMessage, getAllProducts, getData } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { Product } from "../types/api";

const selectClass = "mt-1 h-11 w-full rounded-lg border border-line px-3 text-sm dark:border-slate-700";

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
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const { hasPermission } = useAuth();
  const canUpdateProduct = hasPermission("products.update");
  const suppliers = useQuery({ queryKey: ["/suppliers"], queryFn: () => getData<Array<{ id: string; name: string; status: string }>>("/suppliers") });
  return <ActionCard title="Stock-in" onSubmit={async (productId) => { await api.post("/stock-in", { referenceNo: `SIN-${crypto.randomUUID()}`, supplierId, deliveryDate: new Date().toISOString(), items: [{ productId, quantity: Number(quantity), unitCost, ...(canUpdateProduct && sellingPrice.trim() ? { sellingPrice } : {}) }] }); }}>
    {suppliers.isError && <QueryState error onRetry={() => void suppliers.refetch()} />}
    <label className="block text-sm font-medium">Supplier<select required disabled={suppliers.isLoading} className={selectClass} value={supplierId} onChange={(event) => setSupplierId(event.target.value)}><option value="">Select supplier</option>{suppliers.data?.filter((row) => row.status === "ACTIVE").map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
    <label className="block text-sm font-medium">Quantity<Input required className="mt-1" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
    <label className="block text-sm font-medium">Unit cost (PHP)<Input required className="mt-1" type="number" min="0" step="0.01" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} /></label>
    {canUpdateProduct && <label className="block text-sm font-medium">New selling price (PHP)<Input className="mt-1" type="number" min="0" step="0.01" placeholder="Leave blank to keep current price" value={sellingPrice} onChange={(event) => setSellingPrice(event.target.value)} /></label>}
  </ActionCard>;
}

export function StockOut() {
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("Manual correction");
  return <ActionCard title="Stock-out" confirm="Remove this quantity from stock?" onSubmit={async (productId) => { await api.post("/stock-out", { referenceNo: `SOUT-${crypto.randomUUID()}`, productId, quantity: Number(quantity), reason }); }}>
    <label className="block text-sm font-medium">Quantity<Input required className="mt-1" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
    <label className="block text-sm font-medium">Reason<select className={selectClass} value={reason} onChange={(event) => setReason(event.target.value)}>{["Damaged", "Expired", "Returned to supplier", "Lost", "Internal use", "Product transfer", "Manual correction"].map((item) => <option key={item}>{item}</option>)}</select></label>
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

function ActionCard({ title, confirm, children, onSubmit }: { title: string; confirm?: string; children: ReactNode; onSubmit: (id: string) => Promise<void> }) {
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ["inventory-products"], queryFn: () => getAllProducts<Product>() });
  const [productId, setProductId] = useState("");
  const [error, setError] = useState("");
  const mutation = useMutation({ mutationFn: () => onSubmit(productId), onSuccess: async () => { toast.success(`${title} recorded successfully`); setProductId(""); setError(""); await queryClient.invalidateQueries(); }, onError: (error) => setError(errorMessage(error)) });
  function submit(event: FormEvent) { event.preventDefault(); if (mutation.isPending || (confirm && !window.confirm(confirm))) return; setError(""); mutation.mutate(); }
  return <Card className="mx-auto max-w-2xl"><h1 className="text-2xl font-bold">{title}</h1><p className="mt-1 text-sm text-slate-500">Record an inventory change and keep the stock history up to date.</p>
    {products.isError && <QueryState error onRetry={() => void products.refetch()} />}
    <form className="mt-6 space-y-4" onSubmit={submit}><fieldset disabled={mutation.isPending} className="space-y-4">
      <label className="block text-sm font-medium">Product<select required className={selectClass} value={productId} disabled={products.isLoading} onChange={(event) => setProductId(event.target.value)}><option value="">{products.isLoading ? "Loading products?" : "Select product"}</option>{products.data?.map((product) => <option key={product.id} value={product.id}>{product.name} ? {product.currentStock} {product.unit} available</option>)}</select></label>{children}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button busy={mutation.isPending} disabled={!productId || products.isError} type="submit">{mutation.isPending ? "Saving?" : `Save ${title.toLowerCase()}`}</Button>
    </fieldset></form></Card>;
}
