import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { api, getData } from "../services/api";

interface NotificationRow { id: string; title: string; message: string; priority: string; isRead: boolean; createdAt: string }

export function Notifications() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["notifications"], queryFn: () => getData<NotificationRow[]>("/notifications") });
  const read = useMutation({ mutationFn: (id: string) => api.post(`/notifications/${id}/read`), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
  return <div className="space-y-4"><div className="flex justify-between"><h1 className="text-2xl font-bold">Notifications</h1><Button onClick={async () => { await api.post("/notifications/mark-all-read"); await qc.invalidateQueries({ queryKey: ["notifications"] }); }}>Mark all read</Button></div>{data.map((item) => <Card key={item.id} className={item.isRead ? "opacity-70" : ""}><div className="flex justify-between gap-4"><div><div className="text-xs font-semibold uppercase text-accent">{item.priority}</div><h2 className="font-bold">{item.title}</h2><p className="text-sm text-slate-600 dark:text-slate-300">{item.message}</p></div><Button onClick={() => read.mutate(item.id)} disabled={item.isRead}>Read</Button></div></Card>)}</div>;
}
