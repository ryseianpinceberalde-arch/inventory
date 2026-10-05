import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

interface AccessPayload {
  sub: string;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) throw new AppError("Authentication is required.", 401);

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ["HS256"] }) as AccessPayload;
    if (typeof payload.sub !== "string") throw new AppError("Authentication is required.", 401);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } }
          }
        },
        permissions: { include: { permission: true } }
      }
    });
    if (!user || user.status !== UserStatus.ACTIVE) throw new AppError("Authentication is required.", 401);
    const permissions = new Set<string>([
      ...user.role.rolePermissions.map((row) => row.permission.key),
      ...user.permissions.map((row) => row.permission.key)
    ]);
    req.user = {
      id: user.id,
      role: user.role.name,
      roleId: user.roleId,
      roleName: user.role.name,
      email: user.email,
      fullName: user.fullName,
      permissions: Array.from(permissions)
    };
    next();
  } catch (error) {
    next(error instanceof jwt.JsonWebTokenError ? new AppError("Authentication is required.", 401) : error);
  }
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError("Authentication is required.", 401);
    if (!req.user.permissions.includes(permission)) throw new AppError("You do not have permission to perform this action.", 403);
    next();
  };
}

export function requireAnyPermission(permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError("Authentication is required.", 401);
    if (!permissions.some((permission) => req.user?.permissions.includes(permission))) {
      throw new AppError("You do not have permission to perform this action.", 403);
    }
    next();
  };
}

export function requireAllPermissions(permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError("Authentication is required.", 401);
    if (!permissions.every((permission) => req.user?.permissions.includes(permission))) {
      throw new AppError("You do not have permission to perform this action.", 403);
    }
    next();
  };
}

export const authorize = requireAnyPermission;
