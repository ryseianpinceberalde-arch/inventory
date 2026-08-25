import { Navigate, Outlet } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
}

export function ProtectedRoute({ permission, anyPermissions, allPermissions }: ProtectedRouteProps) {
  const { user, loading, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  if (loading) return <div className="p-8 text-sm text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/unauthorized" replace />;
  if (anyPermissions && !hasAnyPermission(anyPermissions)) return <Navigate to="/unauthorized" replace />;
  if (allPermissions && !hasAllPermissions(allPermissions)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

export function PermissionRoute({ children, permission, anyPermissions, allPermissions }: PropsWithChildren<ProtectedRouteProps>) {
  const { user, loading, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  if (loading) return <div className="p-8 text-sm text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/unauthorized" replace />;
  if (anyPermissions && !hasAnyPermission(anyPermissions)) return <Navigate to="/unauthorized" replace />;
  if (allPermissions && !hasAllPermissions(allPermissions)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
