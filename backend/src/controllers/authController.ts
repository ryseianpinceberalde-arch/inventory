import { Request, Response } from "express";
import { ok } from "../utils/apiResponse.js";
import * as auth from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { audit } from "../services/auditService.js";

const refreshCookie = "smartstock_refresh";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await auth.login(req.body.email, req.body.password);
  auth.setRefreshCookie(res, result.refreshToken);
  await audit({ userId: result.user.id, action: "LOGIN", module: "AUTH", ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "Login successful", { accessToken: result.accessToken, user: result.user });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await auth.refresh(req.cookies?.[refreshCookie]);
  return ok(res, "Access token refreshed", result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await auth.logout(req.cookies?.[refreshCookie]);
  auth.clearRefreshCookie(res);
  return ok(res, "Logout successful", {});
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication is required.", 401);
  return ok(res, "Profile loaded", {
    id: req.user.id,
    fullName: req.user.fullName,
    email: req.user.email,
    role: {
      id: req.user.roleId,
      name: req.user.roleName
    },
    permissions: req.user.permissions
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication is required.", 401);
  await auth.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  await audit({ userId: req.user.id, action: "CHANGE_PASSWORD", module: "AUTH", ipAddress: req.ip, userAgent: req.get("user-agent") });
  return ok(res, "Password changed", {});
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const token = await auth.createPasswordReset(req.body.email);
  return ok(res, "If the email exists, reset instructions were created", process.env.NODE_ENV === "development" ? { token } : {});
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await auth.resetPassword(req.body.token, req.body.password);
  return ok(res, "Password reset successful", {});
});
