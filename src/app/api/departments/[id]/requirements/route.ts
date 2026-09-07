import { NextRequest } from "next/server";
import { handleError, ok, parseBody, parsePagination } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertWrite } from "@/lib/permissions";
import { requirementSchema } from "@/lib/validations/requirement";
import { createRequirement, listRequirements } from "@/services/requirement.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireSession();
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    return ok(
      await listRequirements({
        departmentId: id,
        workflowId: searchParams.get("workflowId") || undefined,
        blockId: searchParams.get("blockId") || undefined,
        search: pagination.search,
        page: pagination.page,
        pageSize: pagination.pageSize,
      }),
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    assertWrite(session.role);
    await connectDB();
    const { id } = await params;
    const body = await parseBody(request, requirementSchema);
    return ok(await createRequirement(id, body, session), 201);
  } catch (error) {
    return handleError(error);
  }
}
