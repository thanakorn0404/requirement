import { NextRequest } from "next/server";
import { handleError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import {
  presenceSnapshot,
  subscribeWorkflowLive,
  touchWorkflowPresence,
} from "@/lib/workflow-live";
import { getWorkflowIdByShareToken } from "@/services/workflow.service";

interface Params {
  params: Promise<{ token: string }>;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { token } = await params;
    const workflowId = await getWorkflowIdByShareToken(token);
    const guestId = request.nextUrl.searchParams.get("guestId") || `guest_${crypto.randomUUID()}`;
    const guestName = request.nextUrl.searchParams.get("guestName") || "ผู้ชม";
    const encoder = new TextEncoder();
    const listenerId = `${guestId}:${crypto.randomUUID()}`;

    const stream = new ReadableStream({
      start(controller) {
        const send = (event: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };
        const unsubscribe = subscribeWorkflowLive(workflowId, listenerId, send);
        touchWorkflowPresence(
          workflowId,
          { id: guestId, name: guestName, role: "VIEWER" },
          "viewing",
        );
        send(presenceSnapshot(workflowId));
        const ping = setInterval(() => send({ type: "ping" }), 15000);
        const close = () => {
          clearInterval(ping);
          unsubscribe();
          try {
            controller.close();
          } catch {
            // ปิดไปแล้ว
          }
        };
        request.signal.addEventListener("abort", close);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
