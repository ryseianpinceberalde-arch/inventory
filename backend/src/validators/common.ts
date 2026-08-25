import { z } from "zod";

export const idParamSchema = z.object({ id: z.string().uuid() });
export const money = z.union([z.string(), z.number()]).transform((v) => String(v));
export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});
