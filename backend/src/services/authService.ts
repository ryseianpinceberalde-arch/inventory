import bcrypt from "bcrypt";
import crypto from "crypto";
import { Response } from "express";
import { UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { findRefreshToken, persistRefreshToken, signAccessToken, signRefreshToken } from "./tokenService.js";

const cookieName = "smartstock_refresh";

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(cookieName);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email }, include: { role: { include: { rolePermissions: { include: { permission: true } } } }, permissions: { include: { permission: true } } } });
  if (!user || user.status !== UserStatus.ACTIVE) throw new AppError("Invalid credentials", 401);
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError("Invalid credentials", 401);

  const publicUser = {
    id: user.id,
    role: user.role.name,
    roleId: user.roleId,
    roleName: user.role.name,
    email: user.email,
    fullName: user.fullName,
    permissions: Array.from(new Set([
      ...user.role.rolePermissions.map((row) => row.permission.key),
      ...user.permissions.map((row) => row.permission.key)
    ]))
  };
  const accessToken = signAccessToken(publicUser);
  const refreshToken = signRefreshToken(user.id);
  await persistRefreshToken(user.id, refreshToken);
  return { accessToken, refreshToken, user: publicUser };
}

export async function refresh(rawToken?: string) {
  if (!rawToken) throw new AppError("Refresh token required", 401);
  const stored = await findRefreshToken(rawToken);
  if (!stored || stored.user.status !== UserStatus.ACTIVE) throw new AppError("Invalid refresh token", 401);
  const publicUser = {
    id: stored.user.id,
    role: stored.user.role.name,
    roleId: stored.user.roleId,
    roleName: stored.user.role.name,
    email: stored.user.email,
    fullName: stored.user.fullName,
    permissions: stored.user.role.rolePermissions.map((row) => row.permission.key)
  };
  return { accessToken: signAccessToken(publicUser), user: publicUser };
}

export async function logout(rawToken?: string) {
  if (!rawToken) return;
  const stored = await findRefreshToken(rawToken);
  if (stored) await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError("Current password is incorrect", 400);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
}

export async function createPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: await bcrypt.hash(token, 10),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });
  return token;
}

export async function resetPassword(token: string, newPassword: string) {
  const active = await prisma.passwordResetToken.findMany({
    where: { usedAt: null, expiresAt: { gt: new Date() } }
  });
  for (const row of active) {
    if (await bcrypt.compare(token, row.tokenHash)) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } }),
        prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } })
      ]);
      return;
    }
  }
  throw new AppError("Invalid or expired reset token", 400);
}
