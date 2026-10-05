import { z } from "zod";
import { money } from "./common.js";

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
  currentStock: z.coerce.number().int().min(0).default(0),
  reorderLevel: z.coerce.number().int().min(0).default(0),
  unit: z.string().default("pcs"),
  imageUrl: z.string().optional().nullable(),
  tracksExpiration: z.boolean().default(false),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE")
});

export const supplierSchema = z.object({
  name: z.string().min(2),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
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
  fullName: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  customerType: z.enum(["Walk-in", "Regular", "Member", "Wholesale"]).default("Walk-in"),
  loyaltyPoints: z.coerce.number().int().min(0).default(0),
  creditBalance: money.default("0"),
  birthday: z.string().date().transform((value) => new Date(`${value}T00:00:00Z`).toISOString()).optional().nullable(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE")
});
