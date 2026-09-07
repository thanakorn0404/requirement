import { NextRequest } from "next/server";
import { handleError, ok, parsePagination } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertAdmin } from "@/lib/permissions";
import { listAuditLogs } from "@/services/audit.service";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    assertAdmin(session.role);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    return ok(
      await listAuditLogs({
        ...pagination,
        action: searchParams.get("action") || undefined,
      }),
    );
  } catch (error) {
    return handleError(error);
  }
}
