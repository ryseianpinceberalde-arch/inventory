import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import * as controller from "../controllers/authController.js";
import { changePasswordSchema, forgotPasswordSchema, loginSchema, resetPasswordSchema } from "../validators/authValidators.js";

export const authRoutes = Router();

authRoutes.post("/login", validate(loginSchema), controller.login);
authRoutes.post("/refresh", controller.refresh);
authRoutes.post("/logout", controller.logout);
authRoutes.get("/me", authenticate, controller.me);
authRoutes.post("/change-password", authenticate, validate(changePasswordSchema), controller.changePassword);
authRoutes.post("/forgot-password", validate(forgotPasswordSchema), controller.forgotPassword);
authRoutes.post("/reset-password", validate(resetPasswordSchema), controller.resetPassword);
