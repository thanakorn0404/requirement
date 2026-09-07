import { AppError } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { asDoc, newId, notDeleted, prisma } from "@/lib/db";
import { serializeRequirement } from "@/lib/serializers";
import { getDepartmentContext } from "@/services/position.service";
import type { SessionUser } from "@/types";

async function nextRequirementCode(departmentId: string) {
  const count = await prisma.requirement.count({ where: { departmentId } });
  return `REQ-${String(count + 1).padStart(3, "0")}`;
}

async function assertRelations(departmentId: string, data: Record<string, unknown>) {
  const department = await getDepartmentContext(departmentId);
  if (data.workflowId) {
    const workflow = await prisma.workflow.findFirst({
      where: { id: String(data.workflowId), departmentId, ...notDeleted },
    });
    if (!workflow) throw new AppError("การเดินหนังสือไม่อยู่ในกองนี้", "INVALID_RELATION", 400);
  }
  if (data.blockId) {
    const block = await prisma.workflowBlock.findFirst({
      where: { id: String(data.blockId), ...notDeleted },
    });
    if (!block) throw new AppError("ไม่พบงาน / ตำแหน่ง / หน้าที่", "INVALID_RELATION", 400);
    if (data.workflowId && block.workflowId !== String(data.workflowId)) {
      throw new AppError("Block ไม่อยู่ใน Workflow ที่เลือก", "INVALID_RELATION", 400);
    }
  }
  if (data.responsiblePersonId) {
    const person = await prisma.person.findFirst({
      where: {
        id: String(data.responsiblePersonId),
        departmentId,
        status: { not: "deleted" },
      },
    });
    if (!person) throw new AppError("บุคลากรไม่อยู่ในกองนี้", "INVALID_RELATION", 400);
  }
  if (data.positionId) {
    const position = await prisma.position.findFirst({
      where: { id: String(data.positionId), departmentId, ...notDeleted },
    });
    if (!position) throw new AppError("ตำแหน่งไม่อยู่ในกองนี้", "INVALID_RELATION", 400);
  }
  return department;
}

async function enrichRequirement(doc: Record<string, unknown>) {
  const base = serializeRequirement(doc);
  const [organization, department, workflow, block, person, position] = await Promise.all([
    prisma.organization.findUnique({ where: { id: base.organizationId } }),
    prisma.department.findUnique({ where: { id: base.departmentId } }),
    base.workflowId ? prisma.workflow.findUnique({ where: { id: base.workflowId } }) : null,
    base.blockId ? prisma.workflowBlock.findUnique({ where: { id: base.blockId } }) : null,
    base.responsiblePersonId
      ? prisma.person.findUnique({ where: { id: base.responsiblePersonId } })
      : null,
    base.positionId ? prisma.position.findUnique({ where: { id: base.positionId } }) : null,
  ]);
  return {
    ...base,
    organizationName: organization?.name,
    departmentName: department?.name,
    workflowName: workflow?.name,
    blockTitle: block?.title,
    personName: person?.displayName,
    positionName: position?.name,
  };
}

export async function listRequirements(params: {
  departmentId?: string;
  organizationId?: string;
  workflowId?: string;
  blockId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const where = {
    status: { not: "deleted" },
    ...(params.departmentId ? { departmentId: params.departmentId } : {}),
    ...(params.organizationId ? { organizationId: params.organizationId } : {}),
    ...(params.workflowId ? { workflowId: params.workflowId } : {}),
    ...(params.blockId ? { blockId: params.blockId } : {}),
    ...(params.search
      ? {
          OR: [
            { title: { contains: params.search } },
            { requirementCode: { contains: params.search } },
          ],
        }
      : {}),
  };
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const [items, total] = await Promise.all([
    prisma.requirement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.requirement.count({ where }),
  ]);
  return {
    items: await Promise.all(items.map((item) => enrichRequirement(asDoc(item)))),
    total,
    page,
    pageSize,
  };
}

export async function getRequirementById(id: string) {
  const item = await prisma.requirement.findFirst({
    where: { id, status: { not: "deleted" } },
  });
  if (!item) throw new AppError("ไม่พบความต้องการของระบบ", "NOT_FOUND", 404);
  return enrichRequirement(asDoc(item));
}

function optionalId(value: unknown) {
  if (value === undefined) return undefined;
  if (value === "" || value === null) return null;
  return String(value);
}

export async function createRequirement(
  departmentId: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const department = await assertRelations(departmentId, data);
  const requirementCode =
    String(data.requirementCode || "").trim() || (await nextRequirementCode(departmentId));
  const created = await prisma.requirement.create({
    data: {
      id: newId(),
      requirementCode,
      title: String(data.title || ""),
      category: String(data.category || "workflow"),
      description: String(data.description || ""),
      input: String(data.input || ""),
      process: String(data.process || ""),
      output: String(data.output || ""),
      relatedDocuments: String(data.relatedDocuments || ""),
      currentProblem: String(data.currentProblem || ""),
      desiredBehavior: String(data.desiredBehavior || ""),
      priority: String(data.priority || "medium"),
      status: String(data.status || "draft"),
      note: String(data.note || ""),
      workflowId: optionalId(data.workflowId) ?? null,
      blockId: optionalId(data.blockId) ?? null,
      responsiblePersonId: optionalId(data.responsiblePersonId) ?? null,
      positionId: optionalId(data.positionId) ?? null,
      organizationId: department.organizationId,
      departmentId,
      createdBy: actor.id,
      updatedBy: actor.id,
    },
  });
  await writeAudit({
    actor,
    action: "CREATE_REQUIREMENT",
    entityType: "Requirement",
    entityId: created.id,
    organizationId: department.organizationId,
    departmentId,
    newData: serializeRequirement(asDoc(created)),
  });
  return getRequirementById(created.id);
}

export async function updateRequirement(
  id: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const existing = await prisma.requirement.findFirst({
    where: { id, status: { not: "deleted" } },
  });
  if (!existing) throw new AppError("ไม่พบความต้องการของระบบ", "NOT_FOUND", 404);
  await assertRelations(existing.departmentId, {
    ...existing,
    ...data,
  });
  const oldData = serializeRequirement(asDoc(existing));
  const updated = await prisma.requirement.update({
    where: { id },
    data: {
      title: data.title === undefined ? undefined : String(data.title),
      requirementCode:
        data.requirementCode === undefined ? undefined : String(data.requirementCode),
      category: data.category === undefined ? undefined : String(data.category),
      description: data.description === undefined ? undefined : String(data.description),
      input: data.input === undefined ? undefined : String(data.input),
      process: data.process === undefined ? undefined : String(data.process),
      output: data.output === undefined ? undefined : String(data.output),
      relatedDocuments:
        data.relatedDocuments === undefined ? undefined : String(data.relatedDocuments),
      currentProblem: data.currentProblem === undefined ? undefined : String(data.currentProblem),
      desiredBehavior:
        data.desiredBehavior === undefined ? undefined : String(data.desiredBehavior),
      priority: data.priority === undefined ? undefined : String(data.priority),
      status: data.status === undefined ? undefined : String(data.status),
      note: data.note === undefined ? undefined : String(data.note),
      workflowId: optionalId(data.workflowId),
      blockId: optionalId(data.blockId),
      responsiblePersonId: optionalId(data.responsiblePersonId),
      positionId: optionalId(data.positionId),
      updatedBy: actor.id,
      orphaned: data.blockId ? false : existing.orphaned,
    },
  });
  await writeAudit({
    actor,
    action: "UPDATE_REQUIREMENT",
    entityType: "Requirement",
    entityId: id,
    organizationId: existing.organizationId,
    departmentId: existing.departmentId,
    oldData,
    newData: serializeRequirement(asDoc(updated)),
  });
  return getRequirementById(id);
}

export async function deleteRequirement(id: string, actor: SessionUser) {
  const existing = await prisma.requirement.findFirst({
    where: { id, status: { not: "deleted" } },
  });
  if (!existing) throw new AppError("ไม่พบความต้องการของระบบ", "NOT_FOUND", 404);
  const updated = await prisma.requirement.update({
    where: { id },
    data: { status: "deleted", deletedAt: new Date(), updatedBy: actor.id },
  });
  await writeAudit({
    actor,
    action: "DELETE_REQUIREMENT",
    entityType: "Requirement",
    entityId: id,
    organizationId: existing.organizationId,
    departmentId: existing.departmentId,
    oldData: serializeRequirement(asDoc(updated)),
  });
  return { id };
}
