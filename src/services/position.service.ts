import { AppError } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { asDoc, newId, notDeleted, prisma } from "@/lib/db";
import { serializePosition } from "@/lib/serializers";
import type { SessionUser } from "@/types";

export async function getDepartmentContext(departmentId: string) {
  const department = await prisma.department.findFirst({
    where: { id: departmentId, ...notDeleted },
  });
  if (!department) throw new AppError("ไม่พบกอง / สำนัก", "NOT_FOUND", 404);
  return department;
}

export async function listPositions(departmentId: string) {
  await getDepartmentContext(departmentId);
  const items = await prisma.position.findMany({
    where: { departmentId, ...notDeleted },
    orderBy: [{ level: "asc" }, { name: "asc" }],
  });
  return items.map((item) => serializePosition(asDoc(item)));
}

export async function createPosition(
  departmentId: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const department = await getDepartmentContext(departmentId);
  const created = await prisma.position.create({
    data: {
      id: newId(),
      departmentId,
      name: String(data.name || ""),
      code: String(data.code || ""),
      level: Number(data.level || 0),
      description: String(data.description || ""),
      status: String(data.status || "active"),
      createdBy: actor.id,
      updatedBy: actor.id,
    },
  });
  await writeAudit({
    actor,
    action: "CREATE",
    entityType: "Position",
    entityId: created.id,
    organizationId: department.organizationId,
    departmentId,
    newData: serializePosition(asDoc(created)),
  });
  return serializePosition(asDoc(created));
}

export async function updatePosition(
  id: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const existing = await prisma.position.findFirst({
    where: { id, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบตำแหน่ง", "NOT_FOUND", 404);
  const department = await getDepartmentContext(existing.departmentId);
  const oldData = serializePosition(asDoc(existing));
  const updated = await prisma.position.update({
    where: { id },
    data: {
      name: data.name === undefined ? undefined : String(data.name),
      code: data.code === undefined ? undefined : String(data.code),
      level: data.level === undefined ? undefined : Number(data.level),
      description: data.description === undefined ? undefined : String(data.description),
      status: data.status === undefined ? undefined : String(data.status),
      updatedBy: actor.id,
    },
  });
  const newData = serializePosition(asDoc(updated));
  await writeAudit({
    actor,
    action: "UPDATE",
    entityType: "Position",
    entityId: id,
    organizationId: department.organizationId,
    departmentId: existing.departmentId,
    oldData,
    newData,
  });
  return newData;
}

export async function deletePosition(id: string, actor: SessionUser) {
  const existing = await prisma.position.findFirst({
    where: { id, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบตำแหน่ง", "NOT_FOUND", 404);
  const department = await getDepartmentContext(existing.departmentId);
  const updated = await prisma.position.update({
    where: { id },
    data: { status: "deleted", deletedAt: new Date(), updatedBy: actor.id },
  });
  await writeAudit({
    actor,
    action: "DELETE",
    entityType: "Position",
    entityId: id,
    organizationId: department.organizationId,
    departmentId: existing.departmentId,
    oldData: serializePosition(asDoc(updated)),
  });
  return { id };
}

export async function assertPositionInDepartment(positionId: string, departmentId: string) {
  const position = await prisma.position.findFirst({
    where: { id: positionId, departmentId, ...notDeleted },
  });
  if (!position) {
    throw new AppError("ตำแหน่งไม่อยู่ในกอง / สำนักนี้", "INVALID_RELATION", 400);
  }
  return position;
}
