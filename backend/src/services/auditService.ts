import { prisma } from "../config/prisma.js";
import { stripSecrets } from "../rbac/serializers.js";

export async function audit(input: {
  userId?: string;
  action: string;
  module: string;
  recordId?: string;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      module: input.module,
      recordId: input.recordId,
      oldData: input.oldData === undefined ? undefined : JSON.parse(JSON.stringify(stripSecrets(input.oldData))),
      newData: input.newData === undefined ? undefined : JSON.parse(JSON.stringify(stripSecrets(input.newData))),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    }
  });
}
