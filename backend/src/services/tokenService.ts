import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { createHash, randomUUID } from "node:crypto";

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
  return jwt.sign({ sub: userId, jti: randomUUID() }, env.JWT_REFRESH_SECRET, options);
}

export async function persistRefreshToken(userId: string, token: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  const expiresAt = new Date(payload.exp! * 1000);
  await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
}

export async function findRefreshToken(rawToken: string) {
  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(rawToken, env.JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
    if (typeof decoded === "string" || !decoded.sub) return null;
    payload = decoded;
  } catch { return null; }
  const digest = createHash("sha256").update(rawToken).digest("hex");
  const active = await prisma.refreshToken.findMany({
    where: { userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() }, OR: [{ tokenHash: digest }, { tokenHash: { startsWith: "$2" } }] },
    include: { user: { include: { permissions: { include: { permission: true } }, role: { include: { rolePermissions: { include: { permission: true } } } } } } }
  });
  for (const stored of active) {
    if (stored.tokenHash === digest || (stored.tokenHash.startsWith("$2") && await bcrypt.compare(rawToken, stored.tokenHash))) return stored;
  }
  return null;
}
