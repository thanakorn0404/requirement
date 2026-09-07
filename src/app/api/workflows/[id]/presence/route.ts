import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import {
  leaveWorkflowPresence,
  presenceSnapshot,
  touchWorkflowPresence,
} from "@/lib/workflow-live";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { mode?: string };
    const mode = body.mode === "editing" ? "editing" : "viewing";
    touchWorkflowPresence(id, session, mode);
    return ok(presenceSnapshot(id));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    leaveWorkflowPresence(id, session.id);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
