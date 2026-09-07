import { NextRequest } from "next/server";
import { handleError, ok, parsePagination } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { listRequirements } from "@/services/requirement.service";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    await connectDB();
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    return ok(
      await listRequirements({
        organizationId: searchParams.get("organizationId") || undefined,
        departmentId: searchParams.get("departmentId") || undefined,
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
