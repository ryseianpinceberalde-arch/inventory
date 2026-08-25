import { MovementType, PaymentMethod, Prisma, SaleStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { createLowStockAlert } from "./inventoryService.js";

export async function completeSale(input: {
  receiptNo: string;
  customerId?: string | null;
  cashierId: string;
  paymentMethod: PaymentMethod;
  amountPaid: string;
  transactionDiscount: string;
  idempotencyKey: string;
  items: { productId: string; quantity: number; productDiscount: string }[];
}) {
  const existing = await prisma.sale.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { items: true, payments: true } });
  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    const lines = [];
    let subtotal = new Prisma.Decimal(0);
    let grossProfit = new Prisma.Decimal(0);
    for (const item of input.items) {
      await tx.$executeRaw`SELECT id FROM "Product" WHERE id = ${item.productId}::uuid FOR UPDATE`;
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new AppError("Product not found", 404);
      if (product.currentStock < item.quantity) throw new AppError(`Insufficient stock for ${product.name}`, 400);
      const productDiscount = new Prisma.Decimal(item.productDiscount);
      const lineTotal = product.sellingPrice.mul(item.quantity).sub(productDiscount);
      const profit = product.sellingPrice.sub(product.costPrice).mul(item.quantity).sub(productDiscount);
      subtotal = subtotal.add(lineTotal);
      grossProfit = grossProfit.add(profit);
      lines.push({ product, quantity: item.quantity, productDiscount, lineTotal, profit });
    }

    const discountTotal = new Prisma.Decimal(input.transactionDiscount);
    const total = subtotal.sub(discountTotal);
    const amountPaid = new Prisma.Decimal(input.amountPaid);
    if (amountPaid.lt(total)) throw new AppError("Amount paid is below total", 400);

    const sale = await tx.sale.create({
      data: {
        receiptNo: input.receiptNo,
        customerId: input.customerId,
        cashierId: input.cashierId,
        subtotal,
        discountTotal,
        tax: 0,
        total,
        amountPaid,
        change: amountPaid.sub(total),
        paymentMethod: input.paymentMethod,
        idempotencyKey: input.idempotencyKey,
        grossProfit,
        items: {
          create: lines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            sellingPrice: line.product.sellingPrice,
            historicalCost: line.product.costPrice,
            productDiscount: line.productDiscount,
            lineTotal: line.lineTotal,
            profit: line.profit
          }))
        },
        payments: {
          create: {
            method: input.paymentMethod,
            amount: total,
            processedById: input.cashierId
          }
        }
      },
      include: { items: { include: { product: true } }, payments: true, customer: true, cashier: true }
    });

    for (const line of lines) {
      const newQuantity = line.product.currentStock - line.quantity;
      await tx.product.update({ where: { id: line.product.id }, data: { currentStock: newQuantity } });
      await tx.stockMovement.create({
        data: {
          productId: line.product.id,
          employeeId: input.cashierId,
          previousQuantity: line.product.currentStock,
          quantityChanged: -line.quantity,
          newQuantity,
          movementType: MovementType.SALE,
          referenceNo: input.receiptNo,
          reason: "POS sale"
        }
      });
      await createLowStockAlert(tx, line.product.id);
    }

    return sale;
  });
}

export async function processRefund(input: {
  saleId: string;
  reason: string;
  refundMethod: PaymentMethod;
  processedById: string;
  items: { saleItemId: string; quantity: number; condition: string }[];
}) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({ where: { id: input.saleId }, include: { items: true } });
    if (!sale) throw new AppError("Sale not found", 404);
    let refundAmount = new Prisma.Decimal(0);
    const refundItems = [];
    for (const item of input.items) {
      const saleItem = sale.items.find((row) => row.id === item.saleItemId);
      if (!saleItem) throw new AppError("Sale item not found", 404);
      if (item.quantity > saleItem.quantity) throw new AppError("Refund quantity exceeds sold quantity", 400);
      const amount = saleItem.lineTotal.div(saleItem.quantity).mul(item.quantity);
      refundAmount = refundAmount.add(amount);
      refundItems.push({ productId: saleItem.productId, quantity: item.quantity, condition: item.condition, amount });
    }
    const refund = await tx.refund.create({
      data: {
        saleId: sale.id,
        reason: input.reason,
        refundAmount,
        refundMethod: input.refundMethod,
        processedById: input.processedById,
        items: { create: refundItems }
      },
      include: { items: true }
    });
    for (const item of refundItems) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
      const returnsToInventory = item.condition === "Return to inventory";
      const newQuantity = returnsToInventory ? product.currentStock + item.quantity : product.currentStock;
      if (returnsToInventory) await tx.product.update({ where: { id: product.id }, data: { currentStock: newQuantity } });
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          employeeId: input.processedById,
          previousQuantity: product.currentStock,
          quantityChanged: returnsToInventory ? item.quantity : 0,
          newQuantity,
          movementType: MovementType.REFUND,
          referenceNo: `REF-${refund.id}`,
          reason: input.reason
        }
      });
    }
    await tx.sale.update({ where: { id: sale.id }, data: { status: SaleStatus.PARTIALLY_REFUNDED } });
    return refund;
  });
}
