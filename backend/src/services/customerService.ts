import { Prisma, ProductStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

type CustomerInput = {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
};

function normalizedPhone(value: string) {
  return value.replace(/\D/g, "");
}

async function ensurePhoneAvailable(tx: Prisma.TransactionClient, phone: string, excludingId?: string) {
  const normalized = normalizedPhone(phone);
  if (normalized.length < 7) throw new AppError("Enter a valid phone number.", 422);
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${normalized}))`;
  const matches = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Customer"
    WHERE regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = ${normalized}
      AND (${excludingId ?? null}::uuid IS NULL OR id <> ${excludingId ?? null}::uuid)
    LIMIT 1
  `;
  if (matches.length) throw new AppError("A customer with this phone number already exists.", 409);
}

export async function createCustomer(input: CustomerInput) {
  return prisma.$transaction(async (tx) => {
    await ensurePhoneAvailable(tx, input.phone);
    return tx.customer.create({
      data: {
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
        customerType: "Member",
        loyaltyPoints: 0
      }
    });
  });
}

export function buildAnonymousMemberData() {
  const id = randomUUID();
  return {
    id,
    fullName: `Anonymous Member ${id.slice(0, 8).toUpperCase()}`,
    customerType: "Member",
    loyaltyPoints: 0
  };
}

export async function createAnonymousMember() {
  return prisma.customer.create({ data: buildAnonymousMemberData() });
}

export async function updateCustomer(id: string, input: Partial<CustomerInput>) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${id}::uuid FOR UPDATE`;
    const existing = await tx.customer.findUnique({ where: { id } });
    if (!existing) throw new AppError("Customer not found", 404);
    if (input.phone !== undefined) await ensurePhoneAvailable(tx, input.phone, id);
    return tx.customer.update({
      where: { id },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName.trim() } : {}),
        ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
        ...(input.email !== undefined ? { email: input.email.trim() || null } : {}),
        ...(input.address !== undefined ? { address: input.address.trim() || null } : {}),
      }
    });
  });
}

export async function setCustomerStatus(id: string, status: ProductStatus) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new AppError("Customer not found", 404);
  return prisma.customer.update({ where: { id }, data: { status } });
}

export async function adjustCustomerPoints(id: string, pointsDelta: number, reason: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${id}::uuid FOR UPDATE`;
    const customer = await tx.customer.findUnique({ where: { id }, select: { loyaltyPoints: true } });
    if (!customer) throw new AppError("Customer not found", 404);
    const nextBalance = customer.loyaltyPoints + pointsDelta;
    if (nextBalance < 0) throw new AppError("The adjustment cannot reduce the balance below zero.", 409);
    if (nextBalance > 2_147_483_647) throw new AppError("The adjustment exceeds the customer's points balance limit.", 422);
    await tx.customer.update({ where: { id }, data: { loyaltyPoints: { increment: pointsDelta } } });
    const transaction = await tx.loyaltyTransaction.create({
      data: { customerId: id, transactionType: "ADJUSTMENT", pointsEarned: pointsDelta, pointsRedeemed: 0, note: reason.trim() }
    });
    return { transaction, loyaltyPoints: nextBalance };
  });
}
