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
}

interface GenericResourceConfig {
  endpoint: string;
  label: string;
  permission: string;
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
  currentStock: "0",
  reorderLevel: "0",
  unit: "pcs",
  imageUrl: "",
  tracksExpiration: false
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
        { key: "creditBalance", placeholder: "Credit balance", type: "number" },
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
      allowCreate: false,
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const productList = endpoint.startsWith("/products");
  const productParams = new URLSearchParams(endpoint.split("?")[1]);
  productParams.set("page", String(page)); productParams.set("limit", String(pageSize));
  productParams.set("search", debouncedSearch); productParams.set("sortBy", sortBy);
  productParams.set("sortOrder", sortBy === "name" ? "asc" : "desc");
  if (stockStatus) productParams.set("stockStatus", stockStatus);
  const productUrl = `/products?${productParams}`;
  const { data: response, isLoading, isError, refetch } = useQuery({ queryKey: [endpoint, detailId ?? (productList ? productUrl : "")], queryFn: async () => {
    if (detailId) { const result = (await api.get<ApiResponse<Row>>(`${endpoint.split("?")[0]}/${detailId}`)).data; return { ...result, data: [result.data], meta: { total: 1 } }; }
    return (await api.get<ApiResponse<Row[]>>(productList ? productUrl : endpoint)).data;
  } });
  const data = response?.data ?? [];
  useEffect(() => { const timer = window.setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300); return () => window.clearTimeout(timer); }, [search]);
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
      currentStock: editingProductId ? undefined : Number(payload.currentStock),
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
      currentStock: editingProductId ? undefined : Number(payload.currentStock),
      reorderLevel: Number(payload.reorderLevel),
      unit: payload.unit.trim() || "pcs",
      tracksExpiration: payload.tracksExpiration,
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
  const colSpan = columns.length + (showRowActions ? 1 : 0);

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
      currentStock: text(row.currentStock) || "0",
      reorderLevel: text(row.reorderLevel) || "0",
      unit: text(row.unit) || "pcs",
      imageUrl: text(row.imageUrl),
      tracksExpiration: Boolean(row.tracksExpiration)
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
      phone: text(row.phone),
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
          {!detailId && showCreate && canOpenCreateForm && (!productList || activeProductList) && (!genericConfig || genericConfig.allowCreate !== false) && <Can permission={`${resource}.create`}><Button onClick={activeProductList ? openProductForm : supplierList ? openSupplierForm : openGenericForm}><Plus size={16} /> Add</Button></Can>}
          <Can anyPermissions={[`${resource}.export`, "reports.export"]}><Button onClick={() => void exportCsv().catch((error) => toast.error(errorMessage(error)))} disabled={isLoading} className="bg-slate-700"><Download size={16} /> CSV</Button></Can>
          <Can anyPermissions={[`${resource}.export`, "reports.export"]}><Button onClick={() => void exportPdf().catch((error) => toast.error(errorMessage(error)))} disabled={isLoading} className="bg-accent"><FileText size={16} /> PDF</Button></Can>
        </div>
      </div>
      {showProductForm && (
        <Card>
          <form className="space-y-4" onSubmit={submitProduct}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{editingProductId ? "Edit product" : "Add product"}</h2>
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
              <Input required={!editingProductId || hasPermission("products.view_cost")} disabled={Boolean(editingProductId) && !hasPermission("products.view_cost")} min="0" step="0.01" type="number" placeholder="Cost price" value={productForm.costPrice} onChange={(event) => updateProductForm("costPrice", event.target.value)} />
              <Input required min="0" step="0.01" type="number" placeholder="Selling price" value={productForm.sellingPrice} onChange={(event) => updateProductForm("sellingPrice", event.target.value)} />
              <Input disabled={Boolean(editingProductId)} title="Use Inventory adjustment to change existing stock" required min="0" step="1" type="number" placeholder="Current stock" value={productForm.currentStock} onChange={(event) => updateProductForm("currentStock", event.target.value)} />
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
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>{createProduct.isPending || updateProduct.isPending ? "Saving..." : editingProductId ? "Update product" : "Save product"}</Button>
            </div>
          </form>
        </Card>
      )}
      {showSupplierForm && (
        <Card>
          <form className="space-y-4" onSubmit={submitSupplier}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{editingSupplierId ? "Edit supplier" : "Add supplier"}</h2>
              <button type="button" className="rounded-md border border-line p-2 dark:border-slate-700" onClick={closeSupplierForm} aria-label="Close supplier form"><X size={18} /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input required placeholder="Supplier name" value={supplierForm.name} onChange={(event) => updateSupplierForm("name", event.target.value)} />
              <Input placeholder="Contact person" value={supplierForm.contactPerson} onChange={(event) => updateSupplierForm("contactPerson", event.target.value)} />
              <Input placeholder="Phone" value={supplierForm.phone} onChange={(event) => updateSupplierForm("phone", event.target.value)} />
              <Input type="email" placeholder="Email" value={supplierForm.email} onChange={(event) => updateSupplierForm("email", event.target.value)} />
              <Input placeholder="Payment terms" value={supplierForm.paymentTerms} onChange={(event) => updateSupplierForm("paymentTerms", event.target.value)} />
              <Input min="0" step="1" type="number" placeholder="Delivery lead time" value={supplierForm.deliveryLeadTime} onChange={(event) => updateSupplierForm("deliveryLeadTime", event.target.value)} />
              <select className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" value={supplierForm.status} onChange={(event) => updateSupplierForm("status", event.target.value as SupplierFormState["status"])}>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <Input className="md:col-span-2" placeholder="Address" value={supplierForm.address} onChange={(event) => updateSupplierForm("address", event.target.value)} />
              <Input className="md:col-span-3" placeholder="Notes" value={supplierForm.notes} onChange={(event) => updateSupplierForm("notes", event.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={closeSupplierForm}>Cancel</Button>
              <Button type="submit" disabled={createSupplier.isPending || updateSupplier.isPending}>{createSupplier.isPending || updateSupplier.isPending ? "Saving..." : editingSupplierId ? "Update supplier" : "Save supplier"}</Button>
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
                    ? suppliers.map((supplier) => ({ value: text(supplier.id), label: text(supplier.name) }))
                    : field.optionsSource === "products"
                      ? productOptions.map((product) => ({ value: text(product.id), label: `${text(product.name)}${text(product.sku) ? ` (${text(product.sku)})` : ""}` }))
                      : undefined;
                const options = sourcedOptions ?? field.options;
                if (options) {
                  return (
                    <select key={field.key} required={field.required} className={`${field.className ?? ""} h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950`} value={genericForm[field.key] ?? ""} onChange={(event) => updateGenericForm(field.key, event.target.value)}>
                      <option value="">{field.placeholder}</option>
                      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  );
                }
                return <Input key={field.key} required={field.required} className={field.className} type={field.type ?? "text"} placeholder={field.placeholder} value={genericForm[field.key] ?? ""} onChange={(event) => updateGenericForm(field.key, event.target.value)} />;
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={closeGenericForm}>Cancel</Button>
              <Button type="submit" disabled={createGeneric.isPending || updateGeneric.isPending}>{createGeneric.isPending || updateGeneric.isPending ? "Saving..." : editingGenericId ? `Update ${genericConfig.label.toLowerCase()}` : `Save ${genericConfig.label.toLowerCase()}`}</Button>
            </div>
          </form>
        </Card>
      )}
      {isError && <QueryState error onRetry={() => void refetch()} />}
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2"><Search size={18} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} />{productList && <><select aria-label="Sort products" className="h-10 rounded-lg border border-line px-3 text-sm" value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }}><option value="updatedAt">Recently updated</option><option value="name">Name A?Z</option><option value="currentStock">Stock: high to low</option><option value="sellingPrice">Price: high to low</option></select><select aria-label="Stock status" className="h-10 rounded-lg border border-line px-3 text-sm" value={stockStatus} onChange={(event) => { setStockStatus(event.target.value); setPage(1); }}><option value="">All stock levels</option><option value="low">Low stock</option><option value="out">Out of stock</option></select></>}{(search || stockStatus) && <Button type="button" className="bg-slate-700" onClick={() => { setSearch(""); setStockStatus(""); setPage(1); }}>Clear filters</Button>}</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b text-xs uppercase text-slate-500">{columns.map((column) => <th className="py-3 pr-4" key={column}>{column.replace(/([A-Z])/g, " $1")}</th>)}{showRowActions && <th className="py-3 pr-4">actions</th>}</tr></thead>
            <tbody>
              {isLoading && <tr><td className="py-6 text-slate-500" colSpan={colSpan}>Loading...</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td className="py-6 text-slate-500" colSpan={colSpan}>No records found.</td></tr>}
              {paginatedRows.map((row) => {
                const rowId = typeof row.id === "string" ? row.id : "";
                const rowArchived = text(row.status) === "ARCHIVED";
                return (
                  <tr className="border-b last:border-0" key={String(row.id ?? JSON.stringify(row))}>
                    {columns.map((column) => <td className="py-3 pr-4" key={column}>{!detailId && column === columns[0] && ["/products", "/suppliers", "/customers", "/sales"].includes(endpoint.split("?")[0]) ? <Link className="font-medium text-brand underline-offset-4 hover:underline dark:text-teal-300" to={`${endpoint.split("?")[0]}/${rowId}`}>{text(row[column])}</Link> : column === "status" ? <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${text(row[column]) === "ACTIVE" || text(row[column]) === "COMPLETED" ? "bg-teal-50 text-brand dark:bg-teal-950 dark:text-teal-200" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{text(row[column]).replace(/_/g, " ")}</span> : text(row[column])}</td>)}
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
                  price={text(selectedBarcodeProduct.sellingPrice) ? `PHP ${Number(text(selectedBarcodeProduct.sellingPrice)).toFixed(2)}` : undefined}
                />
              ))}
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input min="1" step="1" type="number" placeholder="Number of labels" value={labelQuantity} onChange={(event) => setLabelQuantity(event.target.value)} />
                <Button type="button" onClick={printBarcodeLabels}><Printer size={16} /> Print labels</Button>
              </div>
            </div>
        </Modal>
      )}
    </div>
  );
}
