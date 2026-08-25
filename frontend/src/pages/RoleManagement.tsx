import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Can } from "../components/rbac/Can";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { api, getData } from "../services/api";

interface Permission {
  id: string;
  key: string;
  name: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  rolePermissions: Array<{ permission: Permission }>;
  _count?: { users: number };
}

export function RoleManagement() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const { data: roles = [] } = useQuery({ queryKey: ["roles"], queryFn: () => getData<Role[]>("/roles") });
  const { data: grouped = {} } = useQuery({ queryKey: ["permissions", "grouped"], queryFn: () => getData<Record<string, Permission[]>>("/permissions/grouped") });
  const selected = useMemo(() => roles.find((role) => role.id === selectedId) ?? roles[0], [roles, selectedId]);

  function loadRole(role: Role) {
    setSelectedId(role.id);
    setName(role.name);
    setDescription(role.description ?? "");
    setSelectedKeys(new Set(role.rolePermissions.map((row) => row.permission.key)));
  }

  const saveRole = useMutation({
    mutationFn: async () => {
      if (selected) {
        await api.patch(`/roles/${selected.id}`, { name, description });
        await api.put(`/roles/${selected.id}/permissions`, { permissionKeys: [...selectedKeys] });
        return;
      }
      const created = await api.post<{ data: Role }>("/roles", { name, description });
      await api.put(`/roles/${created.data.data.id}/permissions`, { permissionKeys: [...selectedKeys] });
    },
    onSuccess: async () => {
      toast.success("Role saved");
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
    }
  });

  const deleteRole = useMutation({
    mutationFn: async (roleId: string) => api.delete(`/roles/${roleId}`),
    onSuccess: async () => {
      toast.success("Role deleted");
      setSelectedId(null);
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
    }
  });

  useEffect(() => {
    if (selected && selected.id !== selectedId) loadRole(selected);
  }, [selected, selectedId]);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Roles</h1>
          <Can permission="roles.create"><Button onClick={() => { setSelectedId(null); setName(""); setDescription(""); setSelectedKeys(new Set()); }}>New</Button></Can>
        </div>
        {roles.map((role) => (
          <button key={role.id} onClick={() => loadRole(role)} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${selected?.id === role.id ? "bg-teal-50 text-brand dark:bg-teal-950" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
            <span>{role.name}</span>
            <span className="text-xs text-slate-500">{role._count?.users ?? 0}</span>
          </button>
        ))}
      </Card>
      <Card className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold"><ShieldCheck size={20} /> Role Management</h2>
            <p className="text-sm text-slate-500">{selected?.isSystem ? "System role" : "Custom role"}</p>
          </div>
          <div className="flex gap-2">
            <Can permission="roles.delete">{selected && !selected.isSystem && <Button className="bg-red-600 hover:bg-red-700" onClick={() => deleteRole.mutate(selected.id)}><Trash2 size={16} /> Delete</Button>}</Can>
            <Can anyPermissions={["roles.update", "roles.assign_permissions"]}><Button onClick={() => saveRole.mutate()} disabled={saveRole.isPending}><Save size={16} /> Save</Button></Can>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Role name" />
          <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" />
        </div>
        <div className="space-y-4">
          {Object.entries(grouped).map(([module, permissions]) => {
            const everySelected = permissions.every((permission) => selectedKeys.has(permission.key));
            return (
              <section key={module} className="border-t border-line pt-4 dark:border-slate-700">
                <label className="mb-3 flex items-center gap-2 text-sm font-bold capitalize">
                  <input type="checkbox" checked={everySelected} onChange={(event) => {
                    const next = new Set(selectedKeys);
                    permissions.forEach((permission) => event.target.checked ? next.add(permission.key) : next.delete(permission.key));
                    setSelectedKeys(next);
                  }} />
                  {module}
                </label>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {permissions.map((permission) => (
                    <label key={permission.key} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm dark:border-slate-700">
                  <input type="checkbox" checked={selectedKeys.has(permission.key)} onChange={(event) => {
                    const next = new Set(selectedKeys);
                    if (event.target.checked) next.add(permission.key);
                    else next.delete(permission.key);
                    setSelectedKeys(next);
                  }} />
                      {permission.key}
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
