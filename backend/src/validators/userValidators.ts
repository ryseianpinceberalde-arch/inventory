import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  roleId: z.string().uuid(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
});

export const updateUserSchema = createUserSchema.omit({ password: true }).partial();
