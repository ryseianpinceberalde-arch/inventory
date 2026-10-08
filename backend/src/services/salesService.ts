import { MovementType, PaymentMethod, Prisma, SaleStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { verifyCheckout } from "./paymongoService.js";
import { createLowStockAlert } from "./inventoryService.js";
import { defaultLoyaltySettings, getLoyaltySettings, pointsEarnedFor, pointsToReverseOnRefund } from "./loyaltyService.js";
import { customerUnitPrice } from "../utils/customerPricing.js";

export async function listHeldSales(cashierId: string) {
  return prisma.heldSale.findMany({
    where: { cashierId },
    include: { items: { include: { product: { include: { category: true, primarySupplier: true } } } } },
    orderBy: { updatedAt: "desc" }
  });
}

export async function holdSale(input: {
  customerId?: string | null;
  cashierId: string;
  notes?: string;
  items: { productId: string; quantity: number; productDiscount: string }[];
}) {
  return prisma.$transaction(async (tx) => {
    for (const item of [...input.items].sort((a, b) => a.productId.localeCompare(b.productId))) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.status !== "ACTIVE") throw new AppError("Active product not found", 404);
      if (product.currentStock < item.quantity) throw new AppError(`Insufficient stock for ${product.name}`, 400);
    }

    return tx.heldSale.create({
      data: {
        customerId: input.customerId,
        cashierId: input.cashierId,
        notes: input.notes,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            discount: new Prisma.Decimal(item.productDiscount)
          }))
        }
      },
      include: { items: { include: { product: { include: { category: true, primarySupplier: true } } } } }
    });
  });
}

export async function deleteHeldSale(id: string, cashierId: string) {
  const heldSale = await prisma.heldSale.findFirst({ where: { id, cashierId } });
  if (!heldSale) throw new AppError("Held order not found", 404);
  await prisma.heldSale.delete({ where: { id } });
}

export async function completeSale(input: {
  receiptNo: string;
  customerId?: string | null;
  cashierId: string;
  paymentMethod: PaymentMethod;
  amountPaid: string;
  transactionDiscount: string;
  loyaltyPointsRedeemed?: number;
  idempotencyKey: string;
  checkoutSessionId?: string;
  items: { productId: string; quantity: number; productDiscount: string }[];
}) {
  if (input.paymentMethod === "GCASH" && !input.checkoutSessionId) throw new AppError("A verified GCash checkout is required.", 422);
  const pointsRedeemed = input.loyaltyPointsRedeemed ?? 0;
  const verifiedAmount = input.paymentMethod === "GCASH" ? await verifyCheckout(input.checkoutSessionId!, input.cashierId, input.items, input.customerId, pointsRedeemed) : null;
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${input.idempotencyKey}))`;
    if (input.checkoutSessionId) await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${input.checkoutSessionId}))`;
    const include = { items: { include: { product: true } }, payments: true, customer: true, cashier: true } as const;
    const existing = await tx.sale.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include });
    if (existing) {
      if (existing.cashierId !== input.cashierId) throw new AppError("This transaction reference is already in use.", 409);
      return existing;
    }
    if (input.checkoutSessionId) {
      const used = await tx.payment.findFirst({ where: { referenceNumber: input.checkoutSessionId } });
      if (used) throw new AppError("This payment was already recorded. Open sales to view its receipt.", 409);
    }
    let customer: { status: string; customerType: string; loyaltyPoints: number } | null = null;
    if (input.customerId) {
      await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${input.customerId}::uuid FOR UPDATE`;
      customer = await tx.customer.findUnique({ where: { id: input.customerId }, select: { status: true, customerType: true, loyaltyPoints: true } });
      if (!customer || customer.status !== "ACTIVE") throw new AppError("Active customer not found", 404);
    }
    if (pointsRedeemed > 0 && customer?.customerType !== "Member") throw new AppError("Only members can redeem loyalty points.", 422);
    if (customer && pointsRedeemed > customer.loyaltyPoints) throw new AppError("The customer does not have enough loyalty points.", 409);
    const loyaltySettings = customer?.customerType === "Member" ? await getLoyaltySettings(tx) : defaultLoyaltySettings;
    const lines = [];
    let subtotal = new Prisma.Decimal(0);
    let grossProfit = new Prisma.Decimal(0);
    for (const item of [...input.items].sort((a, b) => a.productId.localeCompare(b.productId))) {
      await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${item.productId}::uuid FOR UPDATE`;
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.status !== "ACTIVE") throw new AppError("Active product not found", 404);
      if (product.currentStock < item.quantity) throw new AppError(`Insufficient stock for ${product.name}`, 400);
      const productDiscount = new Prisma.Decimal(item.productDiscount);
      const unitPrice = customerUnitPrice(product, customer?.customerType, item.quantity);
      const lineTotal = unitPrice.mul(item.quantity).sub(productDiscount);
      if (lineTotal.lt(0)) throw new AppError("Discount exceeds the product total", 422);
      const profit = unitPrice.sub(product.costPrice).mul(item.quantity).sub(productDiscount);
      subtotal = subtotal.add(lineTotal);
      grossProfit = grossProfit.add(profit);
      lines.push({ product, quantity: item.quantity, unitPrice, productDiscount, lineTotal, profit });
    }

    const discountTotal = new Prisma.Decimal(input.transactionDiscount);
    const loyaltyDiscount = new Prisma.Decimal(pointsRedeemed).mul(loyaltySettings.redemptionValue).toDecimalPlaces(2);
    if (loyaltyDiscount.gt(subtotal.sub(discountTotal))) throw new AppError("Point redemption exceeds the order total.", 422);
    const total = subtotal.sub(discountTotal).sub(loyaltyDiscount);
    if (total.lt(0)) throw new AppError("Discount exceeds the sale total", 422);
    if (verifiedAmount && !verifiedAmount.eq(total)) throw new AppError("Paid amount differs from the current sale total. Review this payment before continuing.", 409);
    const amountPaid = verifiedAmount ?? new Prisma.Decimal(input.amountPaid);
    if (amountPaid.lt(total)) throw new AppError("Amount paid is below total", 400);
    const loyaltyPointsEarned = customer?.customerType === "Member" ? pointsEarnedFor(total, loyaltySettings.earningSpend) : 0;
    if (customer && customer.loyaltyPoints - pointsRedeemed + loyaltyPointsEarned > 2_147_483_647) {
      throw new AppError("This purchase would exceed the customer's points balance limit.", 422);
    }
    const totalDiscount = discountTotal.add(loyaltyDiscount);

    const sale = await tx.sale.create({
      data: {
        receiptNo: input.receiptNo,
        customerId: input.customerId,
        cashierId: input.cashierId,
        subtotal,
        discountTotal: totalDiscount,
        tax: 0,
        total,
        amountPaid,
        change: amountPaid.sub(total),
        paymentMethod: input.paymentMethod,
        idempotencyKey: input.idempotencyKey,
        grossProfit: grossProfit.sub(totalDiscount),
        loyaltyPointsEarned,
        loyaltyPointsRedeemed: pointsRedeemed,
        loyaltyDiscount,
        items: {
          create: lines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            sellingPrice: line.unitPrice,
            historicalCost: line.product.costPrice,
            productDiscount: line.productDiscount,
            lineTotal: line.lineTotal,
            profit: line.profit
          }))
        },
        payments: {
          create: {
            method: input.paymentMethod,
            referenceNumber: verifiedAmount ? input.checkoutSessionId : undefined,
            amount: total,
            processedById: input.cashierId
          }
        }
      },
      include: { items: { include: { product: true } }, payments: true, customer: true, cashier: true }
    });

    if (input.customerId && (loyaltyPointsEarned > 0 || pointsRedeemed > 0)) {
      await tx.customer.update({ where: { id: input.customerId }, data: { loyaltyPoints: { increment: loyaltyPointsEarned - pointsRedeemed } } });
      await tx.loyaltyTransaction.create({
        data: {
          customerId: input.customerId,
          saleId: sale.id,
          transactionType: "SALE",
          pointsEarned: loyaltyPointsEarned,
          pointsRedeemed,
          note: pointsRedeemed ? `Redeemed ${pointsRedeemed} points; earned ${loyaltyPointsEarned}` : `Earned ${loyaltyPointsEarned} points`
        }
      });
    }

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
    await tx.$queryRaw`SELECT id FROM "Sale" WHERE id = ${input.saleId}::uuid FOR UPDATE`;
    const sale = await tx.sale.findUnique({ where: { id: input.saleId }, include: { items: true, refunds: { include: { items: true } } } });
    if (!sale) throw new AppError("Sale not found", 404);
    if (![SaleStatus.COMPLETED, SaleStatus.PARTIALLY_REFUNDED].includes(sale.status as "COMPLETED" | "PARTIALLY_REFUNDED")) throw new AppError("This sale cannot be refunded", 409);
    if (new Set(sale.items.map((item) => item.productId)).size !== sale.items.length) throw new AppError("This legacy sale has duplicate product lines and requires manual refund reconciliation.", 409);
    let refundAmount = new Prisma.Decimal(0);
    const refundItems = [];
    for (const item of input.items) {
      const saleItem = sale.items.find((row) => row.id === item.saleItemId);
      if (!saleItem) throw new AppError("Sale item not found", 404);
      const returned = sale.refunds.flatMap((refund) => refund.items).filter((row) => row.productId === saleItem.productId).reduce((sum, row) => sum + row.quantity, 0);
      if (item.quantity + returned > saleItem.quantity) throw new AppError("Refund quantity exceeds sold quantity", 400);
      const amount = sale.subtotal.eq(0) ? new Prisma.Decimal(0) : saleItem.lineTotal.mul(sale.total).div(sale.subtotal).div(saleItem.quantity).mul(item.quantity).toDecimalPlaces(2);
      refundAmount = refundAmount.add(amount);
      refundItems.push({ productId: saleItem.productId, quantity: item.quantity, condition: item.condition, amount });
    }
    const alreadyRefunded = sale.refunds.reduce((sum, refund) => sum.add(refund.refundAmount), new Prisma.Decimal(0));
    if (refundAmount.gt(sale.total.sub(alreadyRefunded))) {
      const excess = refundAmount.sub(sale.total.sub(alreadyRefunded));
      if (excess.gt("0.01")) throw new AppError("Refund exceeds the remaining sale balance", 409);
      refundItems[refundItems.length - 1].amount = refundItems[refundItems.length - 1].amount.sub(excess);
      refundAmount = refundAmount.sub(excess);
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
    const previouslyRefundedQuantity = sale.refunds.flatMap((row) => row.items).reduce((sum, row) => sum + row.quantity, 0);
    const currentRefundQuantity = refundItems.reduce((sum, row) => sum + row.quantity, 0);
    const previousRefundAmount = sale.refunds.reduce((sum, row) => sum.add(row.refundAmount), new Prisma.Decimal(0));
    const pointsRedemptionBasis = sale.total.add(sale.loyaltyDiscount);
    const pointsBasisForItem = (item: { productId: string; quantity: number }) => {
      const saleItem = sale.items.find((row) => row.productId === item.productId);
      if (!saleItem || sale.subtotal.eq(0)) return new Prisma.Decimal(0);
      return saleItem.lineTotal.mul(pointsRedemptionBasis).div(sale.subtotal).div(saleItem.quantity).mul(item.quantity).toDecimalPlaces(2);
    };
    const previousBasisTotal = sale.refunds.flatMap((row) => row.items).reduce((sum, item) => sum.add(pointsBasisForItem(item)), new Prisma.Decimal(0));
    const previousPointsBasisAmount = previousBasisTotal.gt(pointsRedemptionBasis) ? pointsRedemptionBasis : previousBasisTotal;
    let currentPointsBasisAmount = refundItems.reduce((sum, item) => sum.add(pointsBasisForItem(item)), new Prisma.Decimal(0));
    const totalSoldQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);
    if (previouslyRefundedQuantity + currentRefundQuantity === totalSoldQuantity) {
      const remainingBasis = pointsRedemptionBasis.sub(previousPointsBasisAmount);
      currentPointsBasisAmount = remainingBasis.gt(0) ? remainingBasis : new Prisma.Decimal(0);
    }
    const pointReversal = pointsToReverseOnRefund({
      pointsEarned: sale.loyaltyPointsEarned,
      pointsRedeemed: sale.loyaltyPointsRedeemed,
      saleTotal: sale.total,
      previousRefundAmount,
      currentRefundAmount: refundAmount,
      pointsRedemptionBasis,
      previousPointsBasisAmount,
      currentPointsBasisAmount
    });
    let pointsToRevoke = pointReversal.pointsEarnedReversed;
    const pointsRestored = pointReversal.pointsRedeemedRestored;
    if (sale.customerId && (pointsToRevoke > 0 || pointsRestored > 0)) {
      await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${sale.customerId}::uuid FOR UPDATE`;
      const customer = await tx.customer.findUnique({ where: { id: sale.customerId }, select: { loyaltyPoints: true } });
      if (!customer) throw new AppError("Customer not found", 404);
      pointsToRevoke = Math.min(pointsToRevoke, customer.loyaltyPoints + pointsRestored);
      await tx.customer.update({ where: { id: sale.customerId }, data: { loyaltyPoints: { increment: pointsRestored - pointsToRevoke } } });
      await tx.loyaltyTransaction.create({
        data: {
          customerId: sale.customerId,
          refundId: refund.id,
          transactionType: "REFUND",
          pointsEarned: -pointsToRevoke,
          pointsRedeemed: -pointsRestored,
          note: `Reversed ${pointsToRevoke} earned points; restored ${pointsRestored} redeemed points`
        }
      });
    }
    for (const item of [...refundItems].sort((a, b) => a.productId.localeCompare(b.productId))) {
      await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${item.productId}::uuid FOR UPDATE`;
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
    await tx.sale.update({ where: { id: sale.id }, data: { status: sale.refunds.flatMap((row) => row.items).reduce((sum, row) => sum + row.quantity, 0) + refundItems.reduce((sum, row) => sum + row.quantity, 0) === sale.items.reduce((sum, row) => sum + row.quantity, 0) ? SaleStatus.REFUNDED : SaleStatus.PARTIALLY_REFUNDED } });
    return refund;
  });
}
