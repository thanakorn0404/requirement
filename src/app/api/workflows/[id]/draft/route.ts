import { NextRequest } from "next/server";
import { handleError, ok, parseBody } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertWrite } from "@/lib/permissions";
import { draftSaveSchema } from "@/lib/validations/workflow";
import { persistWorkflowGraph } from "@/services/workflow.service";
import { publishWorkflowLive } from "@/lib/workflow-live";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    assertWrite(session.role);
    await connectDB();
    const { id } = await params;
    const body = await parseBody(request, draftSaveSchema);
    const saved = await persistWorkflowGraph(id, body, session);
    publishWorkflowLive(id, {
      type: "graph",
      actorId: session.id,
      actorName: session.name,
      workflow: saved,
    });
    return ok(saved);
  } catch (error) {
    return handleError(error);
  }
}
