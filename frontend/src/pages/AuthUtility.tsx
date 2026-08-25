import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { api } from "../services/api";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  return <Card className="mx-auto mt-12 max-w-lg"><h1 className="text-xl font-bold">Forgot password</h1><Input className="mt-4" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="employee@example.com" /><Button className="mt-4" onClick={async () => { await api.post("/auth/forgot-password", { email }); toast.success("Reset request created"); }}>Create reset token</Button></Card>;
}

export function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  return <Card className="mx-auto mt-12 max-w-lg"><h1 className="text-xl font-bold">Reset password</h1><Input className="mt-4" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Reset token" /><Input className="mt-3" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" type="password" /><Button className="mt-4" onClick={async () => { await api.post("/auth/reset-password", { token, password }); toast.success("Password reset"); }}>Reset password</Button></Card>;
}
