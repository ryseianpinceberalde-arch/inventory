import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Archive, Check, Download, Eye, Pencil, Plus, Printer, QrCode, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { QueryState } from "../components/ui/QueryState";
import { useAuth } from "../contexts/AuthContext";
import { peso } from "../lib/format";
import { api, errorMessage, getData } from "../services/api";
import type { ApiResponse } from "../types/api";

type CustomerType = "Regular" | "Member" | "Wholesale";
type CustomerForm = { fullName: string; phone: string; email: string; address: string; customerType: CustomerType };

interface Customer {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  customerType: string;
  loyaltyPoints: number;
  status: "ACTIVE" | "ARCHIVED";
  totalPurchases: number;
  createdAt: string;
}

interface LoyaltyTransaction {
  id: string;
  saleId?: string | null;
  refundId?: string | null;
  transactionType: string;
  pointsEarned: number;
  pointsRedeemed: number;
  note?: string | null;
  createdAt: string;
}

interface CustomerDetails extends Customer {
  sales?: Array<{
    id: string;
    receiptNo: string;
    total: string;
    status: string;
    createdAt: string;
    loyaltyPointsEarned: number;
    loyaltyPointsRedeemed: number;
    items: Array<{ id: string; quantity: number; product: { name: string } }>;
  }>;
  loyaltyTransactions?: LoyaltyTransaction[] | null;
}

interface LoyaltySettings {
  earningSpend: number;
  redemptionValue: number;
}

const emptyForm: CustomerForm = { fullName: "", phone: "", email: "", address: "", customerType: "Regular" };

function customerTypeLabel(value: string) {
  return value === "Walk-in" ? "Regular" : value;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PH", { timeZone: "Asia/Manila" });
}

export function CustomersPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id: profileId } = useParams();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [qrCustomer, setQrCustomer] = useState<Customer | null>(null);
  const [qrImage, setQrImage] = useState<{ customerId: string; dataUrl: string } | null>(null);
  const [returnToPosAfterCard, setReturnToPosAfterCard] = useState(false);
  const [earningSpend, setEarningSpend] = useState("100");
  const [redemptionValue, setRedemptionValue] = useState("1");
  const [adjustmentPoints, setAdjustmentPoints] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const listUrl = `/customers?${new URLSearchParams({ ...(search.trim() ? { search: search.trim() } : {}), ...(customerTypeFilter ? { customerType: customerTypeFilter } : {}), status: statusFilter }).toString()}`;
  const { data: customers = [], isLoading, isError, error, refetch } = useQuery({ queryKey: [listUrl], queryFn: () => getData<Customer[]>(listUrl) });
  const { data: detail, isLoading: detailLoading, isError: detailError } = useQuery({ queryKey: ["/customers", profileId], queryFn: () => getData<CustomerDetails>(`/customers/${profileId}`), enabled: Boolean(profileId) });
  const { data: loyaltySettings } = useQuery({ queryKey: ["/customers/loyalty-settings"], queryFn: () => getData<LoyaltySettings>("/customers/loyalty-settings") });

  useEffect(() => {
    if (loyaltySettings) {
      setEarningSpend(String(loyaltySettings.earningSpend));
      setRedemptionValue(String(loyaltySettings.redemptionValue));
    }
  }, [loyaltySettings]);

  useEffect(() => {
    if (!qrCustomer) return;
    let active = true;
    void QRCode.toDataURL(`SMARTSTOCK:MEMBER:${qrCustomer.id}`, { errorCorrectionLevel: "M", margin: 2, width: 320 })
      .then((dataUrl) => { if (active) setQrImage({ customerId: qrCustomer.id, dataUrl }); })
      .catch(() => { if (active) toast.error("Could not generate the loyalty QR code."); });
    return () => { active = false; };
  }, [qrCustomer]);

  useEffect(() => {
    if (searchParams.get("returnTo") !== "pos") return;
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }, [searchParams]);

  const invalidateCustomers = () => Promise.all([
    queryClient.invalidateQueries({ predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/customers") }),
    queryClient.invalidateQueries({ queryKey: ["customers-pos"] })
  ]);
  const saveCustomer = useMutation({
    mutationFn: async () => {
      const payload = { fullName: form.fullName.trim(), phone: form.phone.trim(), email: form.email.trim(), address: form.address.trim(), customerType: form.customerType };
      return editingId ? api.put(`/customers/${editingId}`, payload) : api.post<ApiResponse<Customer>>("/customers", payload);
    },
    onSuccess: async (response) => {
      const customer = response.data.data as Customer;
      toast.success(editingId ? "Customer updated" : "Customer added");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await invalidateCustomers();
      if (!editingId && searchParams.get("returnTo") === "pos") navigate(`/pos?customerId=${customer.id}`);
    },
    onError: (saveError) => toast.error(errorMessage(saveError, "Could not save customer"))
  });
  const createAnonymousMember = useMutation({
    mutationFn: async () => api.post<ApiResponse<Customer>>("/customers/anonymous"),
    onSuccess: async (response) => {
      const customer = response.data.data;
      setReturnToPosAfterCard(searchParams.get("returnTo") === "pos");
      setShowForm(false);
      setQrCustomer(customer);
      toast.success("Anonymous member account created. Issue its QR card to the customer.");
      await invalidateCustomers();
    },
    onError: (createError) => toast.error(errorMessage(createError, "Could not create anonymous member account"))
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "ACTIVE" | "ARCHIVED" }) => api.patch(`/customers/${id}/status`, { status }),
    onSuccess: async (_response, { status }) => {
      toast.success(status === "ACTIVE" ? "Customer activated" : "Customer deactivated");
      await invalidateCustomers();
    },
    onError: (statusError) => toast.error(errorMessage(statusError, "Could not update customer status"))
  });
  const saveLoyaltySettings = useMutation({
    mutationFn: async () => api.put("/customers/loyalty-settings", { earningSpend: Number(earningSpend), redemptionValue: Number(redemptionValue) }),
    onSuccess: async () => {
      toast.success("Loyalty rules updated");
      await queryClient.invalidateQueries({ queryKey: ["/customers/loyalty-settings"] });
    },
    onError: (settingsError) => toast.error(errorMessage(settingsError, "Could not save loyalty rules"))
  });
  const adjustPoints = useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error("Customer not found");
      return api.post(`/customers/${profileId}/loyalty-adjustments`, { pointsDelta: Number(adjustmentPoints), reason: adjustmentReason.trim() });
    },
    onSuccess: async () => {
      toast.success("Loyalty points adjusted");
      setAdjustmentPoints("");
      setAdjustmentReason("");
      await invalidateCustomers();
    },
    onError: (adjustmentError) => toast.error(errorMessage(adjustmentError, "Could not adjust loyalty points"))
  });

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(customer: Customer) {
    setEditingId(customer.id);
    setForm({ fullName: customer.fullName, phone: customer.phone ?? "", email: customer.email ?? "", address: customer.address ?? "", customerType: (customer.customerType === "Walk-in" ? "Regular" : customer.customerType) as CustomerType });
    setShowForm(true);
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveCustomer.mutate();
  }

  function continueToPosWithQrCustomer() {
    if (!qrCustomer) return;
    const customerId = qrCustomer.id;
    setQrCustomer(null);
    setReturnToPosAfterCard(false);
    navigate(`/pos?customerId=${encodeURIComponent(customerId)}`);
  }

  const canUpdateType = hasPermission("settings.update");
  const qrDataUrl = qrCustomer && qrImage?.customerId === qrCustomer.id ? qrImage.dataUrl : "";
  const loyaltyTransactions = detail?.loyaltyTransactions;

  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div><h1 className="text-2xl font-bold">Customers</h1><p className="text-sm text-slate-500">Create anonymous members and issue a QR card without collecting personal details.</p></div>
      {hasPermission("customers.create") && <div className="flex flex-wrap gap-2">
        <Button type="button" className="bg-slate-700" busy={createAnonymousMember.isPending} onClick={() => createAnonymousMember.mutate()}><QrCode size={16} /> Create anonymous member</Button>
        <Button onClick={openAddForm}><Plus size={16} /> Add customer</Button>
      </div>}
    </div>

    {hasPermission("settings.update") && <Card>
      <form className="flex flex-col gap-3 lg:flex-row lg:items-end" onSubmit={(event) => { event.preventDefault(); saveLoyaltySettings.mutate(); }}>
        <div className="min-w-0 flex-1"><h2 className="font-semibold">Member loyalty rules</h2><p className="text-xs text-slate-500">Changes apply to new purchases. Existing point balances remain unchanged.</p></div>
        <label className="grid gap-1 text-sm font-medium">Spend per point (PHP)<Input aria-label="Spend per loyalty point" required min="0.01" max="1000000" step="0.01" type="number" value={earningSpend} onChange={(event) => setEarningSpend(event.target.value)} /></label>
        <label className="grid gap-1 text-sm font-medium">Discount per point (PHP)<Input aria-label="Discount per loyalty point" required min="0.01" max="10000" step="0.01" type="number" value={redemptionValue} onChange={(event) => setRedemptionValue(event.target.value)} /></label>
        <Button type="submit" busy={saveLoyaltySettings.isPending}><Check size={16} /> Save rules</Button>
      </form>
    </Card>}

    <Card>
      <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_170px]">
        <label className="relative"><Search size={17} className="absolute left-3 top-3 text-slate-400" /><Input className="pl-9" aria-label="Search customers" placeholder="Search name, phone, or email" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <select aria-label="Filter customers by type" className="h-11 rounded-lg border border-line bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={customerTypeFilter} onChange={(event) => setCustomerTypeFilter(event.target.value)}>
          <option value="">All customer types</option><option value="Regular">Regular</option><option value="Member">Member</option><option value="Wholesale">Wholesale</option>
        </select>
        <select aria-label="Filter customers by status" className="h-11 rounded-lg border border-line bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="ARCHIVED">Deactivated</option>
        </select>
      </div>
      {isError ? <QueryState error message={errorMessage(error)} onRetry={() => void refetch()} /> : <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead><tr className="border-b text-xs uppercase text-slate-500"><th className="py-3 pr-4">Customer ID</th><th className="py-3 pr-4">Full name</th><th className="py-3 pr-4">Phone</th><th className="py-3 pr-4">Email</th><th className="py-3 pr-4">Type</th><th className="py-3 pr-4">Points</th><th className="py-3 pr-4">Purchases</th><th className="whitespace-nowrap py-3 pr-4">Status</th><th className="whitespace-nowrap py-3">Actions</th></tr></thead>
          <tbody>
            {isLoading && <tr><td className="py-6 text-slate-500" colSpan={9}>Loading customers...</td></tr>}
            {!isLoading && customers.length === 0 && <tr><td className="py-6 text-slate-500" colSpan={9}>No customers found.</td></tr>}
            {customers.map((customer) => <tr className="border-b last:border-0" key={customer.id}>
              <td className="max-w-32 truncate py-3 pr-4 font-mono text-xs" title={customer.id}>{customer.id}</td>
              <td className="py-3 pr-4 font-semibold"><button className="text-left text-brand underline-offset-4 hover:underline" onClick={() => navigate(`/customers/${customer.id}`)}>{customer.fullName}</button></td>
              <td className="py-3 pr-4">{customer.phone || "—"}</td><td className="py-3 pr-4">{customer.email || "—"}</td>
              <td className="py-3 pr-4"><span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200">{customerTypeLabel(customer.customerType)}</span></td>
              <td className="py-3 pr-4">{customer.loyaltyPoints.toLocaleString()}</td><td className="py-3 pr-4">{customer.totalPurchases}</td>
              <td className="whitespace-nowrap py-3 pr-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${customer.status === "ACTIVE" ? "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{customer.status === "ACTIVE" ? "Active" : "Deactivated"}</span></td>
              <td className="whitespace-nowrap py-3">
                <div className="flex w-max items-center gap-1">
                  <Button type="button" className="h-8 !min-h-8 !w-8 !gap-0 !px-0 text-xs lg:!w-auto lg:!gap-2 lg:!px-2" aria-label={`View ${customer.fullName}`} title="View customer" onClick={() => navigate(`/customers/${customer.id}`)}><Eye size={14} /><span className="hidden lg:inline">View</span></Button>
                  {hasPermission("customers.update") && <Button type="button" className="h-8 !min-h-8 !w-8 !gap-0 !px-0 bg-slate-700 text-xs lg:!w-auto lg:!gap-2 lg:!px-2" aria-label={`Edit ${customer.fullName}`} title="Edit customer" onClick={() => openEditForm(customer)}><Pencil size={14} /><span className="hidden lg:inline">Edit</span></Button>}
                  {hasPermission("customers.archive") && <Button type="button" className="h-8 !min-h-8 !w-8 !gap-0 !px-0 bg-slate-600 text-xs lg:!w-auto lg:!gap-2 lg:!px-2" aria-label={`${customer.status === "ACTIVE" ? "Deactivate" : "Activate"} ${customer.fullName}`} title={customer.status === "ACTIVE" ? "Deactivate customer" : "Activate customer"} disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: customer.id, status: customer.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE" })}>{customer.status === "ACTIVE" ? <Archive size={14} /> : <Check size={14} />}<span className="hidden lg:inline">{customer.status === "ACTIVE" ? "Deactivate" : "Activate"}</span></Button>}
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </Card>

    {showForm && <Modal title={editingId ? "Edit customer" : "Add customer"} onClose={() => setShowForm(false)}>
      <form className="space-y-4" onSubmit={submitForm}>
        <label className="grid gap-1 text-sm font-medium">Full name<Input required minLength={2} maxLength={160} value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} /></label>
        <label className="grid gap-1 text-sm font-medium">Phone number<Input required minLength={7} maxLength={32} type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></label>
        <label className="grid gap-1 text-sm font-medium">Email (optional)<Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
        <label className="grid gap-1 text-sm font-medium">Address (optional)<Input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} /></label>
        <label className="grid gap-1 text-sm font-medium">Customer type<select disabled={Boolean(editingId) && !canUpdateType} className="h-11 rounded-lg border border-line bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={form.customerType} onChange={(event) => setForm((current) => ({ ...current, customerType: event.target.value as CustomerType }))}><option value="Regular">Regular</option><option value="Member">Member</option><option value="Wholesale">Wholesale</option></select></label>
        {form.customerType === "Member" && !editingId && <p className="text-xs text-slate-500">Members earn {peso(loyaltySettings?.earningSpend ?? 100)} in eligible purchases per point and can redeem each point for {peso(loyaltySettings?.redemptionValue ?? 1)}.</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {!editingId && searchParams.get("returnTo") === "pos" && <Button type="button" className="bg-slate-700" busy={createAnonymousMember.isPending} onClick={() => createAnonymousMember.mutate()}><QrCode size={16} /> Create anonymous member card</Button>}
          <div className="ml-auto flex gap-2"><Button type="button" className="bg-slate-700" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit" busy={saveCustomer.isPending}>{editingId ? "Save changes" : "Add customer"}</Button></div>
        </div>
      </form>
    </Modal>}

    {profileId && <Modal title="Customer details" onClose={() => navigate("/customers")}>
      {detailLoading && <p className="text-sm text-slate-500">Loading customer details...</p>}
      {detailError && <p role="alert" className="text-sm text-red-600">Could not load customer history.</p>}
      {detail && <div className="space-y-5">
        {detail.customerType === "Member" && detail.status === "ACTIVE" && hasPermission("customers.create") && <Button type="button" onClick={() => { setReturnToPosAfterCard(false); setQrCustomer(detail); }}><QrCode size={16} /> Issue loyalty QR card</Button>}
        <div className="grid gap-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800 sm:grid-cols-2">
          <div><span className="text-xs text-slate-500">Customer ID</span><p className="break-all font-mono text-xs">{detail.id}</p></div>
          <div><span className="text-xs text-slate-500">Name and type</span><p className="font-semibold">{detail.fullName} · {customerTypeLabel(detail.customerType)}</p></div>
          <div><span className="text-xs text-slate-500">Phone</span><p>{detail.phone || "—"}</p></div><div><span className="text-xs text-slate-500">Email</span><p>{detail.email || "—"}</p></div>
          <div><span className="text-xs text-slate-500">Address</span><p>{detail.address || "—"}</p></div><div><span className="text-xs text-slate-500">Available points</span><p className="font-semibold">{detail.loyaltyPoints.toLocaleString()}</p></div>
        </div>
        {detail.sales && <section><h3 className="mb-2 font-semibold">Purchase history</h3><div className="max-h-56 overflow-auto rounded-lg border border-line dark:border-slate-700"><table className="w-full min-w-[540px] text-left text-xs"><thead><tr className="border-b text-slate-500"><th className="p-2">Receipt / date</th><th className="p-2">Items</th><th className="p-2">Total</th><th className="p-2">Status</th></tr></thead><tbody>{detail.sales.length === 0 ? <tr><td className="p-3 text-slate-500" colSpan={4}>No purchases recorded.</td></tr> : detail.sales.map((sale) => <tr className="border-b last:border-0" key={sale.id}><td className="p-2"><span className="font-semibold">{sale.receiptNo}</span><br />{formatDate(sale.createdAt)}</td><td className="p-2">{sale.items.map((item) => `${item.quantity} × ${item.product.name}`).join(", ")}</td><td className="p-2">{peso(sale.total)}</td><td className="p-2">{sale.status.replace(/_/g, " ")}</td></tr>)}</tbody></table></div></section>}
        <section><h3 className="mb-2 font-semibold">Loyalty point history</h3>{loyaltyTransactions == null ? <p className="rounded-lg border border-line p-3 text-sm text-slate-500 dark:border-slate-700">Point history is unavailable from the server.</p> : <div className="max-h-56 overflow-auto rounded-lg border border-line dark:border-slate-700"><table className="w-full min-w-[480px] text-left text-xs"><thead><tr className="border-b text-slate-500"><th className="p-2">Date</th><th className="p-2">Transaction</th><th className="p-2">Earned</th><th className="p-2">Redeemed</th><th className="p-2">Reference</th></tr></thead><tbody>{loyaltyTransactions.length === 0 ? <tr><td className="p-3 text-slate-500" colSpan={5}>No point transactions recorded.</td></tr> : loyaltyTransactions.map((entry) => <tr className="border-b last:border-0" key={entry.id}><td className="p-2">{formatDate(entry.createdAt)}</td><td className="p-2">{entry.transactionType}</td><td className="p-2">{entry.pointsEarned > 0 ? `+${entry.pointsEarned}` : entry.pointsEarned}</td><td className="p-2">{entry.pointsRedeemed > 0 ? `-${entry.pointsRedeemed}` : entry.pointsRedeemed < 0 ? `+${Math.abs(entry.pointsRedeemed)}` : 0}</td><td className="max-w-40 truncate p-2 font-mono" title={entry.saleId ?? entry.refundId ?? ""}>{entry.saleId ?? entry.refundId ?? "—"}</td></tr>)}</tbody></table></div>}</section>
        {hasPermission("settings.update") && <form className="space-y-3 rounded-lg border border-line p-3 dark:border-slate-700" onSubmit={(event) => { event.preventDefault(); if (window.confirm("Apply this loyalty point adjustment and record it in the audit history?")) adjustPoints.mutate(); }}>
          <div><h3 className="font-semibold">Manual point adjustment</h3><p className="text-xs text-slate-500">Admin adjustments are recorded in the point ledger and audit log.</p></div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium">Point change (+ or −)<Input required type="number" min="-2147483647" max="2147483647" step="1" value={adjustmentPoints} onChange={(event) => setAdjustmentPoints(event.target.value)} /></label><label className="grid gap-1 text-sm font-medium">Reason<Input required minLength={3} maxLength={500} value={adjustmentReason} onChange={(event) => setAdjustmentReason(event.target.value)} /></label></div>
          <Button type="submit" busy={adjustPoints.isPending}>Review and apply adjustment</Button>
        </form>}
        <Button type="button" className="bg-slate-700" onClick={() => navigate("/customers")}>Close</Button>
      </div>}
    </Modal>}

    {qrCustomer && <Modal title="Member loyalty QR card" onClose={() => { setQrCustomer(null); setReturnToPosAfterCard(false); }}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">Print this card or download the QR image and give it to the customer. They can present it at checkout to earn or redeem points.</p>
        <div id="loyalty-card-print" className="mx-auto flex max-w-sm items-center gap-4 rounded-xl border border-line bg-white p-5 text-slate-950 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">SmartStock Member</p>
            <h3 className="mt-2 break-words text-lg font-bold">{qrCustomer.fullName}</h3>
            <p className="mt-1 text-xs text-slate-600">Points balance: {qrCustomer.loyaltyPoints.toLocaleString()}</p>
            <p className="mt-3 text-[10px] text-slate-500">Present this QR at checkout</p>
            <p className="mt-1 break-all font-mono text-[9px] text-slate-500">ID {qrCustomer.id}</p>
          </div>
          {qrDataUrl ? <img className="h-32 w-32 shrink-0" src={qrDataUrl} alt={`Loyalty QR code for ${qrCustomer.fullName}`} /> : <div className="h-32 w-32 shrink-0 animate-pulse rounded bg-slate-100" aria-label="Generating QR code" />}
        </div>
        <p className="text-xs text-slate-500">Anyone who presents a copy of this QR can use the account at checkout. Keep the card safe.</p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" className="bg-slate-700 loyalty-card-no-print" onClick={() => window.print()}><Printer size={16} /> Print card</Button>
          {qrDataUrl && <a className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-700 px-4 text-sm font-semibold text-white hover:bg-slate-800 loyalty-card-no-print" href={qrDataUrl} download={`smartstock-member-${qrCustomer.id.slice(0, 8)}.png`}><Download size={16} /> Download QR</a>}
          {returnToPosAfterCard && <Button type="button" onClick={continueToPosWithQrCustomer}>Continue to POS</Button>}
        </div>
      </div>
    </Modal>}
  </div>;
}
