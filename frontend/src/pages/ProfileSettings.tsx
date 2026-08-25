import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { api } from "../services/api";

export function Profile() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  return (
    <Card className="max-w-xl">
      <h1 className="text-xl font-bold">{user?.fullName}</h1>
      <p className="text-sm text-slate-500">{user?.email} . {user?.role.name}</p>
      <div className="mt-6 space-y-3">
        <Input type="password" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        <Input type="password" placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        <Button onClick={async () => { await api.post("/auth/change-password", { currentPassword, newPassword }); toast.success("Password changed"); }}>Change password</Button>
      </div>
    </Card>
  );
}

export function SettingsPage() {
  return <Card><h1 className="text-xl font-bold">Settings</h1><p className="mt-2 text-sm text-slate-500">Business currency is Philippine peso (PHP), timezone Asia/Manila, date format MMMM d, yyyy, and time format h:mm a.</p></Card>;
}
