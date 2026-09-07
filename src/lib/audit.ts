import { Prisma } from "@prisma/client";
import { asDoc, newId, prisma } from "@/lib/db";
import type { AuditAction, SessionUser } from "@/types";

interface WriteAuditInput {
  actor: SessionUser;
  action: AuditAction | string;
  entityType: string;
  entityId?: string;
  organizationId?: string | null;
  departmentId?: string | null;
  oldData?: unknown;
  newData?: unknown;
}

export async function writeAudit(input: WriteAuditInput) {
  await prisma.auditLog.create({
    data: {
      id: newId(),
      actorId: input.actor.id,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || "",
      organizationId: input.organizationId || null,
      departmentId: input.departmentId || null,
      oldData:
        input.oldData === undefined
          ? undefined
          : (input.oldData as Prisma.InputJsonValue),
      newData:
        input.newData === undefined
          ? undefined
          : (input.newData as Prisma.InputJsonValue),
    },
  });
}

export { asDoc };
