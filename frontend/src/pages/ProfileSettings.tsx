import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { ActionForm } from "../components/ui/ActionForm";
import { api } from "../services/api";

export function Profile() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  return (
    <Card className="max-w-xl">
      <h1 className="text-xl font-bold">{user?.fullName}</h1>
      <p className="text-sm text-slate-500">{user?.email} . {user?.role.name}</p>
      <ActionForm label="Change password" success="Password changed. Other sessions will need to sign in again." submit={async () => { await api.post("/auth/change-password", { currentPassword, newPassword }); setCurrentPassword(""); setNewPassword(""); }}>
        <label className="block text-sm font-medium">Current password<Input required className="mt-1" autoComplete="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
        <label className="block text-sm font-medium">New password<Input required minLength={8} maxLength={72} className="mt-1" autoComplete="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
        <p className="text-xs text-slate-500">Use at least 8 characters.</p>
      </ActionForm>
    </Card>
  );
}

export function SettingsPage() {
  return <Card><h1 className="text-xl font-bold">Settings</h1><p className="mt-2 text-sm text-slate-500">Business currency is Philippine peso (PHP), timezone Asia/Manila, date format MMMM d, yyyy, and time format h:mm a.</p></Card>;
}
