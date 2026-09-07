import { asDoc, notDeleted, prisma } from "@/lib/db";
import {
  serializeAudit,
  serializeOrganization,
  serializeRequirement,
  serializeWorkflow,
} from "@/lib/serializers";

export async function getDashboardStats() {
  const [
    organizationCount,
    departmentCount,
    personCount,
    workflowCount,
    requirementCount,
    recentOrganizations,
    recentWorkflows,
    recentRequirements,
    recentActivities,
  ] = await Promise.all([
    prisma.organization.count({ where: notDeleted }),
    prisma.department.count({ where: notDeleted }),
    prisma.person.count({ where: notDeleted }),
    prisma.workflow.count({ where: notDeleted }),
    prisma.requirement.count({ where: { status: { not: "deleted" } } }),
    prisma.organization.findMany({
      where: notDeleted,
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.workflow.findMany({
      where: notDeleted,
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.requirement.findMany({
      where: { status: { not: "deleted" } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const actorIds = recentActivities.map((item) => item.actorId);
  const actors = actorIds.length
    ? await prisma.user.findMany({ where: { id: { in: actorIds } } })
    : [];
  const actorMap = Object.fromEntries(actors.map((item) => [item.id, item.name]));

  return {
    organizationCount,
    departmentCount,
    personCount,
    workflowCount,
    requirementCount,
    recentOrganizations: recentOrganizations.map((item) => serializeOrganization(asDoc(item))),
    recentWorkflows: recentWorkflows.map((item) => serializeWorkflow(asDoc(item))),
    recentRequirements: recentRequirements.map((item) => serializeRequirement(asDoc(item))),
    recentActivities: recentActivities.map((item) =>
      serializeAudit(asDoc(item), actorMap[item.actorId]),
    ),
  };
}
