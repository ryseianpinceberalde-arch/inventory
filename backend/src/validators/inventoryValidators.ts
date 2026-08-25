import { z } from "zod";
import { money } from "./common.js";

export const stockInSchema = z.object({
  referenceNo: z.string().min(3),
  supplierId: z.string().uuid(),
  deliveryDate: z.string(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    unitCost: money,
    expirationDate: z.string().optional().nullable(),
    batchNumber: z.string().optional()
  })).min(1)
});

export const stockOutSchema = z.object({
  referenceNo: z.string().min(3),
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  reason: z.enum(["Damaged", "Expired", "Returned to supplier", "Lost", "Internal use", "Product transfer", "Manual correction"]),
  notes: z.string().optional()
});

export const adjustmentSchema = z.object({
  productId: z.string().uuid(),
  physicalQuantity: z.coerce.number().int().min(0),
  reason: z.string().min(3),
  notes: z.string().optional()
});

export const saleSchema = z.object({
  receiptNo: z.string().min(3),
  customerId: z.string().uuid().optional().nullable(),
  paymentMethod: z.enum(["CASH", "GCASH", "MAYA", "BANK_TRANSFER", "DEBIT_CARD", "CREDIT_CARD", "CUSTOMER_CREDIT", "MIXED"]),
  amountPaid: money,
  transactionDiscount: money.default("0"),
  idempotencyKey: z.string().min(8),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    productDiscount: money.default("0")
  })).min(1)
});

export const refundSchema = z.object({
  saleId: z.string().uuid(),
  reason: z.string().min(3),
  refundMethod: z.enum(["CASH", "GCASH", "MAYA", "BANK_TRANSFER", "DEBIT_CARD", "CREDIT_CARD", "CUSTOMER_CREDIT", "MIXED"]),
  items: z.array(z.object({
    saleItemId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    condition: z.enum(["Return to inventory", "Damaged", "Defective", "Return to supplier"])
  })).min(1)
});
