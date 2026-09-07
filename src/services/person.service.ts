import { AppError } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { asDoc, newId, notDeleted, prisma } from "@/lib/db";
import { serializePerson } from "@/lib/serializers";
import { assertPositionInDepartment, getDepartmentContext } from "@/services/position.service";
import type { SessionUser } from "@/types";

export async function listPersons(departmentId: string, search = "") {
  await getDepartmentContext(departmentId);
  const items = await prisma.person.findMany({
    where: {
      departmentId,
      ...notDeleted,
      ...(search
        ? {
            OR: [
              { displayName: { contains: search } },
              { firstName: { contains: search } },
              { lastName: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { displayName: "asc" },
  });
  const positionIds = items.map((item) => item.positionId).filter((id): id is string => Boolean(id));
  const positions = positionIds.length
    ? await prisma.position.findMany({ where: { id: { in: positionIds } } })
    : [];
  const positionMap = Object.fromEntries(positions.map((position) => [position.id, position.name]));
  return items.map((item) =>
    serializePerson(asDoc(item), item.positionId ? positionMap[item.positionId] : undefined),
  );
}

export async function getPersonById(id: string) {
  const person = await prisma.person.findFirst({
    where: { id, ...notDeleted },
  });
  if (!person) throw new AppError("ไม่พบบุคลากร", "NOT_FOUND", 404);
  let positionName: string | undefined;
  if (person.positionId) {
    const position = await prisma.position.findUnique({ where: { id: person.positionId } });
    positionName = position?.name;
  }
  return serializePerson(asDoc(person), positionName);
}

export async function createPerson(
  departmentId: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const department = await getDepartmentContext(departmentId);
  const positionId = data.positionId ? String(data.positionId) : "";
  if (positionId) {
    await assertPositionInDepartment(positionId, departmentId);
  }
  const displayName =
    String(data.displayName || "").trim() ||
    `${String(data.firstName || "")} ${String(data.lastName || "")}`.trim();
  const created = await prisma.person.create({
    data: {
      id: newId(),
      firstName: String(data.firstName || ""),
      lastName: String(data.lastName || ""),
      displayName,
      phone: String(data.phone || ""),
      email: String(data.email || ""),
      description: String(data.description || ""),
      status: String(data.status || "active"),
      positionId: positionId || null,
      organizationId: department.organizationId,
      departmentId,
      createdBy: actor.id,
      updatedBy: actor.id,
    },
  });
  await writeAudit({
    actor,
    action: "CREATE",
    entityType: "Person",
    entityId: created.id,
    organizationId: department.organizationId,
    departmentId,
    newData: serializePerson(asDoc(created)),
  });
  return getPersonById(created.id);
}

export async function updatePerson(
  id: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const existing = await prisma.person.findFirst({
    where: { id, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบบุคลากร", "NOT_FOUND", 404);
  if (data.positionId) {
    await assertPositionInDepartment(String(data.positionId), existing.departmentId);
  }
  const oldData = serializePerson(asDoc(existing));
  const displayName =
    data.firstName || data.lastName || data.displayName
      ? String(data.displayName || existing.displayName || "").trim() ||
        `${String(data.firstName || existing.firstName)} ${String(data.lastName || existing.lastName)}`.trim()
      : undefined;
  const updated = await prisma.person.update({
    where: { id },
    data: {
      firstName: data.firstName === undefined ? undefined : String(data.firstName),
      lastName: data.lastName === undefined ? undefined : String(data.lastName),
      displayName,
      phone: data.phone === undefined ? undefined : String(data.phone),
      email: data.email === undefined ? undefined : String(data.email),
      description: data.description === undefined ? undefined : String(data.description),
      status: data.status === undefined ? undefined : String(data.status),
      positionId:
        data.positionId === undefined
          ? undefined
          : data.positionId === ""
            ? null
            : String(data.positionId),
      updatedBy: actor.id,
    },
  });
  await writeAudit({
    actor,
    action: "UPDATE",
    entityType: "Person",
    entityId: id,
    organizationId: existing.organizationId,
    departmentId: existing.departmentId,
    oldData,
    newData: serializePerson(asDoc(updated)),
  });
  return getPersonById(id);
}

export async function deletePerson(id: string, actor: SessionUser) {
  const existing = await prisma.person.findFirst({
    where: { id, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบบุคลากร", "NOT_FOUND", 404);
  const updated = await prisma.person.update({
    where: { id },
    data: { status: "deleted", deletedAt: new Date(), updatedBy: actor.id },
  });
  await writeAudit({
    actor,
    action: "DELETE",
    entityType: "Person",
    entityId: id,
    organizationId: existing.organizationId,
    departmentId: existing.departmentId,
    oldData: serializePerson(asDoc(updated)),
  });
  return { id };
}

export async function assertPersonInDepartment(personId: string, departmentId: string) {
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      departmentId,
      status: { not: "deleted" },
      deletedAt: null,
    },
  });
  if (!person) {
    throw new AppError("บุคลากรไม่อยู่ในกอง / สำนักนี้", "INVALID_RELATION", 400);
  }
  return person;
}
