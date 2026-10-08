export type RoleName = "ADMIN" | "MANAGER" | "CASHIER" | "INVENTORY_STAFF";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: { id: string; name: string };
  roleName?: string;
  permissions: string[];
  status?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, unknown>;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  description?: string | null;
  costPrice: string;
  sellingPrice: string;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  imageUrl?: string | null;
  status: string;
  category?: { id: string; name: string };
  primarySupplier?: { id: string; name: string } | null;
}

export interface ExternalProductDraft {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  image?: string;
  manufacturer?: string;
  size?: string;
  source: "upcitemdb" | "openfoodfacts";
  importedFields: string[];
}

export type BarcodeLookupResult =
  | { success: true; source: "local"; exists_locally: true; product: Product }
  | { success: true; source: "upcitemdb" | "openfoodfacts"; exists_locally: false; product: ExternalProductDraft }
  | { success: false; source: "none"; exists_locally: false; barcode: string; message: string };

export interface SaleItem {
  id: string;
  product: Product;
  quantity: number;
  sellingPrice: string;
  historicalCost: string;
  lineTotal: string;
}

export interface Sale {
  id: string;
  receiptNo: string;
  total: string;
  amountPaid: string;
  change: string;
  paymentMethod: string;
  status: string;
  loyaltyPointsEarned: number;
  createdAt: string;
  cashier?: User;
  customer?: { fullName: string } | null;
  items: SaleItem[];
}
