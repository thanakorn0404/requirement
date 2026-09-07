import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getWorkflowFull } from "@/services/workflow.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireSession();
    await connectDB();
    const { id } = await params;
    return ok(await getWorkflowFull(id));
  } catch (error) {
    return handleError(error);
  }
}
