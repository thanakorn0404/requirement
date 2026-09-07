import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { asDoc, connectDB, notDeleted, prisma } from "@/lib/db";
import { serializeOrganization, serializeRequirement, serializeWorkflow } from "@/lib/serializers";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    await connectDB();
    const query = new URL(request.url).searchParams.get("q")?.trim() || "";
    if (query.length < 2) {
      return ok({ organizations: [], workflows: [], requirements: [] });
    }

    const [organizations, workflows, requirements] = await Promise.all([
      prisma.organization.findMany({
        where: {
          ...notDeleted,
          OR: [
            { name: { contains: query } },
            { province: { contains: query } },
            { district: { contains: query } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.workflow.findMany({
        where: { ...notDeleted, name: { contains: query } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.requirement.findMany({
        where: {
          status: { not: "deleted" },
          OR: [
            { title: { contains: query } },
            { requirementCode: { contains: query } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    return ok({
      organizations: organizations.map((item) => serializeOrganization(asDoc(item))),
      workflows: workflows.map((item) => serializeWorkflow(asDoc(item))),
      requirements: requirements.map((item) => serializeRequirement(asDoc(item))),
    });
  } catch (error) {
    return handleError(error);
  }
}
