import { asDoc, prisma } from "@/lib/db";
import { serializeAudit } from "@/lib/serializers";

export async function listAuditLogs(params: {
  page: number;
  pageSize: number;
  search?: string;
  action?: string;
}) {
  const where = {
    ...(params.action ? { action: params.action } : {}),
    ...(params.search
      ? {
          OR: [
            { action: { contains: params.search } },
            { entityType: { contains: params.search } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);
  const actors = items.length
    ? await prisma.user.findMany({
        where: { id: { in: items.map((item) => item.actorId) } },
      })
    : [];
  const actorMap = Object.fromEntries(actors.map((item) => [item.id, item.name]));
  return {
    items: items.map((item) => serializeAudit(asDoc(item), actorMap[item.actorId])),
    total,
    page: params.page,
    pageSize: params.pageSize,
  };
}
