import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertAdmin } from "@/lib/permissions";
import { restoreVersion } from "@/services/workflow.service";

interface Params {
  params: Promise<{ id: string; version: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    assertAdmin(session.role);
    await connectDB();
    const { id, version } = await params;
    return ok(await restoreVersion(id, Number(version), session));
  } catch (error) {
    return handleError(error);
  }
}
