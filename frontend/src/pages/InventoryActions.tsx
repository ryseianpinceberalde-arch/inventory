import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { api, getData } from "../services/api";
import type { Product } from "../types/api";

export function StockIn() {
  const { data: products = [] } = useQuery({ queryKey: ["products-stock-in"], queryFn: () => getData<Product[]>("/products?limit=100") });
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("0");
  return <ActionCard title="Stock-in" onSubmit={async () => { await api.post("/stock-in", { referenceNo: `SIN-${Date.now()}`, supplierId, deliveryDate: new Date().toISOString(), items: [{ productId, quantity: Number(quantity), unitCost }] }); toast.success("Stock-in completed"); }} products={products} productId={productId} setProductId={setProductId}><Input value={supplierId} onChange={(event) => setSupplierId(event.target.value)} placeholder="Supplier UUID" /><Input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Quantity" /><Input value={unitCost} onChange={(event) => setUnitCost(event.target.value)} placeholder="Unit cost" /></ActionCard>;
}

export function StockOut() {
  const { data: products = [] } = useQuery({ queryKey: ["products-stock-out"], queryFn: () => getData<Product[]>("/products?limit=100") });
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  return <ActionCard title="Stock-out" onSubmit={async () => { await api.post("/stock-out", { referenceNo: `SOUT-${Date.now()}`, productId, quantity: Number(quantity), reason: "Manual correction" }); toast.success("Stock-out completed"); }} products={products} productId={productId} setProductId={setProductId}><Input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Quantity" /></ActionCard>;
}

export function InventoryAdjustment() {
  const { data: products = [] } = useQuery({ queryKey: ["products-adjust"], queryFn: () => getData<Product[]>("/products?limit=100") });
  const [productId, setProductId] = useState("");
  const [physicalQuantity, setPhysicalQuantity] = useState("0");
  return <ActionCard title="Inventory adjustment" onSubmit={async () => { await api.post("/inventory-adjustments", { productId, physicalQuantity: Number(physicalQuantity), reason: "Physical inventory correction" }); toast.success("Adjustment recorded"); }} products={products} productId={productId} setProductId={setProductId}><Input value={physicalQuantity} onChange={(event) => setPhysicalQuantity(event.target.value)} placeholder="Physical quantity" /></ActionCard>;
}

function ActionCard(props: { title: string; products: Product[]; productId: string; setProductId: (id: string) => void; onSubmit: () => Promise<void>; children: React.ReactNode }) {
  return <Card className="mx-auto max-w-xl"><h1 className="text-xl font-bold">{props.title}</h1><select className="mt-4 h-10 w-full rounded-md border border-line px-3 text-sm" value={props.productId} onChange={(event) => props.setProductId(event.target.value)}><option value="">Select product</option>{props.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><div className="mt-3 space-y-3">{props.children}</div><Button className="mt-4" onClick={() => void props.onSubmit()}>Submit</Button></Card>;
}
