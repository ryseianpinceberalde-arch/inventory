import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export const loyaltySettingKey = "loyalty_rules";

export interface LoyaltySettings {
  earningSpend: number;
  redemptionValue: number;
}

export const defaultLoyaltySettings: LoyaltySettings = { earningSpend: 100, redemptionValue: 1 };

export function normalizeLoyaltySettings(value: unknown): LoyaltySettings {
  if (!value || typeof value !== "object") return defaultLoyaltySettings;
  const candidate = value as Record<string, unknown>;
  const earningSpend = Number(candidate.earningSpend);
  const redemptionValue = Number(candidate.redemptionValue);
  return {
    earningSpend: Number.isFinite(earningSpend) && earningSpend > 0 && earningSpend <= 1_000_000 ? earningSpend : defaultLoyaltySettings.earningSpend,
    redemptionValue: Number.isFinite(redemptionValue) && redemptionValue > 0 && redemptionValue <= 10_000 ? redemptionValue : defaultLoyaltySettings.redemptionValue
  };
}

export async function getLoyaltySettings(client: Pick<typeof prisma, "systemSetting"> = prisma) {
  const setting = await client.systemSetting.findUnique({ where: { key: loyaltySettingKey }, select: { value: true } });
  return normalizeLoyaltySettings(setting?.value);
}

export function pointsEarnedFor(total: Prisma.Decimal, earningSpend: number) {
  const points = total.div(earningSpend).floor();
  if (points.gt(2_147_483_647)) throw new AppError("This purchase would exceed the customer's points balance limit.", 422);
  return points.toNumber();
}

export function pointsToReverseOnRefund(input: {
  pointsEarned: number;
  pointsRedeemed: number;
  saleTotal: Prisma.Decimal;
  previousRefundAmount: Prisma.Decimal;
  currentRefundAmount: Prisma.Decimal;
  pointsRedemptionBasis: Prisma.Decimal;
  previousPointsBasisAmount: Prisma.Decimal;
  currentPointsBasisAmount: Prisma.Decimal;
}) {
  const earnedAlreadyReversed = input.saleTotal.gt(0)
    ? new Prisma.Decimal(input.pointsEarned).mul(input.previousRefundAmount).div(input.saleTotal).floor().toNumber()
    : 0;
  const earnedReversedToDate = input.saleTotal.gt(0)
    ? new Prisma.Decimal(input.pointsEarned).mul(input.previousRefundAmount.add(input.currentRefundAmount)).div(input.saleTotal).floor().toNumber()
    : 0;
  const priorBasis = input.pointsRedemptionBasis.gt(0) ? input.previousPointsBasisAmount : new Prisma.Decimal(0);
  const currentBasis = input.pointsRedemptionBasis.gt(0) ? input.currentPointsBasisAmount : new Prisma.Decimal(0);
  const cumulativeBasis = priorBasis.add(currentBasis);
  const cappedBasis = cumulativeBasis.gt(input.pointsRedemptionBasis) ? input.pointsRedemptionBasis : cumulativeBasis;
  const redeemedAlreadyRestored = input.pointsRedemptionBasis.gt(0)
    ? new Prisma.Decimal(input.pointsRedeemed).mul(priorBasis).div(input.pointsRedemptionBasis).floor().toNumber()
    : 0;
  const redeemedRestoredToDate = input.pointsRedemptionBasis.gt(0)
    ? new Prisma.Decimal(input.pointsRedeemed).mul(cappedBasis).div(input.pointsRedemptionBasis).floor().toNumber()
    : 0;
  return {
    pointsEarnedReversed: Math.max(0, Math.min(input.pointsEarned, earnedReversedToDate) - Math.min(input.pointsEarned, earnedAlreadyReversed)),
    pointsRedeemedRestored: Math.max(0, Math.min(input.pointsRedeemed, redeemedRestoredToDate) - redeemedAlreadyRestored)
  };
}
