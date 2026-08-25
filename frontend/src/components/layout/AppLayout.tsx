import { Archive, Bell, Boxes, ChartNoAxesCombined, ClipboardList, LogOut, Menu, Moon, Package, Receipt, Settings, ShieldCheck, ShoppingCart, Sun, Users, X } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getData } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: ChartNoAxesCombined, anyPermissions: ["dashboard.view"] },
  { to: "/pos", label: "POS", icon: ShoppingCart, anyPermissions: ["pos.access"] },
  { to: "/products", label: "Products", icon: Package, anyPermissions: ["products.view"] },
  { to: "/products/archive", label: "Archive", icon: Archive, anyPermissions: ["products.view"] },
  { to: "/inventory", label: "Inventory", icon: Boxes, anyPermissions: ["inventory.view"] },
  { to: "/sales", label: "Sales", icon: Receipt, anyPermissions: ["sales.view_all", "sales.view_own"] },
  { to: "/suppliers", label: "Suppliers", icon: ClipboardList, anyPermissions: ["suppliers.view"] },
  { to: "/supplier-products", label: "Supplier Products", icon: Package, anyPermissions: ["suppliers.view"] },
  { to: "/customers", label: "Customers", icon: Users, anyPermissions: ["customers.view"] },
  { to: "/reports", label: "Reports", icon: ChartNoAxesCombined, anyPermissions: ["reports.daily", "reports.monthly", "reports.yearly", "reports.products", "reports.categories", "reports.payments", "reports.employees", "reports.profit", "reports.inventory_value", "reports.supplier_performance", "reports.forecast"] },
  { to: "/users", label: "Users", icon: Users, anyPermissions: ["users.view"] },
  { to: "/roles", label: "Roles", icon: ShieldCheck, anyPermissions: ["roles.view"] },
  { to: "/audit-logs", label: "Audit Logs", icon: ClipboardList, anyPermissions: ["audit_logs.view"] },
  { to: "/settings", label: "Settings", icon: Settings, anyPermissions: ["settings.view"] }
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasAnyPermission } = useAuth();
  const { data: notifications = [] } = useQuery({ queryKey: ["notifications"], queryFn: () => getData<Array<{ isRead: boolean }>>("/notifications"), enabled: Boolean(user) });
  const unread = notifications.filter((item) => !item.isRead).length;
  const crumbs = useMemo(() => location.pathname.split("/").filter(Boolean), [location.pathname]);

  function toggleTheme() {
    setDark((value) => {
      document.documentElement.classList.toggle("dark", !value);
      return !value;
    });
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-ink dark:bg-slate-950 dark:text-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-line bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex h-16 items-center justify-between border-b border-line px-5 dark:border-slate-800">
          <Link to="/dashboard" className="text-lg font-bold">SmartStock</Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <nav className="space-y-1 p-3">
          {nav.filter((item) => hasAnyPermission(item.anyPermissions)).map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-teal-50 text-brand dark:bg-teal-950" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button>
            <div>
              <div className="text-xs text-slate-500">Asia/Manila</div>
              <div className="text-sm font-semibold capitalize">{crumbs.join(" / ") || "dashboard"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="rounded-md border border-line p-2 dark:border-slate-700" aria-label="Toggle theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={() => navigate("/notifications")} className="relative rounded-md border border-line p-2 dark:border-slate-700" aria-label="Notifications">
              <Bell size={18} />
              {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 text-xs text-white">{unread}</span>}
            </button>
            <button onClick={() => void logout()} className="rounded-md border border-line p-2 dark:border-slate-700" aria-label="Logout"><LogOut size={18} /></button>
            <Link to="/profile" className="hidden text-right text-sm sm:block">
              <div className="font-semibold">{user?.fullName}</div>
              <div className="text-xs text-slate-500">{user?.role.name}</div>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
