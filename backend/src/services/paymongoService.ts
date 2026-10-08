import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { customerUnitPrice } from "../utils/customerPricing.js";
import { getLoyaltySettings } from "./loyaltyService.js";

const paymongoBaseUrl = "https://api.paymongo.com/v1";

interface PayMongoCheckoutResponse {
  data: {
    id: string;
    attributes: {
      checkout_url: string;
      metadata?: Record<string, string>;
      status: string;
      payment_intent?: {
        attributes?: {
          status?: string;
          amount?: number;
          currency?: string;
        };
      };
      payments?: Array<{
        attributes?: {
          status?: string;
          amount?: number;
          currency?: string;
        };
      }>;
    };
  };
}

function authHeader() {
  if (!env.PAYMONGO_SECRET_KEY) throw new AppError("PayMongo secret key is not configured.", 500);
  return `Basic ${Buffer.from(`${env.PAYMONGO_SECRET_KEY}:`).toString("base64")}`;
}

function centavos(value: Prisma.Decimal | number) {
  return Math.round(Number(value) * 100);
}

function allowedRedirectUrl(url: string) {
  const parsed = new URL(url);
  const allowed = [new URL(env.CLIENT_URL), new URL("http://localhost:5173"), new URL("http://127.0.0.1:5173")];
  if (!allowed.some((origin) => origin.origin === parsed.origin)) throw new AppError("Invalid PayMongo redirect URL.", 422);
  return parsed.toString();
}

async function paymongo<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${paymongoBaseUrl}${path}`, {
    ...init,
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.errors?.[0]?.detail === "string" ? payload.errors[0].detail : "PayMongo request failed.";
    throw new AppError(message, response.status);
  }
  return payload as T;
}

export async function createGcashCheckout(input: {
  cashierId: string;
  customerId?: string | null;
  loyaltyPointsRedeemed?: number;
  items: { productId: string; quantity: number; productDiscount: string }[];
  successUrl: string;
  cancelUrl: string;
}) {
  const [customer, loyaltySettings] = await Promise.all([
    input.customerId ? prisma.customer.findUnique({ where: { id: input.customerId }, select: { status: true, customerType: true, loyaltyPoints: true } }) : Promise.resolve(null),
    getLoyaltySettings()
  ]);
  if (input.customerId && (!customer || customer.status !== "ACTIVE")) throw new AppError("Active customer not found", 404);
  const pointsRedeemed = input.loyaltyPointsRedeemed ?? 0;
  if (pointsRedeemed > 0 && customer?.customerType !== "Member") throw new AppError("Only members can redeem loyalty points.", 422);
  if (customer && pointsRedeemed > customer.loyaltyPoints) throw new AppError("The customer does not have enough loyalty points.", 409);
  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((item) => item.productId) }, status: "ACTIVE" },
    include: { category: true }
  });
  const productsById = new Map(products.map((product) => [product.id, product]));
  let total = new Prisma.Decimal(0);
  const pricedLines = input.items.map((item) => {
    const product = productsById.get(item.productId);
    if (!product) throw new AppError("Product not found", 404);
    if (product.currentStock < item.quantity) throw new AppError(`Insufficient stock for ${product.name}`, 400);
    const discount = new Prisma.Decimal(item.productDiscount);
    const unitPrice = customerUnitPrice(product, customer?.customerType, item.quantity);
    const lineTotal = unitPrice.mul(item.quantity).sub(discount);
    if (lineTotal.lte(0)) throw new AppError("Each checkout line must have a positive total.", 422);
    total = total.add(lineTotal);
    return { name: product.name, description: `${product.category.name} - ${item.quantity} units`, amount: centavos(lineTotal) };
  });

  const pointsDiscount = new Prisma.Decimal(pointsRedeemed).mul(loyaltySettings.redemptionValue);
  if (pointsDiscount.gt(total)) throw new AppError("Point redemption exceeds the order total.", 422);
  const checkoutTotal = total.sub(pointsDiscount);
  if (checkoutTotal.lte(0)) throw new AppError("Checkout total must be greater than zero.", 422);
  const lineItems = allocateCheckoutDiscount(pricedLines, centavos(pointsDiscount));

  const referenceNumber = `PM-${randomUUID()}`;
  const checkout = await paymongo<PayMongoCheckoutResponse>("/checkout_sessions", {
    method: "POST",
    body: JSON.stringify({
      data: {
        attributes: {
          description: `SmartStock POS ${referenceNumber}`,
          line_items: lineItems,
          payment_method_types: ["gcash"],
          reference_number: referenceNumber,
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          success_url: allowedRedirectUrl(input.successUrl),
          cancel_url: allowedRedirectUrl(input.cancelUrl),
          metadata: {
            source: "smartstock-pos",
            referenceNumber,
            cashierId: input.cashierId,
            customerId: input.customerId ?? "",
            loyaltyPointsRedeemed: String(pointsRedeemed),
            cartHash: checkoutCartHash(input.items, input.customerId, pointsRedeemed)
          }
        }
      }
    })
  });

  return {
    id: checkout.data.id,
    checkoutUrl: checkout.data.attributes.checkout_url,
    referenceNumber,
    amount: Number(checkoutTotal.toFixed(2))
  };
}

function allocateCheckoutDiscount(lines: { name: string; description: string; amount: number }[], discountCents: number) {
  const totalCents = lines.reduce((sum, line) => sum + line.amount, 0);
  const allocations = lines.map((line) => {
    const exact = totalCents === 0 ? 0 : discountCents * line.amount / totalCents;
    return { amount: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let unallocated = discountCents - allocations.reduce((sum, line) => sum + line.amount, 0);
  const order = allocations.map((allocation, index) => ({ ...allocation, index })).sort((a, b) => b.remainder - a.remainder);
  for (const allocation of order) {
    if (unallocated === 0) break;
    if (allocations[allocation.index].amount < lines[allocation.index].amount) {
      allocations[allocation.index].amount += 1;
      unallocated -= 1;
    }
  }
  return lines.flatMap((line, index) => {
    const amount = line.amount - allocations[index].amount;
    return amount > 0 ? [{ name: line.name, description: line.description, amount, currency: "PHP", quantity: 1 }] : [];
  });
}

export function checkoutCartHash(items: { productId: string; quantity: number; productDiscount: string }[], customerId?: string | null, loyaltyPointsRedeemed = 0) {
  const canonical = [...items].sort((a, b) => a.productId.localeCompare(b.productId)).map((item) => ({
    productId: item.productId, quantity: item.quantity, discount: new Prisma.Decimal(item.productDiscount).toFixed(2)
  }));
  return createHash("sha256").update(JSON.stringify({ items: canonical, customerId: customerId ?? null, loyaltyPointsRedeemed })).digest("hex");
}

export async function getCheckoutStatus(id: string, cashierId: string) {
  const checkout = await paymongo<PayMongoCheckoutResponse>(`/checkout_sessions/${encodeURIComponent(id)}`);
  const attributes = checkout.data.attributes;
  if (attributes.metadata?.cashierId !== cashierId) throw new AppError("Checkout not found", 404);
  const payment = attributes.payments?.find((item) => item.attributes?.status === "paid")?.attributes;
  return { id: checkout.data.id, status: attributes.status, paid: Boolean(payment),
    amount: payment?.amount, currency: payment?.currency, cartHash: attributes.metadata.cartHash };
}

export async function verifyCheckout(id: string, cashierId: string, items: { productId: string; quantity: number; productDiscount: string }[], customerId?: string | null, loyaltyPointsRedeemed = 0) {
  const checkout = await getCheckoutStatus(id, cashierId);
  if (!checkout.paid || checkout.currency !== "PHP" || !Number.isSafeInteger(checkout.amount) || checkout.amount! <= 0) {
    throw new AppError("GCash payment has not been confirmed. Retry verification after payment.", 409);
  }
  if (checkout.cartHash !== checkoutCartHash(items, customerId, loyaltyPointsRedeemed)) throw new AppError("The cart does not match this payment.", 409);
  return new Prisma.Decimal(checkout.amount!).div(100);
}
