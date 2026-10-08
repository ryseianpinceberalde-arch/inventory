import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, Check, CheckCheck, Package, Search } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { QueryState } from "../components/ui/QueryState";
import { useAuth } from "../contexts/AuthContext";
import { api, errorMessage, getData } from "../services/api";

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  alertType: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
  relatedProductId?: string | null;
  product?: { id: string; name: string; sku: string } | null;
}

type NotificationFilter = "all" | "unread" | "read";

const priorityStyles: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  NORMAL: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
};

function titleCase(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function Notifications() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [search, setSearch] = useState("");
  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getData<NotificationRow[]>("/notifications")
  });
  const invalidateNotifications = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: invalidateNotifications,
    onError: (error) => toast.error(errorMessage(error))
  });
  const markAllRead = useMutation({
    mutationFn: () => api.post("/notifications/mark-all-read"),
    onSuccess: invalidateNotifications,
    onError: (error) => toast.error(errorMessage(error))
  });

  const unreadCount = data.filter((item) => !item.isRead).length;
  const readCount = data.length - unreadCount;
  const criticalCount = data.filter((item) => !item.isRead && item.priority === "CRITICAL").length;
  const visibleNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.filter((item) => {
      if (filter === "unread" && item.isRead) return false;
      if (filter === "read" && !item.isRead) return false;
      if (!query) return true;
      return [item.title, item.message, item.alertType, item.priority, item.product?.name, item.product?.sku]
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [data, filter, search]);

  const filters: Array<{ key: NotificationFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: data.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "read", label: "Read", count: readCount }
  ];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand dark:text-teal-300">Activity center</p>
        <h1 className="mt-1 text-2xl font-bold">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">Review inventory alerts and keep track of what needs attention.</p>
      </div>
      {hasPermission("notifications.manage") && <Button type="button" className="bg-slate-700 hover:bg-slate-800" busy={markAllRead.isPending} disabled={unreadCount === 0} onClick={() => markAllRead.mutate()}><CheckCheck size={16} /> Mark all read</Button>}
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="flex items-center gap-3 !p-4"><span className="rounded-lg bg-teal-50 p-2 text-brand dark:bg-teal-950 dark:text-teal-200"><Bell size={20} /></span><div><p className="text-xs font-medium uppercase text-slate-500">Unread</p><p className="text-xl font-bold">{unreadCount}</p></div></Card>
      <Card className="flex items-center gap-3 !p-4"><span className="rounded-lg bg-red-50 p-2 text-red-700 dark:bg-red-950 dark:text-red-200"><AlertTriangle size={20} /></span><div><p className="text-xs font-medium uppercase text-slate-500">Critical unread</p><p className="text-xl font-bold">{criticalCount}</p></div></Card>
      <Card className="flex items-center gap-3 !p-4"><span className="rounded-lg bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Check size={20} /></span><div><p className="text-xs font-medium uppercase text-slate-500">Already read</p><p className="text-xl font-bold">{readCount}</p></div></Card>
    </div>

    {isLoading || isError ? <QueryState loading={isLoading} error={isError} message={isError ? errorMessage(error) : undefined} onRetry={() => void refetch()} /> : <>
      <Card className="space-y-4 !p-4">
        <div role="group" aria-label="Filter notifications" className="flex flex-wrap gap-2">
          {filters.map((item) => <button key={item.key} type="button" aria-pressed={filter === item.key} onClick={() => setFilter(item.key)} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${filter === item.key ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>
            {item.label}<span className={`rounded-full px-2 py-0.5 text-xs ${filter === item.key ? "bg-white/20 text-white" : "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}>{item.count}</span>
          </button>)}
        </div>
        <label className="relative block">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input aria-label="Search notifications" className="pl-9" placeholder="Search alerts, products, or priority" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
      </Card>

      {visibleNotifications.length === 0 ? <Card className="py-10 text-center">
        <Bell size={28} className="mx-auto text-slate-400" />
        <h2 className="mt-3 font-semibold">{data.length === 0 ? "You're all caught up" : search ? "No matching notifications" : filter === "all" ? "No notifications" : `No ${filter} notifications`}</h2>
        <p className="mt-1 text-sm text-slate-500">{data.length === 0 ? "New inventory alerts will appear here." : "Try another filter or search term."}</p>
      </Card> : <div className="space-y-3">
        {visibleNotifications.map((item) => {
          const priority = item.priority.toUpperCase();
          return <Card key={item.id} className={`!p-0 ${item.isRead ? "" : "border-l-4 border-l-brand"}`}>
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
              <span className={`shrink-0 rounded-lg p-2.5 ${item.isRead ? "bg-slate-100 text-slate-500 dark:bg-slate-800" : priority === "CRITICAL" ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200" : "bg-teal-50 text-brand dark:bg-teal-950 dark:text-teal-200"}`}>
                {priority === "CRITICAL" ? <AlertTriangle size={20} /> : <Package size={20} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${priorityStyles[priority] ?? priorityStyles.NORMAL}`}>{titleCase(priority)}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">{titleCase(item.alertType)}</span>
                  <span className={`text-xs font-medium ${item.isRead ? "text-slate-500" : "text-brand dark:text-teal-300"}`}>{item.isRead ? "Read" : "Unread"}</span>
                </div>
                <h2 className="mt-2 font-bold">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                  <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</time>
                  {item.product && hasPermission("products.view") && <Link className="font-semibold text-brand underline-offset-4 hover:underline dark:text-teal-300" to={`/products/${item.product.id}`}>View {item.product.name}</Link>}
                </div>
              </div>
              {!item.isRead && <Button type="button" className="self-start bg-slate-700 hover:bg-slate-800 sm:shrink-0" busy={markRead.isPending && markRead.variables === item.id} disabled={markRead.isPending || markAllRead.isPending} aria-label={`Mark ${item.title} as read`} onClick={() => markRead.mutate(item.id)}><Check size={16} /> Mark read</Button>}
            </div>
          </Card>;
        })}
      </div>}
    </>}
  </div>;
}
