import { z } from "zod";
import { money } from "./common.js";

const MAX_PRODUCT_STOCK = 2_147_483_647;

export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE")
});

export const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().optional(),
  barcode: z.string().min(3),
  categoryId: z.string().uuid(),
  primarySupplierId: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  costPrice: money,
  sellingPrice: money,
  memberPrice: money.nullable().optional(),
  wholesalePrice: money.nullable().optional(),
  wholesaleMinQuantity: z.coerce.number().int().min(1).max(MAX_PRODUCT_STOCK).default(10),
  currentStock: z.coerce.number().int().min(0).max(MAX_PRODUCT_STOCK, "Starting stock cannot exceed 2,147,483,647.").default(0),
  reorderLevel: z.coerce.number().int().min(0).max(MAX_PRODUCT_STOCK, "Low-stock alert level cannot exceed 2,147,483,647.").default(0),
  unit: z.string().default("pcs"),
  imageUrl: z.string().optional().nullable(),
  tracksExpiration: z.boolean().default(true),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE")
});

export const supplierSchema = z.object({
  name: z.string().min(2),
  contactPerson: z.string().optional(),
  phone: z.string()
    .refine((value) => value === "" || /^09\d{9}$/.test(value), "Phone number must contain 11 digits and start with 09.")
    .optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  deliveryLeadTime: z.coerce.number().int().min(0).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  notes: z.string().optional()
});

export const supplierProductSchema = z.object({
  supplierId: z.string().uuid(),
  productId: z.string().uuid()
});

export const customerSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(7).max(32),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional()
});

export const loyaltySettingsSchema = z.object({
  earningSpend: z.coerce.number().finite().positive().max(1_000_000).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8),
  redemptionValue: z.coerce.number().finite().positive().max(10_000).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8)
});

export const loyaltyAdjustmentSchema = z.object({
  pointsDelta: z.coerce.number().int().min(-2_147_483_647).max(2_147_483_647).refine((value) => value !== 0),
  reason: z.string().trim().min(3).max(500)
});
