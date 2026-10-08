import { z } from "zod";
import { PaymentMethod, SaleStatus } from "@prisma/client";
import { money, dateValue, uniqueProducts } from "./common.js";
import { businessDateKey } from "../utils/businessDate.js";

const salesFilterDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00+08:00`);
  return Number.isFinite(date.getTime()) && businessDateKey(date) === value;
}, "Enter a valid date in YYYY-MM-DD format");

export const salesListQuerySchema = z.object({
  from: salesFilterDate.optional(),
  to: salesFilterDate.optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  status: z.nativeEnum(SaleStatus).optional()
}).refine(({ from, to }) => !from || !to || from <= to, {
  message: "Start date must be before or equal to the end date",
  path: ["to"]
});

export const stockInSchema = z.object({
  referenceNo: z.string().min(3),
  supplierId: z.string().uuid(),
  deliveryDate: dateValue,
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    unitCost: money,
    sellingPrice: money.optional(),
    expirationDate: dateValue.optional().nullable(),
    batchNumber: z.string().optional()
  })).min(1).max(200).refine(uniqueProducts, "Each product must appear only once")
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
  idempotencyKey: z.string().min(8).max(200),
  checkoutSessionId: z.string().regex(/^cs_[A-Za-z0-9]+$/).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    productDiscount: money.default("0")
  })).min(1).max(200).refine(uniqueProducts, "Each product must appear only once")
});

export const heldSaleSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    productDiscount: money.default("0")
  })).min(1).max(200).refine(uniqueProducts, "Each product must appear only once")
});

export const refundSchema = z.object({
  saleId: z.string().uuid(),
  reason: z.string().min(3),
  refundMethod: z.enum(["CASH", "GCASH", "MAYA", "BANK_TRANSFER", "DEBIT_CARD", "CREDIT_CARD", "CUSTOMER_CREDIT", "MIXED"]),
  items: z.array(z.object({
    saleItemId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    condition: z.enum(["Return to inventory", "Damaged", "Defective", "Return to supplier"])
  })).min(1).max(200).refine((items) => new Set(items.map((item) => item.saleItemId)).size === items.length, "Each sale item must appear only once")
});
