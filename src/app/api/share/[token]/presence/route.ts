import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import {
  leaveWorkflowPresence,
  presenceSnapshot,
  touchWorkflowPresence,
} from "@/lib/workflow-live";
import { getWorkflowIdByShareToken } from "@/services/workflow.service";

interface Params {
  params: Promise<{ token: string }>;
}

function guestFromBody(body: { guestId?: string; guestName?: string }) {
  return {
    id: body.guestId || `guest_${crypto.randomUUID()}`,
    name: body.guestName || "ผู้ชม",
    role: "VIEWER" as const,
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { token } = await params;
    const workflowId = await getWorkflowIdByShareToken(token);
    const body = (await request.json().catch(() => ({}))) as {
      guestId?: string;
      guestName?: string;
    };
    const guest = guestFromBody(body);
    touchWorkflowPresence(workflowId, guest, "viewing");
    return ok({ ...presenceSnapshot(workflowId), guest });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { token } = await params;
    const workflowId = await getWorkflowIdByShareToken(token);
    const guestId = request.nextUrl.searchParams.get("guestId");
    if (guestId) {
      leaveWorkflowPresence(workflowId, guestId);
    }
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
