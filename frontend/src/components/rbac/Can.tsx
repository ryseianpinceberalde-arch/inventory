import type { ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface CanProps {
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  children: ReactNode;
}

export function Can({ permission, anyPermissions, allPermissions, children }: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  if (permission && !hasPermission(permission)) return null;
  if (anyPermissions && !hasAnyPermission(anyPermissions)) return null;
  if (allPermissions && !hasAllPermissions(allPermissions)) return null;
  return <>{children}</>;
}
