import { Prisma } from "@prisma/client";

type Line = { productId: string; quantity: number; sellingPrice: Prisma.Decimal; historicalCost: Prisma.Decimal; lineTotal: Prisma.Decimal; productDiscount: Prisma.Decimal };
type RefundLine = { productId: string; quantity: number; condition: string; amount: Prisma.Decimal };
type SaleAmounts = { subtotal: Prisma.Decimal; discountTotal: Prisma.Decimal; items: Line[]; refunds: { items: RefundLine[] }[] };

export function saleLineTotals(sale: SaleAmounts, item: Line) {
  const refunds = sale.refunds.flatMap((refund) => refund.items).filter((row) => row.productId === item.productId);
  const refund = refunds.reduce((sum, row) => sum.add(row.amount), new Prisma.Decimal(0));
  const returned = refunds.reduce((sum, row) => sum + row.quantity, 0);
  const restocked = refunds.filter((row) => row.condition === "Return to inventory").reduce((sum, row) => sum + row.quantity, 0);
  const transactionDiscount = sale.subtotal.eq(0) ? new Prisma.Decimal(0) : sale.discountTotal.mul(item.lineTotal).div(sale.subtotal);
  const grossSales = item.sellingPrice.mul(item.quantity);
  const discount = item.productDiscount.add(transactionDiscount);
  const netSales = grossSales.sub(discount).sub(refund);
  const cogs = item.historicalCost.mul(item.quantity - restocked);
  return { itemsSold: item.quantity - returned, grossSales: Number(grossSales), discount: Number(discount), refund: Number(refund), netSales: Number(netSales), cogs: Number(cogs), profit: Number(netSales.sub(cogs)) };
}

export function saleTotals(sale: SaleAmounts) {
  return sale.items.reduce((sum, item) => {
    const line = saleLineTotals(sale, item);
    for (const key of Object.keys(sum) as Array<keyof typeof sum>) sum[key] += line[key];
    return sum;
  }, { itemsSold: 0, grossSales: 0, discount: 0, refund: 0, netSales: 0, cogs: 0, profit: 0 });
}
