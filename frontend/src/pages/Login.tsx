import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Play } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { AxiosError } from "axios";
import type { ApiResponse } from "../types/api";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
type FormData = z.infer<typeof schema>;

export function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const demoEmail = import.meta.env.VITE_DEMO_EMAIL;
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;
  const showDemoSignIn = import.meta.env.DEV && Boolean(demoEmail && demoPassword);
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  if (user) return <Navigate to="/" replace />;

  async function signIn(data: FormData) {
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (error) {
      const message = error instanceof AxiosError
        ? (error.response?.data as ApiResponse<unknown> | undefined)?.message ?? "Sign in failed"
        : "Sign in failed";
      setError("root", { message });
    }
  }

  async function signInAsDemo() {
    if (!demoEmail || !demoPassword) return;
    setDemoSubmitting(true);
    clearErrors();
    try {
      await login(demoEmail, demoPassword);
      navigate("/");
    } catch (error) {
      const message = error instanceof AxiosError
        ? (error.response?.data as ApiResponse<unknown> | undefined)?.message ?? "Demo sign in failed"
        : "Demo sign in failed";
      setError("root", { message });
    } finally {
      setDemoSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#f4f7fb] p-4">
      <form className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft" onSubmit={handleSubmit(signIn)}>
        <h1 className="text-2xl font-bold">SmartStock</h1>
        <p className="mt-1 text-sm text-slate-600">Inventory, barcode POS, and business analytics.</p>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium">Email<Input {...register("email")} autoComplete="username" type="email" className="mt-1" /></label>
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          <label className="block text-sm font-medium">Password<Input {...register("password")} autoComplete="current-password" type="password" className="mt-1" /></label>
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          {errors.root && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</p>}
          <Button busy={isSubmitting} disabled={demoSubmitting} className="w-full"><LogIn size={18} /> Sign in</Button>
          {showDemoSignIn && (
            <Button type="button" busy={demoSubmitting} disabled={isSubmitting} onClick={signInAsDemo} className="w-full bg-orange-500 hover:bg-orange-600">
              <Play size={18} /> Demo sign in
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
