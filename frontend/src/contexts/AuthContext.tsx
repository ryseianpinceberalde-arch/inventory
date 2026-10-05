import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, setAccessToken } from "../services/api";
import type { ApiResponse, User } from "../types/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function expire() { setUser(null); queryClient.clear(); }
    window.addEventListener("smartstock:session-expired", expire);
    return () => window.removeEventListener("smartstock:session-expired", expire);
  }, [queryClient]);

  useEffect(() => {
    api.post<ApiResponse<{ accessToken: string; user: User }>>("/auth/refresh", {})
      .then((response) => {
        setAccessToken(response.data.data.accessToken);
        return api.get<ApiResponse<User>>("/auth/me");
      })
      .then((response) => {
        setUser(response.data.data);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email: string, password: string) {
      const response = await api.post<ApiResponse<{ accessToken: string; user: User }>>("/auth/login", { email, password });
      setAccessToken(response.data.data.accessToken);
      const me = await api.get<ApiResponse<User>>("/auth/me");
      queryClient.clear();
      setUser(me.data.data);
      toast.success("Signed in");
    },
    async logout() {
      await api.post("/auth/logout");
      setAccessToken(null);
      queryClient.clear();
      sessionStorage.removeItem("smartstock.pos.cart");
      sessionStorage.removeItem("smartstock.pos.paymongo.pending");
      setUser(null);
    },
    hasPermission(permission: string) {
      return Boolean(user?.permissions.includes(permission));
    },
    hasAnyPermission(permissions: string[]) {
      return Boolean(user && permissions.some((permission) => user.permissions.includes(permission)));
    },
    hasAllPermissions(permissions: string[]) {
      return Boolean(user && permissions.every((permission) => user.permissions.includes(permission)));
    }
  }), [loading, user, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
