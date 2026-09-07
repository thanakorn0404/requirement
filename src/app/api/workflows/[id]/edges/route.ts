import { NextRequest } from "next/server";
import { handleError, ok, parseBody } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertWrite } from "@/lib/permissions";
import { edgeSchema } from "@/lib/validations/workflow";
import { createEdge, getWorkflowFull } from "@/services/workflow.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireSession();
    await connectDB();
    const { id } = await params;
    const full = await getWorkflowFull(id);
    return ok(full.edges);
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
    const body = await parseBody(request, edgeSchema);
    return ok(await createEdge(id, body, session), 201);
  } catch (error) {
    return handleError(error);
  }
}
