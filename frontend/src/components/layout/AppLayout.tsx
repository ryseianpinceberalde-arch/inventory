import { Archive, Bell, Boxes, ChartNoAxesCombined, ClipboardList, LogOut, Menu, Moon, Package, Receipt, Settings, ShieldCheck, ShoppingCart, Sun, Users, X } from "lucide-react";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { errorMessage, getData } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: ChartNoAxesCombined, anyPermissions: ["dashboard.view"] },
  { to: "/pos", label: "POS", icon: ShoppingCart, anyPermissions: ["pos.access"] },
  { to: "/products", label: "Products", icon: Package, anyPermissions: ["products.view"] },
  { to: "/products/archive", label: "Archive", icon: Archive, anyPermissions: ["products.view"] },
  { to: "/categories", label: "Categories", icon: Package, anyPermissions: ["categories.view"] },
  { to: "/inventory/stock-in", label: "Stock-in", icon: Boxes, anyPermissions: ["inventory.stock_in"] },
  { to: "/inventory/stock-out", label: "Stock-out", icon: Boxes, anyPermissions: ["inventory.stock_out"] },
  { to: "/inventory/adjustments", label: "Adjustments", icon: ClipboardList, anyPermissions: ["inventory.adjustment_create", "inventory.adjustment_approve"] },
  { to: "/inventory/movements", label: "Stock history", icon: ClipboardList, anyPermissions: ["inventory.movement_view"] },
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
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [loggingOut, setLoggingOut] = useState(false);
  const drawer = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasAnyPermission } = useAuth();
  const { data: notifications = [] } = useQuery({ queryKey: ["notifications"], queryFn: () => getData<Array<{ isRead: boolean }>>("/notifications"), enabled: hasAnyPermission(["notifications.view"]) });
  const unread = notifications.filter((item) => !item.isRead).length;
  const crumbs = useMemo(() => location.pathname.split("/").filter(Boolean), [location.pathname]);

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector<HTMLElement>("a,button")?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const nodes = Array.from(drawer.current?.querySelectorAll<HTMLElement>("a,button") ?? []).filter((node) => node.getClientRects().length);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    window.addEventListener("keydown", keydown);
    return () => { window.removeEventListener("keydown", keydown); document.body.style.overflow = overflow; previous?.focus(); };
  }, [open]);
  async function signOut() {
    setLoggingOut(true);
    try { await logout(); } catch (error) { toast.error(errorMessage(error)); } finally { setLoggingOut(false); }
  }
  function toggleTheme() {
    setDark((value) => {
      document.documentElement.classList.toggle("dark", !value);
      return !value;
    });
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-ink dark:bg-slate-950 dark:text-slate-100">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3 focus:text-brand">Skip to content</a>
      {open && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setOpen(false)} />}
      <aside ref={drawer} id="navigation" aria-label="Main navigation" className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r border-line bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 ${open ? "visible translate-x-0" : "invisible -translate-x-full"} lg:visible lg:translate-x-0`}>
        <div className="flex h-16 items-center justify-between border-b border-line px-5 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-3 text-lg font-bold"><Boxes className="text-brand" size={24} /> SmartStock</Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <nav className="space-y-1 p-3">
          {[
            { label: "Overview & sales", paths: ["/dashboard", "/pos", "/sales"] },
            { label: "Stock & catalog", paths: ["/products", "/products/archive", "/categories", "/inventory", "/inventory/stock-in", "/inventory/stock-out", "/inventory/adjustments", "/inventory/movements"] },
            { label: "Business", paths: ["/suppliers", "/supplier-products", "/customers", "/reports"] },
            { label: "Administration", paths: ["/users", "/roles", "/audit-logs", "/settings"] }
          ].map((group) => {
            const items = group.paths.flatMap((path) => nav.filter((item) => item.to === path && hasAnyPermission(item.anyPermissions)));
            return items.length > 0 && <div key={group.label} className="pb-3"><p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{group.label}</p>{items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/products" || item.to === "/inventory"} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-teal-50 text-brand dark:bg-teal-950" : "text-slate-600 hover:bg-teal-50 hover:text-brand dark:text-slate-300 dark:hover:bg-teal-950 dark:hover:text-teal-100"}`}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
))}</div>;
          })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open} aria-controls="navigation"><Menu /></button>
            <div>
              <div className="text-xs text-slate-500">Asia/Manila</div>
              <div className="max-w-[35vw] truncate text-sm font-semibold capitalize">{crumbs.join(" / ") || "dashboard"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="rounded-md border border-line p-2 dark:border-slate-700" aria-label="Toggle theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            {hasAnyPermission(["notifications.view"]) && <button onClick={() => navigate("/notifications")} className="relative rounded-md border border-line p-2 dark:border-slate-700" aria-label="Notifications">
              <Bell size={18} />
              {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 text-xs text-white">{unread}</span>}
            </button>}
            <button disabled={loggingOut} onClick={() => void signOut()} className="rounded-md border border-line p-2 dark:border-slate-700" aria-label="Logout"><LogOut size={18} /></button>
            <Link to="/profile" className="hidden text-right text-sm sm:block">
              <div className="font-semibold">{user?.fullName}</div>
              <div className="text-xs text-slate-500">{user?.role.name}</div>
            </Link>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="mx-auto min-w-0 max-w-[1440px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
