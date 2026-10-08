import { z } from "zod";

export const idParamSchema = z.object({ id: z.string().uuid() });
export const money = z.union([z.string(), z.number()]).transform((v) => String(v).trim())
  .refine((v) => /^\d{1,10}(\.\d{1,2})?$/.test(v), "Enter a PHP amount from 0 to 9,999,999,999.99 with at most two decimal places");
export const dateValue = z.string().refine((v) => v.trim() !== "" && Number.isFinite(Date.parse(v)), "Enter a valid date");
export const uniqueProducts = (items: { productId: string }[]) => new Set(items.map((item) => item.productId)).size === items.length;
export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(["name", "sku", "barcode", "currentStock", "sellingPrice", "updatedAt", "createdAt", "status"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});
