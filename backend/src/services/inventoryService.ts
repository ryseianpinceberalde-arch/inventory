import { MovementType, NotificationPriority, Prisma, RoleName } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export async function createLowStockAlert(tx: Prisma.TransactionClient, productId: string) {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product) return;
  if (product.currentStock <= product.reorderLevel) {
    const existing = await tx.notification.findFirst({ where: { relatedProductId: productId, isRead: false, alertType: product.currentStock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK" } });
    if (existing) return;
    await tx.notification.create({
      data: {
        title: product.currentStock === 0 ? "Product is out of stock" : "Product is low on stock",
        message: `${product.name} has ${product.currentStock} ${product.unit} remaining.`,
        alertType: product.currentStock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
        priority: product.currentStock === 0 ? NotificationPriority.CRITICAL : NotificationPriority.HIGH,
        recipientRole: RoleName.MANAGER,
        relatedProductId: product.id
      }
    });
  }
}

export async function stockIn(input: {
  referenceNo: string;
  supplierId: string;
  deliveryDate: string;
  notes?: string;
  receivedById: string;
  items: { productId: string; quantity: number; unitCost: string; sellingPrice?: string; expirationDate?: string | null; batchNumber?: string }[];
}) {
  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findUnique({ where: { id: input.supplierId } });
    if (!supplier || supplier.status !== "ACTIVE") throw new AppError("Select an active supplier", 422);
    const totalAmount = input.items.reduce((sum, item) => sum.add(new Prisma.Decimal(item.unitCost).mul(item.quantity)), new Prisma.Decimal(0));
    const receipt = await tx.stockReceipt.create({
      data: {
        referenceNo: input.referenceNo,
        supplierId: input.supplierId,
        receivedById: input.receivedById,
        deliveryDate: new Date(input.deliveryDate),
        notes: input.notes,
        totalAmount,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
            batchNumber: item.batchNumber
          }))
        }
      },
      include: { items: true }
    });

    for (const item of [...input.items].sort((a, b) => a.productId.localeCompare(b.productId))) {
      await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${item.productId}::uuid FOR UPDATE`;
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new AppError("Product not found", 404);
      const newQuantity = product.currentStock + item.quantity;
      await tx.product.update({ where: { id: item.productId }, data: { currentStock: newQuantity, costPrice: item.unitCost, ...(item.sellingPrice === undefined ? {} : { sellingPrice: item.sellingPrice }) } });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          employeeId: input.receivedById,
          previousQuantity: product.currentStock,
          quantityChanged: item.quantity,
          newQuantity,
          movementType: MovementType.STOCK_IN,
          referenceNo: input.referenceNo,
          reason: "Supplier delivery"
        }
      });
    }
    return receipt;
  });
}

export async function stockOut(input: {
  referenceNo: string;
  productId: string;
  quantity: number;
  reason: string;
  notes?: string;
  employeeId: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${input.productId}::uuid FOR UPDATE`;
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new AppError("Product not found", 404);
    if (product.currentStock < input.quantity) throw new AppError("Insufficient stock", 400);
    const newQuantity = product.currentStock - input.quantity;
    await tx.product.update({ where: { id: product.id }, data: { currentStock: newQuantity } });
    const movement = await tx.stockMovement.create({
      data: {
        productId: product.id,
        employeeId: input.employeeId,
        previousQuantity: product.currentStock,
        quantityChanged: -input.quantity,
        newQuantity,
        movementType: MovementType.STOCK_OUT,
        referenceNo: input.referenceNo,
        reason: `${input.reason}${input.notes ? ` - ${input.notes}` : ""}`
      }
    });
    if (input.quantity >= Math.max(product.reorderLevel * 2, 20)) {
      await tx.notification.create({
        data: {
          title: "Large stock-out recorded",
          message: `${input.quantity} units were removed from ${product.name}.`,
          alertType: "LARGE_STOCK_OUT",
          priority: NotificationPriority.HIGH,
          recipientRole: RoleName.MANAGER,
          relatedProductId: product.id
        }
      });
    }
    await createLowStockAlert(tx, product.id);
    return movement;
  });
}

export async function requestAdjustment(input: {
  productId: string;
  physicalQuantity: number;
  reason: string;
  notes?: string;
  requestedById: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${input.productId}::uuid FOR UPDATE`;
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new AppError("Product not found", 404);
    const difference = input.physicalQuantity - product.currentStock;
    const approved = Math.abs(difference) < 10;
    const adjustment = await tx.inventoryAdjustment.create({ data: {
      ...input, systemQuantity: product.currentStock, difference,
      approvalStatus: approved ? "APPROVED" : "PENDING", approvedById: approved ? input.requestedById : null
    } });
    if (approved) {
      await tx.product.update({ where: { id: product.id }, data: { currentStock: input.physicalQuantity } });
      await tx.stockMovement.create({ data: {
        productId: product.id, employeeId: input.requestedById, previousQuantity: product.currentStock,
        quantityChanged: difference, newQuantity: input.physicalQuantity, movementType: MovementType.ADJUSTMENT,
        referenceNo: `ADJ-${adjustment.id}`, reason: input.reason
      } });
      await createLowStockAlert(tx, product.id);
    }
    return adjustment;
  });
}

export async function approveAdjustment(id: string, approvedById: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "InventoryAdjustment" WHERE id = ${id}::uuid FOR UPDATE`;
    const adjustment = await tx.inventoryAdjustment.findUnique({ where: { id }, include: { product: true } });
    if (!adjustment) throw new AppError("Adjustment not found", 404);
    if (adjustment.approvalStatus !== "PENDING") return adjustment;
    if (adjustment.requestedById === approvedById) throw new AppError("You cannot approve your own adjustment request.", 409);
    await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${adjustment.productId}::uuid FOR UPDATE`;
    const current = await tx.product.findUniqueOrThrow({ where: { id: adjustment.productId } });
    if (current.currentStock !== adjustment.systemQuantity) throw new AppError("Stock changed since this count. Submit a new physical count before approval.", 409);
    await tx.product.update({ where: { id: adjustment.productId }, data: { currentStock: adjustment.physicalQuantity } });
    await tx.stockMovement.create({
      data: {
        productId: adjustment.productId,
        employeeId: approvedById,
        previousQuantity: adjustment.systemQuantity,
        quantityChanged: adjustment.difference,
        newQuantity: adjustment.physicalQuantity,
        movementType: MovementType.ADJUSTMENT,
        referenceNo: `ADJ-${adjustment.id}`,
        reason: adjustment.reason
      }
    });
    await createLowStockAlert(tx, adjustment.productId);
    return tx.inventoryAdjustment.update({ where: { id }, data: { approvalStatus: "APPROVED", approvedById } });
  });
}
