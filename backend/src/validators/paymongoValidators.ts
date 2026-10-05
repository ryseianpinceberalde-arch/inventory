import { z } from "zod";
import { money, uniqueProducts } from "./common.js";

export const gcashCheckoutSchema = z.object({
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    productDiscount: money.default("0")
  })).min(1).max(200).refine(uniqueProducts, "Each product must appear only once")
});
