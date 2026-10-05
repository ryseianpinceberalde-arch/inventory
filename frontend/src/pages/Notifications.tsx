import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { QueryState } from "../components/ui/QueryState";
import { useAuth } from "../contexts/AuthContext";
import { api, errorMessage, getData } from "../services/api";

interface NotificationRow { id: string; title: string; message: string; priority: string; isRead: boolean; createdAt: string }

export function Notifications() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const { data = [], isLoading, isError, refetch } = useQuery({ queryKey: ["notifications"], queryFn: () => getData<NotificationRow[]>("/notifications") });
  const read = useMutation({ mutationFn: (id?: string) => api.post(id ? `/notifications/${id}/read` : "/notifications/mark-all-read"), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["notifications"] }); }, onError: (error) => toast.error(errorMessage(error)) });
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Notifications</h1><p className="text-sm text-slate-500">{data.filter((item) => !item.isRead).length} unread alerts</p></div>{hasPermission("notifications.manage") && <Button busy={read.isPending} disabled={!data.some((row) => !row.isRead)} onClick={() => read.mutate(undefined)}>Mark all read</Button>}</div>
    {(isLoading || isError || data.length === 0) && <QueryState loading={isLoading} error={isError} empty="You're all caught up. No notifications to show." onRetry={() => void refetch()} />}
    {data.map((item) => <Card key={item.id} className={item.isRead ? "" : "border-l-4 border-l-brand"}><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="text-xs font-semibold uppercase text-accent">{item.priority} ? {item.isRead ? "Read" : "Unread"}</div><h2 className="mt-1 font-bold">{item.title}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.message}</p><time className="mt-2 block text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</time></div><Button onClick={() => read.mutate(item.id)} disabled={item.isRead || read.isPending}>{item.isRead ? "Read" : "Mark read"}</Button></div></Card>)}
  </div>;
}
