import { AppError } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { asDoc, newId, notDeleted, prisma } from "@/lib/db";
import { serializeDepartment } from "@/lib/serializers";
import type { SessionUser } from "@/types";

export async function assertOrganizationExists(organizationId: string) {
  const organization = await prisma.organization.findFirst({
    where: { id: organizationId, ...notDeleted },
  });
  if (!organization) {
    throw new AppError("ไม่พบหน่วยงาน", "ORGANIZATION_NOT_FOUND", 404);
  }
  return organization;
}

export async function listDepartments(organizationId: string) {
  await assertOrganizationExists(organizationId);
  const items = await prisma.department.findMany({
    where: { organizationId, ...notDeleted },
    orderBy: { name: "asc" },
  });
  return items.map((item) => serializeDepartment(asDoc(item)));
}

export async function getDepartmentById(id: string) {
  const department = await prisma.department.findFirst({
    where: { id, ...notDeleted },
  });
  if (!department) throw new AppError("ไม่พบกอง / สำนัก", "NOT_FOUND", 404);
  return serializeDepartment(asDoc(department));
}

export async function createDepartment(
  organizationId: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  await assertOrganizationExists(organizationId);
  const created = await prisma.department.create({
    data: {
      id: newId(),
      organizationId,
      name: String(data.name || ""),
      code: String(data.code || ""),
      type: String(data.type || "กอง"),
      description: String(data.description || ""),
      status: String(data.status || "active"),
      createdBy: actor.id,
      updatedBy: actor.id,
    },
  });
  await writeAudit({
    actor,
    action: "CREATE",
    entityType: "Department",
    entityId: created.id,
    organizationId,
    departmentId: created.id,
    newData: serializeDepartment(asDoc(created)),
  });
  return serializeDepartment(asDoc(created));
}

export async function updateDepartment(
  id: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const existing = await prisma.department.findFirst({
    where: { id, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบกอง / สำนัก", "NOT_FOUND", 404);
  const oldData = serializeDepartment(asDoc(existing));
  const updated = await prisma.department.update({
    where: { id },
    data: {
      name: data.name === undefined ? undefined : String(data.name),
      code: data.code === undefined ? undefined : String(data.code),
      type: data.type === undefined ? undefined : String(data.type),
      description: data.description === undefined ? undefined : String(data.description),
      status: data.status === undefined ? undefined : String(data.status),
      updatedBy: actor.id,
    },
  });
  const newData = serializeDepartment(asDoc(updated));
  await writeAudit({
    actor,
    action: "UPDATE",
    entityType: "Department",
    entityId: id,
    organizationId: existing.organizationId,
    departmentId: id,
    oldData,
    newData,
  });
  return newData;
}

export async function deleteDepartment(id: string, actor: SessionUser) {
  const existing = await prisma.department.findFirst({
    where: { id, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบกอง / สำนัก", "NOT_FOUND", 404);
  const updated = await prisma.department.update({
    where: { id },
    data: { status: "deleted", deletedAt: new Date(), updatedBy: actor.id },
  });
  await writeAudit({
    actor,
    action: "DELETE",
    entityType: "Department",
    entityId: id,
    organizationId: existing.organizationId,
    departmentId: id,
    oldData: serializeDepartment(asDoc(updated)),
  });
  return { id };
}

export async function assertDepartmentInOrganization(
  departmentId: string,
  organizationId: string,
) {
  const department = await prisma.department.findFirst({
    where: { id: departmentId, organizationId, ...notDeleted },
  });
  if (!department) {
    throw new AppError("กอง / สำนักไม่อยู่ในหน่วยงานนี้", "INVALID_RELATION", 400);
  }
  return department;
}
