import { useState } from "react";
import { ActionForm } from "../components/ui/ActionForm";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { api } from "../services/api";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  return <Card className="mx-auto mt-12 max-w-lg"><h1 className="text-xl font-bold">Forgot password</h1><p className="mt-2 text-sm text-slate-500">Request a password reset, then contact your administrator for reset instructions.</p><ActionForm label="Request reset" success="If this email exists, a reset request has been created." submit={() => api.post("/auth/forgot-password", { email })}><label className="block text-sm font-medium">Email<Input required type="email" autoComplete="email" className="mt-1" value={email} onChange={(event) => setEmail(event.target.value)} /></label></ActionForm><Link className="mt-4 block text-sm text-brand underline" to="/login">Back to sign in</Link></Card>;
}

export function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  return <Card className="mx-auto mt-12 max-w-lg"><h1 className="text-xl font-bold">Reset password</h1><ActionForm label="Reset password" success="Password reset. You can sign in with your new password." submit={async () => { await api.post("/auth/reset-password", { token, password }); setPassword(""); setToken(""); }}><label className="block text-sm font-medium">Reset token<Input required minLength={20} className="mt-1" value={token} onChange={(event) => setToken(event.target.value)} /></label><label className="block text-sm font-medium">New password<Input required minLength={8} maxLength={72} autoComplete="new-password" className="mt-1" value={password} onChange={(event) => setPassword(event.target.value)} type="password" /></label></ActionForm><Link className="mt-4 block text-sm text-brand underline" to="/login">Back to sign in</Link></Card>;
}
