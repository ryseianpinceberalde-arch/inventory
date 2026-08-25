import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

export function signAccessToken(user: { id: string; role: string; email: string; fullName: string }) {
  const options: SignOptions = { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, fullName: user.fullName },
    env.JWT_ACCESS_SECRET,
    options
  );
}

export function signRefreshToken(userId: string) {
  const options: SignOptions = { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, options);
}

export async function persistRefreshToken(userId: string, token: string) {
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
}

export async function findRefreshToken(rawToken: string) {
  const active = await prisma.refreshToken.findMany({
    where: { revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } }
  });
  for (const stored of active) {
    if (await bcrypt.compare(rawToken, stored.tokenHash)) return stored;
  }
  return null;
}
