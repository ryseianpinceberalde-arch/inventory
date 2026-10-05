import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import { money, paginationQuery } from "../src/validators/common.js";
import { saleSchema, refundSchema, stockInSchema } from "../src/validators/inventoryValidators.js";
import { serializeForPermissions, stripSecrets } from "../src/rbac/serializers.js";
import { businessDateKey, businessDayStart } from "../src/utils/businessDate.js";

// No live database or payment provider is used by these regression tests.
process.env.DATABASE_URL = "postgresql://test:test@localhost:1/test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-for-regressions";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-for-regressions";
process.env.NODE_ENV = "test";
const { prisma } = await import("../src/config/prisma.js");
const { requestAdjustment, approveAdjustment } = await import("../src/services/inventoryService.js");
const { completeSale, processRefund } = await import("../src/services/salesService.js");
const { findRefreshToken, signRefreshToken } = await import("../src/services/tokenService.js");
const { notificationScope } = await import("../src/controllers/inventoryController.js");
const { verifyCheckout, checkoutCartHash } = await import("../src/services/paymongoService.js");
const { env } = await import("../src/config/env.js");

const productId = "00000000-0000-4000-8000-000000000001";
const actorId = "00000000-0000-4000-8000-000000000002";
const item = { productId, quantity: 2, productDiscount: "0" };
const saleInput = { receiptNo: "TEST-001", cashierId: actorId, paymentMethod: "CASH" as const, amountPaid: "100", transactionDiscount: "5", idempotencyKey: "test-idempotency", items: [item] };
const product = { id: productId, name: "Test product", status: "ACTIVE", currentStock: 20, reorderLevel: 2, costPrice: new Prisma.Decimal(10), sellingPrice: new Prisma.Decimal(20) };

test("money rejects negative, non-finite, malformed and over-precision values", () => {
  for (const value of ["-1", "", "NaN", "Infinity", "1.001", "1e8", "10000000000", Number.NaN]) assert.equal(money.safeParse(value).success, false, String(value));
  for (const value of [0, "0.01", "9999999999.99"]) assert.equal(money.safeParse(value).success, true);
});

test("duplicate product lines and invalid dates/pagination are rejected", () => {
  assert.equal(saleSchema.safeParse({ ...saleInput, items: [item, item] }).success, false);
  assert.equal(refundSchema.safeParse({ saleId: productId, reason: "Returned", refundMethod: "CASH", items: [{ saleItemId: productId, quantity: 1, condition: "Damaged" }, { saleItemId: productId, quantity: 1, condition: "Damaged" }] }).success, false);
  assert.equal(stockInSchema.safeParse({ referenceNo: "TEST", supplierId: actorId, deliveryDate: "nonsense", items: [{ productId, quantity: 1, unitCost: "5" }] }).success, false);
  for (const input of [{ page: "nope" }, { page: -1 }, { limit: 1000 }, { sortBy: "passwordHash" }]) assert.equal(paginationQuery.safeParse(input).success, false);
});

test("secrets and restricted report summaries/columns are removed recursively", () => {
  const result = serializeForPermissions({ cashier: { fullName: "Cashier", passwordHash: "secret" }, costPrice: "10", rows: [{ cogs: 10, profit: 5, netSales: 15 }], columns: [{ key: "cogs" }, { key: "profit" }, { key: "netSales" }], summary: [{ label: "Gross Profit", value: 5 }, { label: "COGS", value: 10 }, { label: "Net Sales", value: 15 }] }, []);
  assert.deepEqual(result, { cashier: { fullName: "Cashier" }, rows: [{ netSales: 15 }], columns: [{ key: "netSales" }], summary: [{ label: "Net Sales", value: 15 }] });
  assert.deepEqual(stripSecrets({ oldData: { passwordHash: "secret", password: "secret", tokenHash: "secret" }, createdAt: new Date(0), total: new Prisma.Decimal(2) }), { oldData: {}, createdAt: new Date(0), total: new Prisma.Decimal(2) });
});

test("custom roles see only global notifications", () => {
  assert.deepEqual(notificationScope("CUSTOM_ROLE"), { recipientRole: null });
  assert.deepEqual(notificationScope("CASHIER"), { OR: [{ recipientRole: "CASHIER" }, { recipientRole: null }] });
});

test("business day boundaries are Manila-based regardless of host timezone", () => {
  assert.equal(businessDateKey(new Date("2026-10-04T16:30:00Z")), "2026-10-05");
  assert.equal(businessDayStart(new Date("2026-10-04T16:30:00Z")).toISOString(), "2026-10-04T16:00:00.000Z");
});

test("invalid and expired refresh JWTs are rejected before any database lookup", async () => {
  const original = prisma.refreshToken.findMany;
  const lookup = mock.fn(async () => { throw new Error("Must not query"); });
  prisma.refreshToken.findMany = lookup;
  try {
    assert.equal(await findRefreshToken("invalid"), null);
    assert.equal(await findRefreshToken(jwt.sign({ sub: actorId }, env.JWT_REFRESH_SECRET, { expiresIn: -1 })), null);
    const valid = signRefreshToken(actorId);
    const pieces = valid.split(".");
    pieces[1] = Buffer.from(JSON.stringify({ sub: productId })).toString("base64url");
    assert.equal(await findRefreshToken(pieces.join(".")), null);
    assert.equal(lookup.mock.callCount(), 0);
    assert.notEqual(signRefreshToken(actorId), signRefreshToken(actorId));
  } finally { prisma.refreshToken.findMany = original; }
});

test("small adjustments update stock and movement in the same transaction", async () => {
  const writes: unknown[] = [];
  const tx = { $queryRaw: async () => [], product: { findUnique: async () => product, update: async (value: unknown) => { writes.push(value); } }, inventoryAdjustment: { create: async ({ data }: { data: object }) => ({ id: "adjustment", ...data }) }, stockMovement: { create: async (value: unknown) => { writes.push(value); } } };
  const transaction = mock.method(prisma, "$transaction", async (fn: (tx: unknown) => unknown) => fn(tx));
  try {
    const result = await requestAdjustment({ productId, physicalQuantity: 18, reason: "Count correction", requestedById: actorId });
    assert.equal(result.approvalStatus, "APPROVED");
    assert.equal(writes.length, 2);
    assert.deepEqual(writes[0], { where: { id: productId }, data: { currentStock: 18 } });
  } finally { transaction.mock.restore(); }
});

test("large adjustments wait for approval without altering stock", async () => {
  const tx = { $queryRaw: async () => [], product: { findUnique: async () => product }, inventoryAdjustment: { create: async ({ data }: { data: object }) => ({ id: "adjustment", ...data }) } };
  const transaction = mock.method(prisma, "$transaction", async (fn: (tx: unknown) => unknown) => fn(tx));
  try { assert.equal((await requestAdjustment({ productId, physicalQuantity: 0, reason: "Count correction", requestedById: actorId })).approvalStatus, "PENDING"); }
  finally { transaction.mock.restore(); }
});

test("stale physical counts cannot overwrite newer stock", async () => {
  const tx = { $queryRaw: async () => [], product: { findUniqueOrThrow: async () => product }, inventoryAdjustment: { findUnique: async () => ({ productId, approvalStatus: "PENDING", requestedById: productId, systemQuantity: 19 }) } };
  const transaction = mock.method(prisma, "$transaction", async (fn: (tx: unknown) => unknown) => fn(tx));
  try { await assert.rejects(approveAdjustment(productId, actorId), /Stock changed/); }
  finally { transaction.mock.restore(); }
});

test("sale discounts reduce profit and repeated requests reuse the receipt", async () => {
  let saved: Record<string, unknown> | null = null;
  let stockWrites = 0;
  const tx = { $queryRaw: async () => [], sale: { findUnique: async () => saved, create: async ({ data }: { data: Record<string, unknown> }) => { saved = { id: "sale", ...data }; return saved; } }, product: { findUnique: async () => product, update: async () => { stockWrites++; } }, stockMovement: { create: async () => ({}) } };
  const transaction = mock.method(prisma, "$transaction", async (fn: (tx: unknown) => unknown) => fn(tx));
  try {
    const result = await completeSale(saleInput);
    assert.equal(String(result.total), "35"); assert.equal(String(result.grossProfit), "15");
    assert.deepEqual(await completeSale(saleInput), result); assert.equal(stockWrites, 1);
    await assert.rejects(completeSale({ ...saleInput, cashierId: productId }), /already in use/);
  } finally { transaction.mock.restore(); }
});

test("GCash sales require server verification", async () => {
  await assert.rejects(completeSale({ ...saleInput, paymentMethod: "GCASH" }), /verified GCash checkout/);
});

test("provider verification checks owner, payment state, currency, and cart", async () => {
  const previousKey = env.PAYMONGO_SECRET_KEY;
  env.PAYMONGO_SECRET_KEY = "test-only";
  const attributes = { status: "active", metadata: { cashierId: actorId, cartHash: checkoutCartHash([item]) }, payments: [{ attributes: { status: "paid", amount: 4000, currency: "PHP" } }] };
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ data: { id: "cs_test", attributes } }), { status: 200 }));
  try {
    assert.equal(String(await verifyCheckout("cs_test", actorId, [item])), "40");
    await assert.rejects(verifyCheckout("cs_test", productId, [item]), /not found/);
    await assert.rejects(verifyCheckout("cs_test", actorId, [{ ...item, quantity: 3 }]), /cart does not match/);
    attributes.payments[0].attributes.currency = "USD";
    await assert.rejects(verifyCheckout("cs_test", actorId, [item]), /not been confirmed/);
    attributes.payments = [];
    await assert.rejects(verifyCheckout("cs_test", actorId, [item]), /not been confirmed/);
  } finally { fetchMock.mock.restore(); env.PAYMONGO_SECRET_KEY = previousKey; }
});

test("refunds account for previous returned quantities", async () => {
  const tx = { $queryRaw: async () => [], sale: { findUnique: async () => ({ status: "PARTIALLY_REFUNDED", items: [{ id: productId, productId, quantity: 2 }], refunds: [{ items: [{ productId, quantity: 1 }] }] }) } };
  const transaction = mock.method(prisma, "$transaction", async (fn: (tx: unknown) => unknown) => fn(tx));
  try { await assert.rejects(processRefund({ saleId: actorId, reason: "Return", processedById: actorId, refundMethod: "CASH", items: [{ saleItemId: productId, quantity: 2, condition: "Return to inventory" }] }), /exceeds sold quantity/); }
  finally { transaction.mock.restore(); }
});
