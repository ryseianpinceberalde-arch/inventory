import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Camera, Pause, Printer, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CameraBarcodeScanner } from "../components/barcode/CameraBarcodeScanner";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { api, getData } from "../services/api";
import type { ApiResponse, BarcodeLookupResult, ExternalProductDraft, Product, Sale } from "../types/api";
import { peso } from "../lib/format";

interface CartLine {
  product: Product;
  quantity: number;
  productDiscount: number;
}

const posCartStorageKey = "smartstock.pos.cart";

export function POS() {
  const [search, setSearch] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState("");
  const [externalProduct, setExternalProduct] = useState<ExternalProductDraft | null>(null);
  const [isOnlineLookup, setIsOnlineLookup] = useState(false);
  const [lastScan, setLastScan] = useState<{ barcode: string; productName?: string; status: "found" | "external-found" | "not-found" | "error" } | null>(null);
  const [cart, setCart] = useState<CartLine[]>(() => {
    const storedCart = sessionStorage.getItem(posCartStorageKey);
    if (!storedCart) return [];
    try {
      return JSON.parse(storedCart) as CartLine[];
    } catch {
      return [];
    }
  });
  const [amountPaid, setAmountPaid] = useState("");
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const scannerBufferRef = useRef("");
  const lastScannerKeyAtRef = useRef(0);
  const activeLookupRef = useRef("");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: products = [] } = useQuery({ queryKey: ["products-pos"], queryFn: () => getData<Product[]>("/products?limit=100") });
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => [product.name, product.sku, product.barcode].some((value) => value.toLowerCase().includes(term)));
  }, [products, search]);
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => sum + Number(line.product.sellingPrice) * line.quantity - line.productDiscount, 0);
    return { subtotal, total: subtotal, change: Math.max(Number(amountPaid || 0) - subtotal, 0) };
  }, [amountPaid, cart]);

  const addProduct = useCallback((product: Product) => {
    setCart((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.currentStock) { toast.error(`Insufficient stock. Only ${product.currentStock} items are available.`); return lines; }
        return lines.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line);
      }
      if (product.currentStock < 1) { toast.error("Product is out of stock"); return lines; }
      return [...lines, { product, quantity: 1, productDiscount: 0 }];
    });
  }, []);

  function focusScanner() {
    if (document.activeElement instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
    scannerInputRef.current?.focus();
  }

  const saleMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<Sale>>("/sales", {
        receiptNo: `RCP-${Date.now()}`,
        paymentMethod: "CASH",
        amountPaid,
        transactionDiscount: "0",
        idempotencyKey: crypto.randomUUID(),
        items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity, productDiscount: String(line.productDiscount) }))
      });
      return response.data.data;
    },
    onSuccess: () => { toast.success("Sale completed"); setCart([]); setAmountPaid(""); },
    onError: () => toast.error("Sale failed")
  });

  const scan = useCallback(async (barcodeValue = search) => {
    const trimmedBarcode = barcodeValue.trim().replace(/[^A-Za-z0-9._-]/g, "");
    if (!trimmedBarcode) return;
    if (activeLookupRef.current === trimmedBarcode) return;
    activeLookupRef.current = trimmedBarcode;

    try {
      const product = await getData<Product>(`/products/barcode/${encodeURIComponent(trimmedBarcode)}`);
      addProduct(product);
      setSearch("");
      setUnknownBarcode("");
      setExternalProduct(null);
      setLastScan({ barcode: trimmedBarcode, productName: product.name, status: "found" });
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      const status = error instanceof AxiosError ? error.response?.status : undefined;
      if (status === 404) {
        setIsOnlineLookup(true);
        try {
          const result = await getData<BarcodeLookupResult>(`/barcodes/lookup/${encodeURIComponent(trimmedBarcode)}`);
          if (result.success && result.source === "local") {
            addProduct(result.product);
            setSearch("");
            setUnknownBarcode("");
            setExternalProduct(null);
            setLastScan({ barcode: trimmedBarcode, productName: result.product.name, status: "found" });
            toast.success(`${result.product.name} added to cart`);
            return;
          }
          if (result.success) {
            setUnknownBarcode("");
            setExternalProduct(result.product);
            setLastScan({ barcode: trimmedBarcode, productName: result.product.name, status: "external-found" });
            toast.success("Product information found online");
            return;
          }
          setUnknownBarcode(result.barcode);
          setExternalProduct(null);
          setLastScan({ barcode: trimmedBarcode, status: "not-found" });
          toast.error(`Product not found. Barcode: ${trimmedBarcode}`);
        } catch {
          setUnknownBarcode(trimmedBarcode);
          setExternalProduct(null);
          setLastScan({ barcode: trimmedBarcode, status: "error" });
          toast.error("Online product lookup is currently unavailable. You can still add this product manually.");
        } finally {
          setIsOnlineLookup(false);
        }
        return;
      }
      setLastScan({ barcode: trimmedBarcode, status: "error" });
      toast.error("Barcode lookup failed. Check the network or API server.");
    } finally {
      activeLookupRef.current = "";
      setTimeout(focusScanner, 0);
    }
  }, [addProduct, search]);

  function reviewExternalProduct(product: ExternalProductDraft) {
    const params = new URLSearchParams({
      barcode: product.barcode,
      name: product.name,
      description: product.description ?? "",
      imageUrl: product.image ?? "",
      unit: product.size ?? "pcs",
      importedSource: product.source,
      returnTo: "pos",
      addToCartAfterSave: "1"
    });
    sessionStorage.setItem(posCartStorageKey, JSON.stringify(cart));
    navigate(`/products?${params.toString()}`);
  }

  function addManualProduct(barcode: string) {
    const params = new URLSearchParams({ barcode, returnTo: "pos", addToCartAfterSave: "1" });
    sessionStorage.setItem(posCartStorageKey, JSON.stringify(cart));
    navigate(`/products?${params.toString()}`);
  }

  const handleCameraScan = useCallback((scannedBarcode: string) => {
    setSearch(scannedBarcode);
    void scan(scannedBarcode);
  }, [scan]);

  useEffect(() => {
    function isEditableTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    }

    function handleScannerKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey || isEditableTarget(event.target)) return;

      const now = Date.now();
      if (now - lastScannerKeyAtRef.current > 80) scannerBufferRef.current = "";
      lastScannerKeyAtRef.current = now;

      if (event.key === "Enter") {
        const scannedValue = scannerBufferRef.current;
        scannerBufferRef.current = "";
        if (scannedValue.length >= 3) {
          event.preventDefault();
          void scan(scannedValue);
        }
        return;
      }

      if (event.key.length === 1) scannerBufferRef.current += event.key;
    }

    window.addEventListener("keydown", handleScannerKey);
    return () => window.removeEventListener("keydown", handleScannerKey);
  }, [scan]);

  useEffect(() => {
    sessionStorage.setItem(posCartStorageKey, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const barcode = searchParams.get("addBarcode");
    if (!barcode) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("addBarcode");
    setSearchParams(nextParams, { replace: true });
    void scan(barcode);
  }, [scan, searchParams, setSearchParams]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_460px]">
      <div className="space-y-4">
        <Card>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Search size={18} /> Scan or Search Product</div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input ref={scannerInputRef} value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void scan(); }} placeholder="Scan barcode or search product..." autoFocus />
            <div className="flex gap-2">
              <Button type="button" className="flex-1 sm:flex-none" disabled={isOnlineLookup} onClick={() => void scan()}><Search size={18} /> Lookup</Button>
              <Button type="button" className="flex-1 bg-slate-700 hover:bg-slate-800 sm:flex-none" onClick={() => setIsCameraOpen((isOpen) => !isOpen)}><Camera size={18} /> Camera</Button>
            </div>
          </div>
          {isOnlineLookup && <div className="mt-3 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">Searching online product database...</div>}
          {externalProduct && (
            <div className="mt-3 grid gap-3 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-950 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center">
              {externalProduct.image ? <img className="h-24 w-24 rounded-md border border-teal-100 object-contain" src={externalProduct.image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <div className="hidden sm:block" />}
              <div>
                <div className="font-semibold">Product information found.</div>
                <div className="mt-1 font-semibold">{externalProduct.name}</div>
                {externalProduct.brand && <div>Brand: {externalProduct.brand}</div>}
                <div className="text-xs uppercase tracking-wide text-teal-700">Source: {externalProduct.source === "upcitemdb" ? "UPCitemdb" : "Open Food Facts"}</div>
              </div>
              <Button type="button" onClick={() => reviewExternalProduct(externalProduct)}>Review & Add Product</Button>
            </div>
          )}
          {unknownBarcode && (
            <div className="mt-3 flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
              <span>Product not found in the local database or online product databases. Barcode: <strong>{unknownBarcode}</strong></span>
              <Button type="button" className="bg-amber-700 hover:bg-amber-800" onClick={() => addManualProduct(unknownBarcode)}>Add Product Manually</Button>
            </div>
          )}
          {lastScan && (
            <div className={`mt-3 rounded-md border p-3 text-sm ${lastScan.status === "found" ? "border-teal-200 bg-teal-50 text-teal-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
              Last scan: <strong>{lastScan.barcode}</strong>{lastScan.productName ? ` - ${lastScan.productName} added to cart` : ""}
            </div>
          )}
          {isCameraOpen && <div className="mt-4"><CameraBarcodeScanner continuous onClose={() => setIsCameraOpen(false)} onScan={handleCameraScan} /></div>}
        </Card>
        <Card>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => <button key={product.id} className="rounded-md border border-line p-3 text-left hover:border-brand disabled:cursor-not-allowed disabled:opacity-50" disabled={product.currentStock < 1} onClick={() => addProduct(product)}><div className="font-semibold">{product.name}</div><div className="text-sm text-slate-500">{product.sku} | {product.barcode}</div><div className="mt-2 flex justify-between text-sm"><span>{peso(product.sellingPrice)}</span><span>{product.currentStock} {product.unit}</span></div></button>)}
          </div>
        </Card>
      </div>
      <Card className="self-start">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold">Current Order</h1>
          <Button type="button" className="h-9 bg-slate-700 px-3 hover:bg-slate-800" disabled={cart.length === 0} onClick={() => setCart([])}><X size={16} /> Clear</Button>
        </div>
        <div className="mt-4 space-y-2">
          {cart.length === 0 && <p className="text-sm text-slate-500">No items in cart.</p>}
          {cart.map((line) => <div key={line.product.id} className="grid grid-cols-[1fr_72px_72px_28px] items-center gap-2 rounded-md border border-line p-3 text-sm"><div><strong className="block">{line.product.name}</strong><span className="text-xs text-slate-500">{line.product.barcode}</span></div><span className="text-right">{peso(line.product.sellingPrice)}</span><Input className="h-8 text-center" min="1" max={line.product.currentStock} type="number" value={line.quantity} onChange={(event) => setCart((rows) => rows.map((row) => row.product.id === line.product.id ? { ...row, quantity: Math.min(line.product.currentStock, Math.max(1, Number(event.target.value || 1))) } : row))} /><button onClick={() => setCart((rows) => rows.filter((row) => row.product.id !== line.product.id))} aria-label={`Remove ${line.product.name}`}><Trash2 size={16} /></button><span className="col-span-4 text-right font-semibold">{peso(Number(line.product.sellingPrice) * line.quantity - line.productDiscount)}</span></div>)}
        </div>
        <div className="mt-5 space-y-2 border-t pt-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><strong>{peso(totals.subtotal)}</strong></div><div className="flex justify-between"><span>Discount</span><strong>{peso(0)}</strong></div><div className="flex justify-between text-lg"><span>Grand Total</span><strong>{peso(totals.total)}</strong></div><Input value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} placeholder="Amount received" /><div className="flex justify-between"><span>Change</span><strong>{peso(totals.change)}</strong></div><div className="grid gap-2 sm:grid-cols-2"><Button type="button" className="bg-slate-700 hover:bg-slate-800" disabled={cart.length === 0} onClick={() => toast("Hold order is not available in the current backend yet.")}><Pause size={18} /> Hold Order</Button><Button disabled={cart.length === 0 || saleMutation.isPending} onClick={() => saleMutation.mutate()}><Printer size={18} /> Checkout / Pay</Button></div></div>
      </Card>
    </div>
  );
}
