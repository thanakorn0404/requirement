import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { validateWorkflowGraph } from "@/services/workflow.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    await requireSession();
    await connectDB();
    const { id } = await params;
    return ok(await validateWorkflowGraph(id));
  } catch (error) {
    return handleError(error);
  }
}
