import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getVersion } from "@/services/workflow.service";

interface Params {
  params: Promise<{ id: string; version: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireSession();
    await connectDB();
    const { id, version } = await params;
    return ok(await getVersion(id, Number(version)));
  } catch (error) {
    return handleError(error);
  }
}
