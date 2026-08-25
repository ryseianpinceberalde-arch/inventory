import { z } from "zod";

const password = z.string().min(8);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({ email: z.string().email() });

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password
});
