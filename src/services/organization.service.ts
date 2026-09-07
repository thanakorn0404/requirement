import { AppError } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { asDoc, newId, notDeleted, prisma } from "@/lib/db";
import { serializeOrganization } from "@/lib/serializers";
import type { SessionUser } from "@/types";

const sortFields = new Set(["name", "province", "type", "createdAt", "updatedAt"]);

function countMap(rows: Array<{ organizationId: string; _count: { _all: number } }>) {
  return Object.fromEntries(rows.map((row) => [row.organizationId, row._count._all]));
}

export async function listOrganizations(params: {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortOrder: number;
  type?: string;
  province?: string;
  status?: string;
}) {
  const where = {
    ...notDeleted,
    ...(params.type ? { type: params.type } : {}),
    ...(params.province ? { province: params.province } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search } },
            { province: { contains: params.search } },
            { district: { contains: params.search } },
            { subdistrict: { contains: params.search } },
          ],
        }
      : {}),
  };

  const sortField = sortFields.has(params.sortBy) ? params.sortBy : "createdAt";
  const direction = params.sortOrder === 1 ? "asc" : "desc";

  const [items, total, provinceRows] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { [sortField]: direction },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.organization.count({ where }),
    prisma.organization.findMany({
      where: notDeleted,
      distinct: ["province"],
      select: { province: true },
    }),
  ]);

  const ids = items.map((item) => item.id);
  const [departments, persons, workflows, requirements] = ids.length
    ? await Promise.all([
        prisma.department.groupBy({
          by: ["organizationId"],
          where: { organizationId: { in: ids }, ...notDeleted },
          _count: { _all: true },
        }),
        prisma.person.groupBy({
          by: ["organizationId"],
          where: { organizationId: { in: ids }, ...notDeleted },
          _count: { _all: true },
        }),
        prisma.workflow.groupBy({
          by: ["organizationId"],
          where: { organizationId: { in: ids }, ...notDeleted },
          _count: { _all: true },
        }),
        prisma.requirement.groupBy({
          by: ["organizationId"],
          where: { organizationId: { in: ids }, ...notDeleted },
          _count: { _all: true },
        }),
      ])
    : [[], [], [], []];

  const departmentCounts = countMap(departments);
  const personCounts = countMap(persons);
  const workflowCounts = countMap(workflows);
  const requirementCounts = countMap(requirements);

  return {
    items: items.map((item) => ({
      ...serializeOrganization(asDoc(item)),
      departmentCount: departmentCounts[item.id] || 0,
      personCount: personCounts[item.id] || 0,
      workflowCount: workflowCounts[item.id] || 0,
      requirementCount: requirementCounts[item.id] || 0,
    })),
    total,
    page: params.page,
    pageSize: params.pageSize,
    provinces: provinceRows
      .map((row) => row.province)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "th")),
  };
}

export async function getOrganizationById(id: string) {
  const organization = await prisma.organization.findFirst({
    where: { id, ...notDeleted },
  });
  if (!organization) {
    throw new AppError("ไม่พบหน่วยงาน", "NOT_FOUND", 404);
  }

  const [departmentCount, personCount, workflowCount, requirementCount] = await Promise.all([
    prisma.department.count({ where: { organizationId: id, ...notDeleted } }),
    prisma.person.count({ where: { organizationId: id, ...notDeleted } }),
    prisma.workflow.count({ where: { organizationId: id, ...notDeleted } }),
    prisma.requirement.count({ where: { organizationId: id, ...notDeleted } }),
  ]);

  return {
    ...serializeOrganization(asDoc(organization)),
    departmentCount,
    personCount,
    workflowCount,
    requirementCount,
  };
}

function organizationData(data: Record<string, unknown>, actorId?: string) {
  return {
    name: data.name === undefined ? undefined : String(data.name),
    type: data.type === undefined ? undefined : String(data.type),
    province: data.province === undefined ? undefined : String(data.province),
    district: data.district === undefined ? undefined : String(data.district),
    subdistrict: data.subdistrict === undefined ? undefined : String(data.subdistrict),
    address: data.address === undefined ? undefined : String(data.address),
    phone: data.phone === undefined ? undefined : String(data.phone),
    email: data.email === undefined ? undefined : String(data.email),
    description: data.description === undefined ? undefined : String(data.description),
    logoUrl: data.logoUrl === undefined ? undefined : String(data.logoUrl),
    status: data.status === undefined ? undefined : String(data.status),
    updatedBy: actorId,
  };
}

export async function createOrganization(
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const created = await prisma.organization.create({
    data: {
      id: newId(),
      name: String(data.name || ""),
      type: String(data.type || "อื่นๆ"),
      province: String(data.province || ""),
      district: String(data.district || ""),
      subdistrict: String(data.subdistrict || ""),
      address: String(data.address || ""),
      phone: String(data.phone || ""),
      email: String(data.email || ""),
      description: String(data.description || ""),
      logoUrl: String(data.logoUrl || ""),
      status: String(data.status || "active"),
      createdBy: actor.id,
      updatedBy: actor.id,
    },
  });
  await writeAudit({
    actor,
    action: "CREATE",
    entityType: "Organization",
    entityId: created.id,
    organizationId: created.id,
    newData: serializeOrganization(asDoc(created)),
  });
  return serializeOrganization(asDoc(created));
}

export async function updateOrganization(
  id: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const existing = await prisma.organization.findFirst({
    where: { id, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบหน่วยงาน", "NOT_FOUND", 404);
  const oldData = serializeOrganization(asDoc(existing));
  const updated = await prisma.organization.update({
    where: { id },
    data: organizationData(data, actor.id),
  });
  const newData = serializeOrganization(asDoc(updated));
  await writeAudit({
    actor,
    action: "UPDATE",
    entityType: "Organization",
    entityId: id,
    organizationId: id,
    oldData,
    newData,
  });
  return newData;
}

export async function deleteOrganization(id: string, actor: SessionUser) {
  const existing = await prisma.organization.findFirst({
    where: { id, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบหน่วยงาน", "NOT_FOUND", 404);
  const updated = await prisma.organization.update({
    where: { id },
    data: { status: "deleted", deletedAt: new Date(), updatedBy: actor.id },
  });
  await writeAudit({
    actor,
    action: "DELETE",
    entityType: "Organization",
    entityId: id,
    organizationId: id,
    oldData: serializeOrganization(asDoc(updated)),
  });
  return { id };
}
