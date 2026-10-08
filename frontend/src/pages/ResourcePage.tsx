import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import jsPDF from "jspdf";
import { Archive, Barcode, Camera, Download, FileText, Hash, Pencil, Plus, Printer, RotateCcw, Search, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BarcodeLabel } from "../components/barcode/BarcodeLabel";
import { CameraBarcodeScanner } from "../components/barcode/CameraBarcodeScanner";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Pagination } from "../components/ui/Pagination";
import { Modal } from "../components/ui/Modal";
import { QueryState } from "../components/ui/QueryState";
import { useAuth } from "../contexts/AuthContext";
import type { ApiResponse } from "../types/api";
import { api, getData, getAllProducts, errorMessage } from "../services/api";
import { Can } from "../components/rbac/Can";
import { isMoneyInputWithinLimit, MAX_MONEY_INPUT, peso } from "../lib/format";

interface ResourcePageProps {
  title: string;
  endpoint: string;
  columns: string[];
  showCreate?: boolean;
}

type Row = Record<string, unknown>;

interface AuditLogFilterOptions {
  modules: string[];
  actions: string[];
  users: Array<{ id: string; fullName: string }>;
}

interface ProductFormState {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  primarySupplierId: string;
  description: string;
  costPrice: string;
  sellingPrice: string;
  memberPrice: string;
  wholesalePrice: string;
  wholesaleMinQuantity: string;
  currentStock: string;
  reorderLevel: string;
  unit: string;
  imageUrl: string;
}

interface SupplierFormState {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
  deliveryLeadTime: string;
  status: "ACTIVE" | "ARCHIVED";
  notes: string;
}

type GenericFormState = Record<string, string>;

interface GenericField {
  key: string;
  placeholder: string;
  type?: string;
  optionsSource?: "products" | "roles" | "suppliers";
  options?: Array<{ value: string; label: string }>;
  className?: string;
  required?: boolean;
  createOnly?: boolean;
  min?: string;
  max?: string;
  step?: string;
}

interface GenericResourceConfig {
  endpoint: string;
  label: string;
  permission: string;
  createPermission?: string;
  fields: GenericField[];
  empty: GenericFormState;
  allowCreate?: boolean;
  invalidatePrefixes?: string[];
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
  memberPrice: "",
  wholesalePrice: "",
  wholesaleMinQuantity: "10",
  currentStock: "0",
  reorderLevel: "0",
  unit: "pcs",
  imageUrl: ""
};

const emptySupplierForm: SupplierFormState = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  paymentTerms: "",
  deliveryLeadTime: "",
  status: "ACTIVE",
  notes: ""
};

const MAX_PRODUCT_STOCK = 2_147_483_647;

const pageSize = 10;

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
  return `"${(/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replace(/"/g, '""')}"`;
}

function auditFieldLabel(key: string) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function auditPayloadRows(value: unknown, parentLabel = ""): Array<{ label: string; value: string }> {
  if (Array.isArray(value)) {
    return value.length ? value.flatMap((item, index) => auditPayloadRows(item, `${parentLabel} ${index + 1}`.trim())) : parentLabel ? [{ label: parentLabel, value: "None" }] : [];
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nested]) => {
      if (key === "id" || /(?:Id|ID)$/.test(key) || ["createdAt", "updatedAt", "createdBy", "idempotencyKey", "userAgent", "ipAddress"].includes(key)) return [];
      const label = `${parentLabel} ${auditFieldLabel(key)}`.trim();
      return nested !== null && typeof nested === "object"
        ? auditPayloadRows(nested, label)
        : [{ label, value: formatAuditValue(key, nested) }];
    });
  }
  return parentLabel ? [{ label: parentLabel, value: formatAuditValue(parentLabel, value) }] : [];
}

function formatAuditValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "Not set";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (/(?:price|amount|subtotal|total|discount|profit|cost|balance|tax|refund)$/i.test(key) && (typeof value === "number" || (typeof value === "string" && Number.isFinite(Number(value))))) {
    return peso(value as number | string);
  }
  return String(value);
}

function supplierPhoneInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function supplierPhoneForForm(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("63")) digits = `0${digits.slice(2)}`;
  else if (digits.length === 10 && digits.startsWith("9")) digits = `0${digits}`;
  return digits.slice(0, 11);
}

function supplierPhoneLocalPart(value: string) {
  const digits = supplierPhoneForForm(value);
  return (digits.startsWith("09") ? digits.slice(2) : digits).slice(-9);
}

function AuditPayload({ value }: { value: unknown }) {
  const rows = auditPayloadRows(value);
  if (rows.length === 0) return <p className="text-sm text-slate-500">No readable transaction details were recorded.</p>;
  return <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">{rows.map((row, index) => <div className="min-w-0" key={`${row.label}-${index}`}>
    <dt className="text-xs font-medium text-slate-500">{row.label}</dt>
    <dd className="break-words font-medium">{row.value}</dd>
  </div>)}</dl>;
}

function AuditChanges({ before, after }: { before: unknown; after: unknown }) {
  const beforeRows = new Map(auditPayloadRows(before).map((row) => [row.label, row.value]));
  const afterRows = new Map(auditPayloadRows(after).map((row) => [row.label, row.value]));
  const labels = [...new Set([...beforeRows.keys(), ...afterRows.keys()])];
  const changes = labels.flatMap((label) => {
    const oldValue = beforeRows.get(label);
    const newValue = afterRows.get(label);
    return oldValue === newValue ? [] : [{ label, before: oldValue ?? "Not set", after: newValue ?? "Removed" }];
  });
  if (changes.length === 0) return <p className="text-sm text-slate-500">No readable field changes were recorded.</p>;
  return <div className="space-y-2">{changes.map((change) => <div className="rounded-md border border-line bg-white p-3 dark:border-slate-700 dark:bg-slate-900" key={change.label}>
    <h4 className="mb-2 font-semibold">{change.label}</h4>
    <dl className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
      <div className="min-w-0"><dt className="text-xs font-medium uppercase text-slate-500">Before</dt><dd className="break-words">{change.before}</dd></div>
      <div className="min-w-0"><dt className="text-xs font-medium uppercase text-slate-500">After</dt><dd className="break-words font-semibold">{change.after}</dd></div>
    </dl>
  </div>)}</div>;
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
  if (firstWord === "supplier") return "suppliers";
  if (firstWord === "employee" || firstWord === "employees") return "users";
  if (firstWord === "stock") return "inventory";
  return firstWord;
}

function getGenericResourceConfig(endpoint: string, title: string): GenericResourceConfig | null {
  if (endpoint === "/categories" || endpoint.startsWith("/categories?")) {
    return {
      endpoint: "/categories",
      label: "Category",
      permission: "categories",
      empty: { name: "", description: "", status: "ACTIVE" },
      fields: [
        { key: "name", placeholder: "Category name", required: true },
        { key: "description", placeholder: "Description", className: "md:col-span-2" },
        { key: "status", placeholder: "Status", options: [{ value: "ACTIVE", label: "Active" }, { value: "ARCHIVED", label: "Archived" }] }
      ]
    };
  }

  if (endpoint === "/customers" || endpoint.startsWith("/customers?")) {
    return {
      endpoint: "/customers",
      label: "Customer",
      permission: "customers",
      empty: {
        fullName: "",
        phone: "",
        email: "",
        customerType: "Walk-in",
        loyaltyPoints: "0",
        creditBalance: "0",
        birthday: "",
        status: "ACTIVE",
        address: "",
        notes: ""
      },
      fields: [
        { key: "fullName", placeholder: "Customer name", required: true },
        { key: "phone", placeholder: "Phone" },
        { key: "email", placeholder: "Email", type: "email" },
        {
          key: "customerType",
          placeholder: "Customer type",
          options: [
            { value: "Walk-in", label: "Walk-in" },
            { value: "Regular", label: "Regular" },
            { value: "Member", label: "Member" },
            { value: "Wholesale", label: "Wholesale" }
          ]
        },
        { key: "loyaltyPoints", placeholder: "Loyalty points", type: "number" },
        { key: "creditBalance", placeholder: "Credit balance", type: "number", min: "0", max: MAX_MONEY_INPUT, step: "0.01" },
        { key: "birthday", placeholder: "Birthday", type: "date" },
        { key: "status", placeholder: "Status", options: [{ value: "ACTIVE", label: "Active" }, { value: "ARCHIVED", label: "Archived" }] },
        { key: "address", placeholder: "Address", className: "md:col-span-2" },
        { key: "notes", placeholder: "Notes", className: "md:col-span-3" }
      ]
    };
  }

  if (endpoint === "/users" || endpoint.startsWith("/users?")) {
    return {
      endpoint: "/users",
      label: title.toLowerCase().startsWith("employee") ? "Employee" : "User",
      permission: "users",
      empty: { fullName: "", email: "", phone: "", roleId: "", status: "ACTIVE", password: "" },
      fields: [
        { key: "fullName", placeholder: "Full name", required: true },
        { key: "email", placeholder: "Email", type: "email", required: true },
        { key: "phone", placeholder: "Phone" },
        { key: "roleId", placeholder: "Role", required: true, createOnly: true, optionsSource: "roles" },
        { key: "status", placeholder: "Status", options: [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }] },
        { key: "password", placeholder: "Temporary password", type: "password", required: true, createOnly: true }
      ]
    };
  }

  if (endpoint === "/supplier-products" || endpoint.startsWith("/supplier-products?")) {
    return {
      endpoint: "/supplier-products",
      label: "Supplier product",
      permission: "suppliers",
      createPermission: "suppliers.update",
      invalidatePrefixes: ["/supplier-products", "/suppliers", "/products"],
      empty: { supplierId: "", productId: "" },
      fields: [
        { key: "supplierId", placeholder: "Supplier", required: true, optionsSource: "suppliers" },
        { key: "productId", placeholder: "Product", required: true, optionsSource: "products" }
      ]
    };
  }

  return null;
}

export function ResourcePage({ title, endpoint, columns, showCreate = true }: ResourcePageProps) {
  const { hasPermission } = useAuth();
  const { id: detailId } = useParams();
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [stockStatus, setStockStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showProductForm, setShowProductForm] = useState(title === "New product");
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showGenericForm, setShowGenericForm] = useState(false);
  const [showBarcodeCamera, setShowBarcodeCamera] = useState(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Row | null>(null);
  const [labelQuantity, setLabelQuantity] = useState("1");
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(emptySupplierForm);
  const [genericForm, setGenericForm] = useState<GenericFormState>({});
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingGenericId, setEditingGenericId] = useState<string | null>(null);
  const [editingOriginalBarcode, setEditingOriginalBarcode] = useState("");
  const [importedSource, setImportedSource] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [saleFrom, setSaleFrom] = useState(searchParams.get("from") ?? "");
  const [saleTo, setSaleTo] = useState(searchParams.get("to") ?? "");
  const [salePaymentMethod, setSalePaymentMethod] = useState(searchParams.get("paymentMethod") ?? "");
  const [saleStatus, setSaleStatus] = useState(searchParams.get("status") ?? "");
  const [auditFrom, setAuditFrom] = useState(searchParams.get("from") ?? "");
  const [auditTo, setAuditTo] = useState(searchParams.get("to") ?? "");
  const [auditModule, setAuditModule] = useState(searchParams.get("module") ?? "");
  const [auditAction, setAuditAction] = useState(searchParams.get("action") ?? "");
  const [auditUserId, setAuditUserId] = useState(searchParams.get("userId") ?? "");
  const [selectedAuditLog, setSelectedAuditLog] = useState<Row | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const productList = endpoint.startsWith("/products");
  const salesList = title === "Sales" && endpoint.split("?")[0] === "/sales" && !detailId;
  const auditLogList = title === "Audit logs" && endpoint === "/audit-logs" && !detailId;
  const productParams = new URLSearchParams(endpoint.split("?")[1]);
  productParams.set("page", String(page)); productParams.set("limit", String(pageSize));
  productParams.set("search", debouncedSearch); productParams.set("sortBy", sortBy);
  productParams.set("sortOrder", sortBy === "name" ? "asc" : "desc");
  if (stockStatus) productParams.set("stockStatus", stockStatus);
  const productUrl = `/products?${productParams}`;
  const saleFilterParams = new URLSearchParams();
  for (const key of ["from", "to", "paymentMethod", "status"] as const) {
    const value = searchParams.get(key);
    if (value) saleFilterParams.set(key, value);
  }
  const saleFilterQuery = saleFilterParams.toString();
  const salesUrl = `${endpoint.split("?")[0]}${saleFilterQuery ? `?${saleFilterQuery}` : ""}`;
  const auditFilterParams = new URLSearchParams();
  for (const key of ["from", "to", "module", "action", "userId"] as const) {
    const value = searchParams.get(key);
    if (value) auditFilterParams.set(key, value);
  }
  const auditFilterQuery = auditFilterParams.toString();
  const auditLogsUrl = `${endpoint}${auditFilterQuery ? `?${auditFilterQuery}` : ""}`;
  const resourceListUrl = productList ? productUrl : salesList ? salesUrl : auditLogList ? auditLogsUrl : "";
  const { data: response, isLoading, isError, error: resourceError, refetch } = useQuery({ queryKey: [endpoint, detailId ?? resourceListUrl], queryFn: async () => {
    if (detailId) { const result = (await api.get<ApiResponse<Row>>(`${endpoint.split("?")[0]}/${detailId}`)).data; return { ...result, data: [result.data], meta: { total: 1 } }; }
    return (await api.get<ApiResponse<Row[]>>(resourceListUrl || endpoint)).data;
  } });
  const { data: auditFilterOptions } = useQuery({
    queryKey: ["/audit-logs/filter-options"],
    queryFn: () => getData<AuditLogFilterOptions>("/audit-logs/filter-options"),
    enabled: auditLogList
  });
  const data = response?.data ?? [];
  useEffect(() => { const timer = window.setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300); return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => {
    setSaleFrom(searchParams.get("from") ?? "");
    setSaleTo(searchParams.get("to") ?? "");
    setSalePaymentMethod(searchParams.get("paymentMethod") ?? "");
    setSaleStatus(searchParams.get("status") ?? "");
    setAuditFrom(searchParams.get("from") ?? "");
    setAuditTo(searchParams.get("to") ?? "");
    setAuditModule(searchParams.get("module") ?? "");
    setAuditAction(searchParams.get("action") ?? "");
    setAuditUserId(searchParams.get("userId") ?? "");
  }, [searchParams]);
  const supplierList = endpoint === "/suppliers" || endpoint.startsWith("/suppliers?");
  const genericConfig = getGenericResourceConfig(endpoint, title);
  const genericList = Boolean(genericConfig);
  const archivedList = productList && endpoint.toLowerCase().includes("status=archived");
  const activeProductList = productList && !archivedList;
  const editingSupplierProduct = genericConfig?.endpoint === "/supplier-products" && showGenericForm;
  const { data: categories = [] } = useQuery({ queryKey: ["/categories"], queryFn: () => getData<Row[]>("/categories"), enabled: activeProductList && showProductForm });
  const { data: suppliers = [] } = useQuery({ queryKey: ["/suppliers"], queryFn: () => getData<Row[]>("/suppliers"), enabled: (activeProductList && showProductForm) || editingSupplierProduct });
  const { data: productOptions = [] } = useQuery({ queryKey: ["/products?limit=100"], queryFn: () => getAllProducts<Row>(), enabled: editingSupplierProduct });
  const { data: roles = [] } = useQuery({ queryKey: ["/roles"], queryFn: () => getData<Row[]>("/roles"), enabled: genericConfig?.endpoint === "/users" && showGenericForm });
  const statusColumn = columns.includes("status");
  const showProductArchiveActions = productList && statusColumn;
  const showBarcodeActions = productList || title.toLowerCase().startsWith("barcode");
  const showSupplierActions = supplierList;
  const showGenericActions = genericList;
  const showRowActions = showProductArchiveActions || showBarcodeActions || showSupplierActions || showGenericActions;
  const createProduct = useMutation({
    mutationFn: async (payload: ProductFormState) => api.post("/products", {
      name: payload.name.trim(),
      sku: payload.sku.trim(),
      barcode: payload.barcode.trim(),
      categoryId: payload.categoryId,
      primarySupplierId: payload.primarySupplierId || null,
      description: payload.description.trim() || undefined,
      imageUrl: payload.imageUrl.trim() || undefined,
      costPrice: payload.costPrice || undefined,
      sellingPrice: payload.sellingPrice,
      ...(hasPermission("settings.update") ? { memberPrice: payload.memberPrice || null, wholesalePrice: payload.wholesalePrice || null, wholesaleMinQuantity: Number(payload.wholesaleMinQuantity || 10) } : {}),
      currentStock: editingProductId ? undefined : Number(payload.currentStock),
      reorderLevel: Number(payload.reorderLevel),
      unit: payload.unit.trim() || "pcs",
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
      if (searchParams.get("returnTo") === "supplier-products") {
        void queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0];
            return typeof key === "string" && ["/products", "/supplier-products"].some((prefix) => key.startsWith(prefix));
          }
        });
        navigate("/supplier-products");
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
  const updateProduct = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ProductFormState }) => api.put(`/products/${id}`, {
      name: payload.name.trim(),
      sku: payload.sku.trim(),
      barcode: payload.barcode.trim(),
      categoryId: payload.categoryId,
      primarySupplierId: payload.primarySupplierId || null,
      description: payload.description.trim() || undefined,
      imageUrl: payload.imageUrl.trim() || undefined,
      costPrice: payload.costPrice || undefined,
      sellingPrice: payload.sellingPrice,
      ...(hasPermission("settings.update") ? { memberPrice: payload.memberPrice || null, wholesalePrice: payload.wholesalePrice || null, wholesaleMinQuantity: Number(payload.wholesaleMinQuantity || 10) } : {}),
      currentStock: editingProductId ? undefined : Number(payload.currentStock),
      reorderLevel: Number(payload.reorderLevel),
      unit: payload.unit.trim() || "pcs",
      status: "ACTIVE"
    }),
    onSuccess: () => {
      toast.success("Product updated");
      setProductForm(emptyProductForm);
      setEditingProductId(null);
      setEditingOriginalBarcode("");
      setImportedSource("");
      setShowProductForm(false);
      setShowBarcodeCamera(false);
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && ["/products", "/supplier-products", "/inventory"].some((prefix) => key.startsWith(prefix));
        }
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => toast.error(error.response?.data?.message ?? "Product update failed")
  });
  const createSupplier = useMutation({
    mutationFn: async (payload: SupplierFormState) => api.post("/suppliers", supplierPayload(payload)),
    onSuccess: () => {
      toast.success("Supplier added");
      closeSupplierForm();
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/suppliers");
        }
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => toast.error(error.response?.data?.message ?? "Supplier create failed")
  });
  const updateSupplier = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: SupplierFormState }) => api.put(`/suppliers/${id}`, supplierPayload(payload)),
    onSuccess: () => {
      toast.success("Supplier updated");
      closeSupplierForm();
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && ["/suppliers", "/supplier-products", "/products"].some((prefix) => key.startsWith(prefix));
        }
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => toast.error(error.response?.data?.message ?? "Supplier update failed")
  });
  const createGeneric = useMutation({
    mutationFn: async () => {
      if (!genericConfig) throw new Error("Unsupported resource");
      return api.post(genericConfig.endpoint, genericPayload(genericConfig, genericForm, false));
    },
    onSuccess: () => {
      toast.success(`${genericConfig?.label ?? "Record"} added`);
      closeGenericForm();
      invalidateGenericQueries();
    },
    onError: (error: AxiosError<{ message?: string }>) => toast.error(error.response?.data?.message ?? "Create failed")
  });
  const updateGeneric = useMutation({
    mutationFn: async () => {
      if (!genericConfig || !editingGenericId) throw new Error("Unsupported resource");
      return api.put(`${genericConfig.endpoint}/${editingGenericId}`, genericPayload(genericConfig, genericForm, true));
    },
    onSuccess: () => {
      toast.success(`${genericConfig?.label ?? "Record"} updated`);
      closeGenericForm();
      invalidateGenericQueries();
    },
    onError: (error: AxiosError<{ message?: string }>) => toast.error(error.response?.data?.message ?? "Update failed")
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
  const rows = productList ? data : data.filter((row) => columns.some((column) => text(row[column]).toLowerCase().includes(search.toLowerCase())));
  const totalItems = productList ? Number(response?.meta.total ?? 0) : rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedRows = productList ? rows : rows.slice((page - 1) * pageSize, page * pageSize);
  const resource = productList ? "products" : resourcePermissionPrefix(title);
  const canOpenCreateForm = activeProductList || supplierList || genericList;
  const colSpan = columns.length + (showRowActions || auditLogList ? 1 : 0);

  useEffect(() => {
    setPage(1);
  }, [endpoint, search]);

  useEffect(() => {
    if (response && page > totalPages) setPage(totalPages);
  }, [page, totalPages, response]);

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

  useEffect(() => {
    const supplierId = searchParams.get("primarySupplierId");
    if (!activeProductList || searchParams.get("returnTo") !== "supplier-products" || !supplierId) return;
    setProductForm((current) => ({ ...current, primarySupplierId: supplierId }));
  }, [activeProductList, searchParams]);

  function openProductForm() {
    closeSupplierForm();
    closeGenericForm();
    setEditingProductId(null);
    setEditingOriginalBarcode("");
    setProductForm((current) => ({ ...current, sku: current.sku || generateSkuFromBarcode(current.barcode) }));
    setShowProductForm(true);
  }

  function openSupplierForm() {
    closeProductForm();
    closeGenericForm();
    setEditingSupplierId(null);
    setSupplierForm(emptySupplierForm);
    setShowSupplierForm(true);
  }

  function openGenericForm() {
    if (!genericConfig) return;
    closeProductForm();
    closeSupplierForm();
    setEditingGenericId(null);
    setGenericForm(genericConfig.empty);
    setShowGenericForm(true);
  }

  function supplierPayload(payload: SupplierFormState) {
    return {
      name: payload.name.trim(),
      contactPerson: payload.contactPerson.trim() || undefined,
      phone: payload.phone.trim() || undefined,
      email: payload.email.trim(),
      address: payload.address.trim() || undefined,
      paymentTerms: payload.paymentTerms.trim() || undefined,
      deliveryLeadTime: payload.deliveryLeadTime === "" ? undefined : Number(payload.deliveryLeadTime),
      status: payload.status,
      notes: payload.notes.trim() || undefined
    };
  }

  function productFormFromRow(row: Row): ProductFormState {
    const category = row.category && typeof row.category === "object" ? row.category as Row : null;
    const primarySupplier = row.primarySupplier && typeof row.primarySupplier === "object" ? row.primarySupplier as Row : null;
    return {
      name: text(row.name),
      sku: text(row.sku),
      barcode: text(row.barcode),
      categoryId: text(row.categoryId) || text(category?.id),
      primarySupplierId: text(row.primarySupplierId) || text(primarySupplier?.id),
      description: text(row.description),
      costPrice: text(row.costPrice),
      sellingPrice: text(row.sellingPrice),
      memberPrice: text(row.memberPrice),
      wholesalePrice: text(row.wholesalePrice),
      wholesaleMinQuantity: text(row.wholesaleMinQuantity) || "10",
      currentStock: text(row.currentStock) || "0",
      reorderLevel: text(row.reorderLevel) || "0",
      unit: text(row.unit) || "pcs",
      imageUrl: text(row.imageUrl)
    };
  }

  function openEditProductForm(row: Row) {
    const rowId = typeof row.id === "string" ? row.id : "";
    if (!rowId) return;
    closeSupplierForm();
    closeGenericForm();
    const nextForm = productFormFromRow(row);
    setEditingProductId(rowId);
    setEditingOriginalBarcode(nextForm.barcode);
    setProductForm(nextForm);
    setImportedSource("");
    setShowBarcodeCamera(false);
    setShowProductForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEditSupplierForm(row: Row) {
    const rowId = typeof row.id === "string" ? row.id : "";
    if (!rowId) return;
    closeProductForm();
    closeGenericForm();
    setEditingSupplierId(rowId);
    setSupplierForm({
      name: text(row.name),
      contactPerson: text(row.contactPerson),
      phone: supplierPhoneForForm(text(row.phone)),
      email: text(row.email),
      address: text(row.address),
      paymentTerms: text(row.paymentTerms),
      deliveryLeadTime: text(row.deliveryLeadTime),
      status: text(row.status) === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
      notes: text(row.notes)
    });
    setShowSupplierForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEditGenericForm(row: Row) {
    if (!genericConfig) return;
    const rowId = typeof row.id === "string" ? row.id : "";
    if (!rowId) return;
    closeProductForm();
    closeSupplierForm();
    setEditingGenericId(rowId);
    const nextForm = { ...genericConfig.empty };
    genericConfig.fields.forEach((field) => {
      if (field.key === "roleId") {
        const role = row.role && typeof row.role === "object" ? row.role as Row : null;
        nextForm.roleId = text(row.roleId) || text(role?.id);
        return;
      }
      if (field.createOnly) return;
      nextForm[field.key] = text(row[field.key]);
    });
    setGenericForm(nextForm);
    setShowGenericForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  function updateSupplierForm<K extends keyof SupplierFormState>(key: K, value: SupplierFormState[K]) {
    setSupplierForm((current) => ({ ...current, [key]: value }));
  }

  function updateGenericForm(key: string, value: string) {
    setGenericForm((current) => ({ ...current, [key]: value }));
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productForm.categoryId) {
      toast.error("Category is required");
      return;
    }
    if (!editingProductId || productForm.barcode.trim() !== editingOriginalBarcode) {
      try {
        await getData(`/barcodes/${encodeURIComponent(productForm.barcode.trim())}`);
        toast.error("Barcode already belongs to another product");
        return;
      } catch (error) {
        const status = error instanceof AxiosError ? error.response?.status : undefined;
        if (status !== 404) {
          toast.error("Could not validate barcode");
          return;
        }
      }
    }
    if (editingProductId) {
      updateProduct.mutate({ id: editingProductId, payload: { ...productForm, sku: productForm.sku.trim() || generateSkuFromBarcode(productForm.barcode) } });
      return;
    }
    createProduct.mutate({ ...productForm, sku: productForm.sku.trim() || generateSkuFromBarcode(productForm.barcode) });
  }

  function submitSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingSupplierId) {
      updateSupplier.mutate({ id: editingSupplierId, payload: supplierForm });
      return;
    }
    createSupplier.mutate(supplierForm);
  }

  function submitGeneric(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingGenericId) {
      updateGeneric.mutate();
      return;
    }
    createGeneric.mutate();
  }

  function addProductForSelectedSupplier() {
    const supplierId = genericForm.supplierId;
    if (!supplierId) return;
    const params = new URLSearchParams({ primarySupplierId: supplierId, returnTo: "supplier-products" });
    navigate(`/products/new?${params.toString()}`);
  }

  function closeProductForm() {
    setShowProductForm(false);
    setShowBarcodeCamera(false);
    setEditingProductId(null);
    setEditingOriginalBarcode("");
    setProductForm(emptyProductForm);
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

  function closeSupplierForm() {
    setShowSupplierForm(false);
    setEditingSupplierId(null);
    setSupplierForm(emptySupplierForm);
  }

  function closeGenericForm() {
    setShowGenericForm(false);
    setEditingGenericId(null);
    setGenericForm({});
  }

  function invalidateGenericQueries() {
    if (!genericConfig) return;
    void queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        const prefixes = genericConfig.invalidatePrefixes ?? [genericConfig.endpoint];
        return typeof key === "string" && prefixes.some((prefix) => key.startsWith(prefix));
      }
    });
  }

  function genericPayload(config: GenericResourceConfig, form: GenericFormState, editing: boolean) {
    const payload: Record<string, string | number | undefined> = {};
    config.fields.forEach((field) => {
      if (editing && field.createOnly) return;
      if (config.endpoint === "/users" && field.key === "status" && editing && !hasPermission("users.activate") && !hasPermission("users.deactivate")) return;
      const value = form[field.key]?.trim() ?? "";
      if (value === "" && !field.required) return;
      payload[field.key] = field.type === "number" ? Number(value) : value;
    });
    return payload;
  }

  function paginatedExportRows() { return rows; }

  function printBarcodeLabels() {
    window.print();
  }

  function filterAuditLogsByUser(userId: string) {
    if (!userId) return;
    setAuditUserId(userId);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("userId", userId);
    setSearchParams(nextParams);
  }

  async function exportCsv() {
    const rows = productList ? await getAllProducts<Row>(productUrl) : paginatedExportRows();
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

  async function exportPdf() {
    const rows = productList ? await getAllProducts<Row>(productUrl) : paginatedExportRows();
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
    doc.text(`${totalItems} records exported ${new Date().toLocaleString()}`, margin, y);
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
      {detailId && <Link className="text-sm text-brand underline" to={endpoint.split("?")[0]}>Back to list</Link>}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-slate-500">{totalItems} records</p></div>
        <div className="flex flex-wrap gap-2">
          {showProductArchiveActions && <Link to={archivedList ? "/products" : "/products/archive"} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"><Archive size={16} /> {archivedList ? "Active" : "Archive"}</Link>}
          {!detailId && showCreate && canOpenCreateForm && (!productList || activeProductList) && (!genericConfig || genericConfig.allowCreate !== false) && <Can permission={genericConfig?.createPermission ?? `${resource}.create`}><Button onClick={activeProductList ? openProductForm : supplierList ? openSupplierForm : openGenericForm}><Plus size={16} /> {genericConfig?.endpoint === "/supplier-products" ? "Add supplier product" : "Add"}</Button></Can>}
          <Can anyPermissions={[`${resource}.export`, "reports.export"]}><Button onClick={() => void exportCsv().catch((error) => toast.error(errorMessage(error)))} disabled={isLoading} className="bg-slate-700"><Download size={16} /> CSV</Button></Can>
          <Can anyPermissions={[`${resource}.export`, "reports.export"]}><Button onClick={() => void exportPdf().catch((error) => toast.error(errorMessage(error)))} disabled={isLoading} className="bg-accent"><FileText size={16} /> PDF</Button></Can>
        </div>
      </div>
      {showProductForm && (
        <Card className="mx-auto max-w-6xl overflow-hidden !p-0">
          <form onSubmit={submitProduct}>
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 dark:border-slate-700 sm:px-6">
              <div>
                <h2 className="text-lg font-bold">{editingProductId ? "Edit product" : "Add product"}</h2>
                <p className="mt-1 text-sm text-slate-500">Enter the product details, pricing, and starting stock.</p>
              </div>
              <button type="button" className="rounded-lg border border-line p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" onClick={closeProductForm} aria-label="Close product form"><X size={18} /></button>
            </div>
            <div className="space-y-5 p-4 sm:p-6">
              {importedSource && (
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-100">
                  Product details came from {importedSource === "upcitemdb" ? "UPCitemdb" : "Open Food Facts"}. Review the imported information and enter your local prices, stock, supplier, and category before saving.
                </div>
              )}

              <section className="space-y-4 rounded-xl border border-line p-4 dark:border-slate-700 sm:p-5">
                <div><h3 className="font-semibold">Product details</h3><p className="mt-1 text-xs text-slate-500">Name, identifiers, and catalog information.</p></div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label htmlFor="product-name" className="grid gap-1.5 text-sm font-medium md:col-span-2 xl:col-span-2">Product name
                    <Input id="product-name" aria-label="Product name" required placeholder="e.g. Bottled water 500 ml" value={productForm.name} onChange={(event) => updateProductForm("name", event.target.value)} />
                    {importedSource && <span className="text-xs font-normal text-teal-700">Imported from external API</span>}
                  </label>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] xl:col-span-2">
                    <label htmlFor="product-sku" className="grid gap-1.5 text-sm font-medium">SKU
                      <Input id="product-sku" aria-label="SKU" placeholder="Optional stock keeping unit" value={productForm.sku} onChange={(event) => updateProductForm("sku", event.target.value)} />
                    </label>
                    <Button type="button" className="self-end bg-slate-700 hover:bg-slate-800" aria-label="Generate SKU" onClick={() => updateProductForm("sku", generateSkuFromBarcode(productForm.barcode))}><Hash size={16} /> Generate</Button>
                  </div>
                  <div className="space-y-1.5 md:col-span-2 xl:col-span-4">
                    <label htmlFor="product-barcode" className="block text-sm font-medium">Barcode <span className="text-red-600">*</span></label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input id="product-barcode" aria-label="Barcode" required className="min-w-0 flex-1" placeholder="Scan or enter a barcode" value={productForm.barcode} onChange={(event) => updateProductForm("barcode", event.target.value)} />
                      <div className="flex gap-2">
                        <Button type="button" className="flex-1 bg-slate-700 hover:bg-slate-800 sm:flex-none" aria-label="Generate barcode" onClick={() => updateProductForm("barcode", generateProductBarcode())}><Barcode size={16} /> Generate</Button>
                        <Button type="button" className="flex-1 bg-slate-700 hover:bg-slate-800 sm:flex-none" aria-label="Scan barcode" onClick={() => setShowBarcodeCamera((isOpen) => !isOpen)}><Camera size={16} /> Scan</Button>
                      </div>
                    </div>
                  </div>
                  <label htmlFor="product-category" className="grid gap-1.5 text-sm font-medium">Category
                    <select id="product-category" required className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-950" value={productForm.categoryId} onChange={(event) => updateProductForm("categoryId", event.target.value)}>
                      <option value="">Select category</option>
                      {categories.map((category) => <option key={String(category.id)} value={String(category.id)}>{text(category.name)}</option>)}
                    </select>
                  </label>
                  <label htmlFor="product-supplier" className="grid gap-1.5 text-sm font-medium">Primary supplier <span className="text-xs font-normal text-slate-500">Optional</span>
                    <select id="product-supplier" className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-950" value={productForm.primarySupplierId} onChange={(event) => updateProductForm("primarySupplierId", event.target.value)}>
                      <option value="">No supplier</option>
                      {suppliers.map((supplier) => <option key={String(supplier.id)} value={String(supplier.id)}>{text(supplier.name)}</option>)}
                    </select>
                  </label>
                  <label htmlFor="product-unit" className="grid gap-1.5 text-sm font-medium">Unit
                    <Input id="product-unit" aria-label="Unit" placeholder="pcs, bottle, kg..." value={productForm.unit} onChange={(event) => updateProductForm("unit", event.target.value)} />
                  </label>
                  <label htmlFor="product-image-url" className="grid gap-1.5 text-sm font-medium">Product image URL <span className="text-xs font-normal text-slate-500">Optional</span>
                    <Input id="product-image-url" aria-label="Product image URL" placeholder="https://..." value={productForm.imageUrl} onChange={(event) => updateProductForm("imageUrl", event.target.value)} />
                    {importedSource && productForm.imageUrl && <span className="text-xs font-normal text-teal-700">Imported image URL</span>}
                  </label>
                  <label htmlFor="product-description" className="grid gap-1.5 text-sm font-medium md:col-span-2 xl:col-span-4">Description <span className="text-xs font-normal text-slate-500">Optional</span>
                    <Input id="product-description" aria-label="Description" placeholder="Add product notes or details" value={productForm.description} onChange={(event) => updateProductForm("description", event.target.value)} />
                    {importedSource && productForm.description && <span className="text-xs font-normal text-teal-700">Imported from external API</span>}
                  </label>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-line p-4 dark:border-slate-700 sm:p-5">
                <div><h3 className="font-semibold">Pricing and inventory</h3><p className="mt-1 text-xs text-slate-500">Prices are per unit, up to {peso(MAX_MONEY_INPUT)} (12 digits). Use Inventory adjustment to change stock after the product is created.</p></div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <label htmlFor="product-cost-price" className="grid gap-1.5 text-sm font-medium">Cost price (PHP)
                    <Input id="product-cost-price" aria-label="Cost price in PHP" required={!editingProductId || hasPermission("products.view_cost")} disabled={Boolean(editingProductId) && !hasPermission("products.view_cost")} min="0" max={MAX_MONEY_INPUT} step="0.01" type="number" placeholder="0.00" value={productForm.costPrice} onChange={(event) => { if (isMoneyInputWithinLimit(event.target.value)) updateProductForm("costPrice", event.target.value); }} />
                  </label>
                  <label htmlFor="product-selling-price" className="grid gap-1.5 text-sm font-medium">Selling price (PHP)
                    <Input id="product-selling-price" aria-label="Selling price in PHP" required min="0" max={MAX_MONEY_INPUT} step="0.01" type="number" placeholder="0.00" value={productForm.sellingPrice} onChange={(event) => { if (isMoneyInputWithinLimit(event.target.value)) updateProductForm("sellingPrice", event.target.value); }} />
                  </label>
                  {hasPermission("settings.update") && <>
                    <label htmlFor="product-member-price" className="grid gap-1.5 text-sm font-medium">Optional member price (PHP)
                      <Input id="product-member-price" aria-label="Optional member price in PHP" min="0" max={MAX_MONEY_INPUT} step="0.01" type="number" placeholder="Use retail price" value={productForm.memberPrice} onChange={(event) => { if (isMoneyInputWithinLimit(event.target.value)) updateProductForm("memberPrice", event.target.value); }} />
                    </label>
                    <label htmlFor="product-wholesale-price" className="grid gap-1.5 text-sm font-medium">Optional wholesale price (PHP)
                      <Input id="product-wholesale-price" aria-label="Optional wholesale price in PHP" min="0" max={MAX_MONEY_INPUT} step="0.01" type="number" placeholder="Use retail price" value={productForm.wholesalePrice} onChange={(event) => { if (isMoneyInputWithinLimit(event.target.value)) updateProductForm("wholesalePrice", event.target.value); }} />
                    </label>
                    <label htmlFor="product-wholesale-min-quantity" className="grid gap-1.5 text-sm font-medium">Wholesale minimum quantity
                      <Input id="product-wholesale-min-quantity" aria-label="Wholesale minimum quantity" min="1" max={MAX_PRODUCT_STOCK} step="1" type="number" required={Boolean(productForm.wholesalePrice)} value={productForm.wholesaleMinQuantity} onChange={(event) => { const value = event.target.value; if (/^\d{0,10}$/.test(value) && (!value || Number(value) <= MAX_PRODUCT_STOCK)) updateProductForm("wholesaleMinQuantity", value); }} />
                    </label>
                  </>}
                  <label htmlFor="product-current-stock" className="grid gap-1.5 text-sm font-medium">Starting stock
                    <Input id="product-current-stock" disabled={Boolean(editingProductId)} title="Use Inventory adjustment to change existing stock" required min="0" max={MAX_PRODUCT_STOCK} step="1" type="number" value={productForm.currentStock} onChange={(event) => { const value = event.target.value; if (value === "" || (/^\d{1,10}$/.test(value) && Number(value) <= MAX_PRODUCT_STOCK)) updateProductForm("currentStock", value); }} />
                    <span className="text-xs font-normal text-slate-500">Maximum: {MAX_PRODUCT_STOCK.toLocaleString()} units</span>
                  </label>
                  <label htmlFor="product-reorder-level" className="grid gap-1.5 text-sm font-medium">Low-stock alert level
                    <Input id="product-reorder-level" required min="0" max={MAX_PRODUCT_STOCK} step="1" type="number" value={productForm.reorderLevel} onChange={(event) => { const value = event.target.value; if (value === "" || (/^\d{1,10}$/.test(value) && Number(value) <= MAX_PRODUCT_STOCK)) updateProductForm("reorderLevel", value); }} />
                    <span className="text-xs font-normal text-slate-500">Maximum: {MAX_PRODUCT_STOCK.toLocaleString()} units</span>
                  </label>
                </div>
              </section>

              {productForm.imageUrl && (
                <div className="flex items-center gap-4 rounded-xl border border-line bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950">
                  <img className="h-16 w-16 rounded-lg bg-white object-contain" src={productForm.imageUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                  <span className="text-slate-600 dark:text-slate-300">Product image preview</span>
                </div>
              )}
              {showBarcodeCamera && <CameraBarcodeScanner onClose={() => setShowBarcodeCamera(false)} onScan={(scannedBarcode) => { updateProductForm("barcode", scannedBarcode); setShowBarcodeCamera(false); }} />}

              <section className="space-y-4 rounded-xl border border-line p-4 dark:border-slate-700 sm:p-5">
                <div><h3 className="font-semibold">Barcode labels</h3><p className="mt-1 text-xs text-slate-500">Preview the barcode and choose how many labels to print.</p></div>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_auto] lg:items-end">
                  <BarcodeLabel value={productForm.barcode} productName={productForm.name || "New product"} price={productForm.sellingPrice ? peso(productForm.sellingPrice) : undefined} />
                  <label htmlFor="barcode-label-quantity" className="grid gap-1.5 text-sm font-medium">Label quantity
                    <Input id="barcode-label-quantity" min="1" step="1" type="number" value={labelQuantity} onChange={(event) => setLabelQuantity(event.target.value)} />
                  </label>
                  <Button type="button" className="bg-slate-700 hover:bg-slate-800" disabled={!productForm.barcode.trim()} onClick={printBarcodeLabels}><Printer size={16} /> Print barcode</Button>
                </div>
              </section>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-line bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:justify-end sm:px-6">
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={closeProductForm}>Cancel</Button>
              <Button type="submit" busy={createProduct.isPending || updateProduct.isPending}>{createProduct.isPending || updateProduct.isPending ? "Saving..." : editingProductId ? "Update product" : "Save product"}</Button>
            </div>
          </form>
        </Card>
      )}
      {showSupplierForm && (
        <Card className="mx-auto max-w-5xl overflow-hidden !p-0">
          <form onSubmit={submitSupplier}>
            <div className="flex items-start justify-between gap-4 border-b border-line bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-950 sm:px-6">
              <div>
                <h2 className="text-lg font-bold">{editingSupplierId ? "Edit supplier" : "Add supplier"}</h2>
                <p className="mt-1 text-sm text-slate-500">Save contact details and delivery terms for this supplier.</p>
              </div>
              <button type="button" className="rounded-lg border border-line bg-white p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800" onClick={closeSupplierForm} aria-label="Close supplier form"><X size={18} /></button>
            </div>
            <div className="space-y-5 p-4 sm:p-6">
              <section className="space-y-4 rounded-xl border border-line p-4 dark:border-slate-700 sm:p-5">
                <div><h3 className="font-semibold">Contact information</h3><p className="mt-1 text-xs text-slate-500">Name is required. Add a contact, phone, or email to make follow-up easier.</p></div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <label htmlFor="supplier-name" className="grid gap-1.5 text-sm font-medium">Supplier name <span className="text-red-600">*</span>
                    <Input id="supplier-name" required autoFocus placeholder="e.g. Metro Wholesale" value={supplierForm.name} onChange={(event) => updateSupplierForm("name", event.target.value)} />
                  </label>
                  <label htmlFor="supplier-contact-person" className="grid gap-1.5 text-sm font-medium">Contact person
                    <Input id="supplier-contact-person" placeholder="Full name" value={supplierForm.contactPerson} onChange={(event) => updateSupplierForm("contactPerson", event.target.value)} />
                  </label>
                  <label htmlFor="supplier-phone" className="grid gap-1.5 text-sm font-medium">Phone
                    <div className="flex gap-2">
                      <span aria-hidden="true" className="inline-flex h-11 shrink-0 items-center rounded-lg border border-line bg-slate-50 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">09</span>
                      <Input id="supplier-phone" className="!w-0 flex-1" type="tel" inputMode="numeric" maxLength={9} pattern="[0-9]{9}" title="Enter the 9 digits after the 09 prefix." placeholder="9 digits" value={supplierPhoneLocalPart(supplierForm.phone)} onChange={(event) => {
                        const localPart = supplierPhoneInput(event.target.value).slice(0, 9);
                        updateSupplierForm("phone", localPart ? `09${localPart}` : "");
                      }} />
                    </div>
                    <span className="text-xs font-normal text-slate-500">Optional. Enter 9 digits after 09 (11 digits total).</span>
                  </label>
                  <label htmlFor="supplier-email" className="grid gap-1.5 text-sm font-medium sm:col-span-2 xl:col-span-1">Email
                    <Input id="supplier-email" type="email" placeholder="name@example.com" value={supplierForm.email} onChange={(event) => updateSupplierForm("email", event.target.value)} />
                  </label>
                  <label htmlFor="supplier-address" className="grid gap-1.5 text-sm font-medium sm:col-span-2">Address <span className="text-xs font-normal text-slate-500">Optional</span>
                    <Input id="supplier-address" placeholder="Street, city, or delivery location" value={supplierForm.address} onChange={(event) => updateSupplierForm("address", event.target.value)} />
                  </label>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-line p-4 dark:border-slate-700 sm:p-5">
                <div><h3 className="font-semibold">Notes</h3><p className="mt-1 text-xs text-slate-500">Optional ordering or account notes for staff.</p></div>
                <textarea id="supplier-notes" rows={3} className="w-full resize-y rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-shadow placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="Add supplier notes" value={supplierForm.notes} onChange={(event) => updateSupplierForm("notes", event.target.value)} />
              </section>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-line bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:justify-end sm:px-6">
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={closeSupplierForm}>Cancel</Button>
              <Button type="submit" busy={createSupplier.isPending || updateSupplier.isPending}>{createSupplier.isPending || updateSupplier.isPending ? "Saving..." : editingSupplierId ? "Update supplier" : "Save supplier"}</Button>
            </div>
          </form>
        </Card>
      )}
      {showGenericForm && genericConfig && (
        <Card>
          <form className="space-y-4" onSubmit={submitGeneric}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{editingGenericId ? `Edit ${genericConfig.label.toLowerCase()}` : `Add ${genericConfig.label.toLowerCase()}`}</h2>
              <button type="button" className="rounded-md border border-line p-2 dark:border-slate-700" onClick={closeGenericForm} aria-label="Close edit form"><X size={18} /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {genericConfig.fields.filter((field) => (!field.createOnly || !editingGenericId) && !(genericConfig.endpoint === "/users" && field.key === "status" && editingGenericId && !hasPermission("users.activate") && !hasPermission("users.deactivate"))).map((field) => {
                const sourcedOptions = field.optionsSource === "roles"
                  ? roles.map((role) => ({ value: text(role.id), label: text(role.name) }))
                  : field.optionsSource === "suppliers"
                    ? suppliers.filter((supplier) => genericConfig.endpoint !== "/supplier-products" || text(supplier.status) === "ACTIVE").map((supplier) => ({ value: text(supplier.id), label: text(supplier.name) }))
                    : field.optionsSource === "products"
                      ? productOptions.map((product) => ({ value: text(product.id), label: `${text(product.name)}${text(product.sku) ? ` (${text(product.sku)})` : ""}` }))
                      : undefined;
                const options = sourcedOptions ?? field.options;
                if (options) {
                  const select = <select required={field.required} className={`${field.className ?? ""} h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950`} value={genericForm[field.key] ?? ""} onChange={(event) => updateGenericForm(field.key, event.target.value)}>
                    <option value="">{field.placeholder}</option>
                    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>;
                  if (genericConfig.endpoint === "/supplier-products" && field.key === "productId") {
                    return <div className="space-y-2" key={field.key}>{select}{hasPermission("products.create") && <Button type="button" className="bg-slate-700 hover:bg-slate-800" disabled={!genericForm.supplierId} onClick={addProductForSelectedSupplier}><Plus size={16} /> Add new product</Button>}</div>;
                  }
                  return (
                    <div key={field.key}>{select}</div>
                  );
                }
                return <Input key={field.key} required={field.required} className={field.className} type={field.type ?? "text"} min={field.min} max={field.max} step={field.step} placeholder={field.placeholder} value={genericForm[field.key] ?? ""} onChange={(event) => updateGenericForm(field.key, event.target.value)} />;
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={closeGenericForm}>Cancel</Button>
              <Button type="submit" disabled={createGeneric.isPending || updateGeneric.isPending}>{createGeneric.isPending || updateGeneric.isPending ? "Saving..." : editingGenericId ? `Update ${genericConfig.label.toLowerCase()}` : `Save ${genericConfig.label.toLowerCase()}`}</Button>
            </div>
          </form>
        </Card>
      )}
      {isError && <QueryState error message={errorMessage(resourceError)} onRetry={() => void refetch()} />}
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Search size={18} />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} />
          {productList && <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">Sort by<select aria-label="Sort and filter products" className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" value={stockStatus === "out" ? "outStock" : sortBy} onChange={(event) => { const value = event.target.value; if (value === "allStock") { setStockStatus(""); setSortBy("updatedAt"); } else if (value === "outStock") { setStockStatus("out"); setSortBy("updatedAt"); } else { setStockStatus(""); setSortBy(value); } setPage(1); }}><optgroup label="Sort by"><option value="updatedAt">Recently updated</option><option value="name">Name A–Z</option><option value="currentStock">Stock: high to low</option><option value="sellingPrice">Price: high to low</option></optgroup><optgroup label="Stock status"><option value="allStock">All stock</option><option value="outStock">Out of stock</option></optgroup></select></label>}
        {productList && (search || stockStatus || sortBy !== "updatedAt") && <Button type="button" className="bg-slate-700" onClick={() => { setSearch(""); setStockStatus(""); setSortBy("updatedAt"); setPage(1); }}>Clear all</Button>}
        </div>
        {salesList && <form className="mb-4 grid gap-3 rounded-lg border border-line p-3 dark:border-slate-700 sm:grid-cols-2 xl:grid-cols-5" onSubmit={(event) => {
          event.preventDefault();
          if (saleFrom && saleTo && saleFrom > saleTo) { toast.error("Start date must be before or equal to the end date"); return; }
          const nextParams = new URLSearchParams(searchParams);
          const filters = { from: saleFrom, to: saleTo, paymentMethod: salePaymentMethod, status: saleStatus };
          Object.entries(filters).forEach(([key, value]) => value ? nextParams.set(key, value) : nextParams.delete(key));
          setPage(1);
          setSearchParams(nextParams);
        }}>
          <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">From<Input aria-label="Sales from date" type="date" value={saleFrom} onChange={(event) => setSaleFrom(event.target.value)} /></label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">To<Input aria-label="Sales to date" type="date" min={saleFrom || undefined} value={saleTo} onChange={(event) => setSaleTo(event.target.value)} /></label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Payment method<select aria-label="Filter sales by payment method" className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-950" value={salePaymentMethod} onChange={(event) => setSalePaymentMethod(event.target.value)}>
            <option value="">All payment methods</option><option value="CASH">Cash</option><option value="GCASH">GCash</option><option value="MAYA">Maya</option><option value="BANK_TRANSFER">Bank transfer</option><option value="DEBIT_CARD">Debit card</option><option value="CREDIT_CARD">Credit card</option><option value="CUSTOMER_CREDIT">Customer credit</option><option value="MIXED">Mixed</option>
          </select></label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Status<select aria-label="Filter sales by status" className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-950" value={saleStatus} onChange={(event) => setSaleStatus(event.target.value)}>
            <option value="">All statuses</option><option value="COMPLETED">Completed</option><option value="PENDING">Pending</option><option value="HELD">Held</option><option value="CANCELLED">Cancelled</option><option value="PARTIALLY_REFUNDED">Partially refunded</option><option value="REFUNDED">Refunded</option>
          </select></label>
          <div className="flex items-end gap-2"><Button type="submit">Apply</Button>{(saleFrom || saleTo || salePaymentMethod || saleStatus) && <Button type="button" className="bg-slate-700" onClick={() => {
            setSaleFrom(""); setSaleTo(""); setSalePaymentMethod(""); setSaleStatus(""); setPage(1);
            const nextParams = new URLSearchParams(searchParams);
            ["from", "to", "paymentMethod", "status"].forEach((key) => nextParams.delete(key));
            setSearchParams(nextParams);
          }}>Reset</Button>}</div>
        </form>}
        {auditLogList && <form className="mb-4 grid gap-3 rounded-lg border border-line p-3 dark:border-slate-700 sm:grid-cols-2 xl:grid-cols-6" onSubmit={(event) => {
          event.preventDefault();
          if (auditFrom && auditTo && auditFrom > auditTo) { toast.error("Start date must be before or equal to the end date"); return; }
          const nextParams = new URLSearchParams(searchParams);
          const filters = { from: auditFrom, to: auditTo, module: auditModule, action: auditAction, userId: auditUserId };
          Object.entries(filters).forEach(([key, value]) => value ? nextParams.set(key, value) : nextParams.delete(key));
          setPage(1);
          setSearchParams(nextParams);
        }}>
          <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">From<Input aria-label="Audit logs from date" type="date" value={auditFrom} onChange={(event) => setAuditFrom(event.target.value)} /></label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">To<Input aria-label="Audit logs to date" type="date" min={auditFrom || undefined} value={auditTo} onChange={(event) => setAuditTo(event.target.value)} /></label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Module<select aria-label="Filter audit logs by module" className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-950" value={auditModule} onChange={(event) => setAuditModule(event.target.value)}>
            <option value="">All modules</option>{auditFilterOptions?.modules.map((module) => <option key={module} value={module}>{module}</option>)}
          </select></label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Action<select aria-label="Filter audit logs by action" className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-950" value={auditAction} onChange={(event) => setAuditAction(event.target.value)}>
            <option value="">All actions</option>{auditFilterOptions?.actions.map((action) => <option key={action} value={action}>{action}</option>)}
          </select></label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">User<select aria-label="Filter audit logs by user" className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-950" value={auditUserId} onChange={(event) => setAuditUserId(event.target.value)}>
            <option value="">All users</option>{auditFilterOptions?.users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}
          </select></label>
          <div className="flex items-end gap-2"><Button type="submit">Apply</Button>{(auditFrom || auditTo || auditModule || auditAction || auditUserId) && <Button type="button" className="bg-slate-700" onClick={() => {
            setAuditFrom(""); setAuditTo(""); setAuditModule(""); setAuditAction(""); setAuditUserId(""); setPage(1);
            const nextParams = new URLSearchParams(searchParams);
            ["from", "to", "module", "action", "userId"].forEach((key) => nextParams.delete(key));
            setSearchParams(nextParams);
          }}>Reset</Button>}</div>
        </form>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b text-xs uppercase text-slate-500">{columns.map((column) => <th className="py-3 pr-4" key={column}>{column.replace(/([A-Z])/g, " $1")}</th>)}{(showRowActions || auditLogList) && <th className="py-3 pr-4">{auditLogList ? "details" : "actions"}</th>}</tr></thead>
            <tbody>
              {isLoading && <tr><td className="py-6 text-slate-500" colSpan={colSpan}>Loading...</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td className="py-6 text-slate-500" colSpan={colSpan}>No records found.</td></tr>}
              {paginatedRows.map((row) => {
                const rowId = typeof row.id === "string" ? row.id : "";
                const rowArchived = text(row.status) === "ARCHIVED";
                return (
                  <tr className="border-b last:border-0" key={String(row.id ?? JSON.stringify(row))}>
                    {columns.map((column) => {
                      const auditUser = column === "user" && row.user && typeof row.user === "object" ? row.user as Record<string, unknown> : null;
                      const auditUserId = typeof auditUser?.id === "string" ? auditUser.id : "";
                      return <td className="py-3 pr-4" key={column}>{auditLogList && column === "action" ? <button type="button" className="font-medium text-brand underline-offset-4 hover:underline dark:text-teal-300" onClick={() => setSelectedAuditLog(row)}>{text(row[column]).replace(/_/g, " ")}</button> : !detailId && column === columns[0] && ["/products", "/suppliers", "/customers", "/sales"].includes(endpoint.split("?")[0]) ? <Link className="font-medium text-brand underline-offset-4 hover:underline dark:text-teal-300" to={`${endpoint.split("?")[0]}/${rowId}`}>{text(row[column])}</Link> : auditLogList && column === "user" && auditUserId ? <button type="button" className="font-medium text-brand underline-offset-4 hover:underline dark:text-teal-300" onClick={() => filterAuditLogsByUser(auditUserId)}>{text(row[column])}</button> : column === "status" ? <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${text(row[column]) === "ACTIVE" || text(row[column]) === "COMPLETED" ? "bg-teal-50 text-brand dark:bg-teal-950 dark:text-teal-200" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{text(row[column]).replace(/_/g, " ")}</span> : text(row[column])}</td>;
                    })}
                    {auditLogList && <td className="py-3 pr-4"><Button type="button" className="h-8 bg-slate-700 px-3 text-xs hover:bg-slate-800" onClick={() => setSelectedAuditLog(row)}>View details</Button></td>}
                    {showRowActions && (
                      <td className="space-y-2 py-3 pr-4">
                        {activeProductList && <Can permission="products.update"><Button className="h-8 bg-brand px-3 text-xs" disabled={!rowId} onClick={() => openEditProductForm(row)}><Pencil size={14} /> Edit</Button></Can>}
                        {showSupplierActions && <Can permission="suppliers.update"><Button className="h-8 bg-brand px-3 text-xs" disabled={!rowId} onClick={() => openEditSupplierForm(row)}><Pencil size={14} /> Edit</Button></Can>}
                        {showGenericActions && genericConfig && <Can permission={`${genericConfig.permission}.update`}><Button className="h-8 bg-brand px-3 text-xs" disabled={!rowId} onClick={() => openEditGenericForm(row)}><Pencil size={14} /> Edit</Button></Can>}
                        {showBarcodeActions && <Button className="h-8 bg-slate-700 px-3 text-xs hover:bg-slate-800" disabled={!text(row.barcode)} onClick={() => setSelectedBarcodeProduct(row)}><Barcode size={14} /> Barcode</Button>}
                        {showProductArchiveActions && (rowArchived ? (
                          <Can permission="products.restore"><Button className="h-8 bg-teal-700 px-3 text-xs" disabled={!rowId || productStatusAction.isPending} onClick={() => productStatusAction.mutate({ id: rowId, action: "restore" })}><RotateCcw size={14} /> Restore</Button></Can>
                        ) : (
                          <Can permission="products.archive"><Button className="h-8 bg-slate-700 px-3 text-xs hover:bg-slate-800" disabled={!rowId || productStatusAction.isPending} onClick={() => { if (window.confirm(`Archive ${text(row.name)}? It will no longer be available for new sales.`)) productStatusAction.mutate({ id: rowId, action: "archive" }); }}><Archive size={14} /> Archive</Button></Can>
                        ))}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && rows.length > 0 && (
          <Pagination currentPage={page} pageSize={pageSize} totalItems={totalItems} onPageChange={setPage} />
        )}
      </Card>
      {selectedBarcodeProduct && (
        <Modal title="Product barcode" onClose={() => setSelectedBarcodeProduct(null)}>
            <div className="space-y-3">
              {Array.from({ length: Math.min(100, Math.max(1, Number(labelQuantity || 1))) }).map((_, index) => (
                <BarcodeLabel
                  key={index}
                  value={text(selectedBarcodeProduct.barcode)}
                  productName={text(selectedBarcodeProduct.name)}
                  price={text(selectedBarcodeProduct.sellingPrice) ? peso(text(selectedBarcodeProduct.sellingPrice)) : undefined}
                />
              ))}
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input min="1" step="1" type="number" placeholder="Number of labels" value={labelQuantity} onChange={(event) => setLabelQuantity(event.target.value)} />
                <Button type="button" onClick={printBarcodeLabels}><Printer size={16} /> Print labels</Button>
              </div>
            </div>
        </Modal>
      )}
      {selectedAuditLog && (
        <Modal title="Audit transaction details" onClose={() => setSelectedAuditLog(null)}>
          <div className="space-y-4 text-sm">
            <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
              <div><dt className="text-xs font-semibold uppercase text-slate-500">User</dt><dd>{text(selectedAuditLog.user) || "System"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-500">Action</dt><dd>{text(selectedAuditLog.action).replace(/_/g, " ")}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-500">Module</dt><dd>{text(selectedAuditLog.module) || "-"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-500">Record ID</dt><dd className="break-all">{text(selectedAuditLog.recordId) || "-"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-500">Time</dt><dd>{selectedAuditLog.createdAt ? new Date(String(selectedAuditLog.createdAt)).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) : "-"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-500">IP address</dt><dd>{text(selectedAuditLog.ipAddress) || "-"}</dd></div>
            </dl>
            {Boolean(selectedAuditLog.userAgent) && <div><h3 className="mb-1 text-xs font-semibold uppercase text-slate-500">Device / browser</h3><p className="break-all">{text(selectedAuditLog.userAgent)}</p></div>}
            <div className="grid gap-3">
              {selectedAuditLog.oldData != null && selectedAuditLog.newData != null && <section><h3 className="mb-2 font-semibold">Changes made</h3><AuditChanges before={selectedAuditLog.oldData} after={selectedAuditLog.newData} /></section>}
              {selectedAuditLog.oldData !== undefined && selectedAuditLog.oldData !== null && <section className="rounded-md bg-slate-50 p-3 dark:bg-slate-950"><h3 className="mb-3 font-semibold">Before</h3><AuditPayload value={selectedAuditLog.oldData} /></section>}
              {selectedAuditLog.newData !== undefined && selectedAuditLog.newData !== null && <section className="rounded-md bg-slate-50 p-3 dark:bg-slate-950"><h3 className="mb-3 font-semibold">After / transaction data</h3><AuditPayload value={selectedAuditLog.newData} /></section>}
              {selectedAuditLog.oldData == null && selectedAuditLog.newData == null && <p className="text-slate-500">This action was logged without before/after transaction details.</p>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
