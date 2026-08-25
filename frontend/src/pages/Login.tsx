import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
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
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: "admin@smartstock.local", password: "Admin123!" } });
  if (user) return <Navigate to="/dashboard" replace />;
  return (
    <div className="grid min-h-screen place-items-center bg-[#f4f7fb] p-4">
      <form className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft" onSubmit={handleSubmit(async (data) => {
        try {
          await login(data.email, data.password);
          navigate("/dashboard");
        } catch (error) {
          const message = error instanceof AxiosError
            ? (error.response?.data as ApiResponse<unknown> | undefined)?.message ?? "Sign in failed"
            : "Sign in failed";
          setError("root", { message });
        }
      })}>
        <h1 className="text-2xl font-bold">SmartStock</h1>
        <p className="mt-1 text-sm text-slate-600">Inventory, barcode POS, and business analytics.</p>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium">Email<Input {...register("email")} type="email" className="mt-1" /></label>
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          <label className="block text-sm font-medium">Password<Input {...register("password")} type="password" className="mt-1" /></label>
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          {errors.root && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</p>}
          <Button disabled={isSubmitting} className="w-full"><LogIn size={18} /> Sign in</Button>
        </div>
      </form>
    </div>
  );
}
