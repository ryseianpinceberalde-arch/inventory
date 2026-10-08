import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ForgotPassword, ResetPassword } from "./pages/AuthUtility";
import { Dashboard } from "./pages/Dashboard";
import { StockActions, InventoryAdjustment } from "./pages/InventoryActions";
import { Login } from "./pages/Login";
import { Notifications } from "./pages/Notifications";
import { POS } from "./pages/POS";
import { Profile, SettingsPage } from "./pages/ProfileSettings";
import { ReportDetail, ReportsIndex, ReportsLayout } from "./pages/Reports";
import { ResourcePage } from "./pages/ResourcePage";
import { RoleManagement } from "./pages/RoleManagement";
import { Unauthorized } from "./pages/Unauthorized";
import { PermissionRoute, ProtectedRoute } from "./routes/ProtectedRoute";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false } } });

function HomeRedirect() {
  const { hasPermission } = useAuth();
  return <Navigate to={hasPermission("inventory.view") ? "/inventory" : hasPermission("pos.access") ? "/pos" : hasPermission("dashboard.view") ? "/dashboard" : "/profile"} replace />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/unauthorized" element={<Shell><Unauthorized /></Shell>} />
              <Route path="/dashboard" element={<PermissionRoute permission="dashboard.view"><Shell><Dashboard /></Shell></PermissionRoute>} />
              <Route path="/pos" element={<PermissionRoute permission="pos.access"><Shell><POS /></Shell></PermissionRoute>} />
              <Route path="/products" element={<PermissionRoute permission="products.view"><Shell><ResourcePage title="Products" endpoint="/products?limit=100" columns={["name", "sku", "barcode", "category", "currentStock", "sellingPrice", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/products/archive" element={<PermissionRoute permission="products.view"><Shell><ResourcePage title="Product archive" endpoint="/products?limit=100&status=ARCHIVED" columns={["name", "sku", "barcode", "category", "currentStock", "sellingPrice", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/products/new" element={<PermissionRoute permission="products.create"><Shell><ResourcePage title="New product" endpoint="/products?limit=100" columns={["name", "sku", "barcode", "currentStock"]} /></Shell></PermissionRoute>} />
              <Route path="/products/:id" element={<PermissionRoute permission="products.view"><Shell><ResourcePage title="Product profile" endpoint="/products?limit=100" columns={["name", "sku", "barcode", "currentStock"]} /></Shell></PermissionRoute>} />
              <Route path="/categories" element={<PermissionRoute permission="categories.view"><Shell><ResourcePage title="Categories" endpoint="/categories" columns={["name", "description", "status", "inventoryValue", "totalSales", "totalProfit"]} /></Shell></PermissionRoute>} />
              <Route path="/barcodes" element={<PermissionRoute permission="barcodes.view"><Shell><ResourcePage title="Barcodes" endpoint="/products?limit=100" columns={["name", "barcode", "sku", "currentStock"]} /></Shell></PermissionRoute>} />
              <Route path="/inventory" element={<PermissionRoute permission="inventory.view"><Shell><ResourcePage title="Inventory" endpoint="/products?limit=100" columns={["name", "sku", "currentStock", "reorderLevel", "unit"]} /></Shell></PermissionRoute>} />
              <Route path="/inventory/stock" element={<PermissionRoute anyPermissions={["inventory.stock_in", "inventory.stock_out"]}><Shell><StockActions /></Shell></PermissionRoute>} />
              <Route path="/inventory/stock-in" element={<PermissionRoute permission="inventory.stock_in"><Shell><StockActions initialTab="in" /></Shell></PermissionRoute>} />
              <Route path="/inventory/stock-out" element={<PermissionRoute permission="inventory.stock_out"><Shell><StockActions initialTab="out" /></Shell></PermissionRoute>} />
              <Route path="/inventory/adjustments" element={<PermissionRoute anyPermissions={["inventory.adjustment_create", "inventory.adjustment_approve"]}><Shell><InventoryAdjustment /></Shell></PermissionRoute>} />
              <Route path="/inventory/movements" element={<PermissionRoute permission="inventory.movement_view"><Shell><ResourcePage title="Stock movements" endpoint="/stock-movements" columns={["referenceNo", "movementType", "product", "quantityChanged", "newQuantity", "createdAt"]} /></Shell></PermissionRoute>} />
              <Route path="/inventory/low-stock" element={<PermissionRoute permission="inventory.view"><Shell><ResourcePage title="Low stock" endpoint="/inventory/low-stock" columns={["name", "sku", "currentStock", "reorderLevel"]} /></Shell></PermissionRoute>} />
              <Route path="/suppliers" element={<PermissionRoute permission="suppliers.view"><Shell><ResourcePage title="Suppliers" endpoint="/suppliers" columns={["name", "contactPerson", "phone", "email", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/supplier-products" element={<PermissionRoute permission="suppliers.view"><Shell><ResourcePage title="Supplier Products" endpoint="/supplier-products" columns={["supplier", "product", "sku", "barcode", "category", "currentStock", "sellingPrice", "status"]} showCreate={false} /></Shell></PermissionRoute>} />
              <Route path="/suppliers/:id" element={<PermissionRoute permission="suppliers.view"><Shell><ResourcePage title="Supplier profile" endpoint="/suppliers" columns={["name", "contactPerson", "phone", "email"]} /></Shell></PermissionRoute>} />
              <Route path="/supplier-deliveries" element={<PermissionRoute permission="inventory.movement_view"><Shell><ResourcePage title="Supplier deliveries" endpoint="/stock-movements" columns={["referenceNo", "product", "quantityChanged", "createdAt"]} /></Shell></PermissionRoute>} />
              <Route path="/supplier-performance" element={<PermissionRoute permission="reports.supplier_performance"><Shell><ResourcePage title="Supplier performance" endpoint="/supplier-performance" columns={["supplier", "completedDeliveries", "onTimeRate", "performanceScore"]} /></Shell></PermissionRoute>} />
              <Route path="/customers" element={<PermissionRoute permission="customers.view"><Shell><ResourcePage title="Customers" endpoint="/customers" columns={["fullName", "phone", "email", "customerType", "loyaltyPoints"]} /></Shell></PermissionRoute>} />
              <Route path="/customers/:id" element={<PermissionRoute permission="customers.view"><Shell><ResourcePage title="Customer profile" endpoint="/customers" columns={["fullName", "phone", "email", "customerType"]} /></Shell></PermissionRoute>} />
              <Route path="/employees" element={<PermissionRoute permission="users.view"><Shell><ResourcePage title="Employees" endpoint="/users" columns={["fullName", "email", "role", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/users" element={<PermissionRoute permission="users.view"><Shell><ResourcePage title="Users" endpoint="/users" columns={["fullName", "email", "role", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/roles" element={<PermissionRoute permission="roles.view"><Shell><RoleManagement /></Shell></PermissionRoute>} />
              <Route path="/sales" element={<PermissionRoute anyPermissions={["sales.view_all", "sales.view_own"]}><Shell><ResourcePage title="Sales" endpoint="/sales" columns={["receiptNo", "customer", "cashier", "total", "paymentMethod", "status", "createdAt"]} /></Shell></PermissionRoute>} />
              <Route path="/sales/:id" element={<PermissionRoute anyPermissions={["sales.view_all", "sales.view_own"]}><Shell><ResourcePage title="Sale detail" endpoint="/sales" columns={["receiptNo", "total", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/refunds" element={<PermissionRoute permission="refunds.view"><Shell><ResourcePage title="Refunds" endpoint="/sales" columns={["receiptNo", "total", "status"]} /></Shell></PermissionRoute>} />
              <Route path="/reports" element={<PermissionRoute anyPermissions={["reports.daily", "reports.monthly", "reports.yearly", "reports.products", "reports.categories", "reports.payments", "reports.employees", "reports.profit", "reports.inventory_value", "reports.supplier_performance", "reports.forecast"]}><Shell><ReportsLayout /></Shell></PermissionRoute>}>
                <Route index element={<ReportsIndex />} />
                <Route path=":type" element={<ReportDetail />} />
              </Route>
              <Route path="/notifications" element={<PermissionRoute permission="notifications.view"><Shell><Notifications /></Shell></PermissionRoute>} />
              <Route path="/audit-logs" element={<PermissionRoute permission="audit_logs.view"><Shell><ResourcePage title="Audit logs" endpoint="/audit-logs" columns={["action", "module", "recordId", "user", "createdAt"]} /></Shell></PermissionRoute>} />
              <Route path="/profile" element={<Shell><Profile /></Shell>} />
              <Route path="/settings" element={<PermissionRoute permission="settings.view"><Shell><SettingsPage /></Shell></PermissionRoute>} />
            </Route>
            <Route path="*" element={<div className="p-8"><h1 className="text-2xl font-bold">Page not found</h1><a className="text-brand underline" href="/">Return to SmartStock</a></div>} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
