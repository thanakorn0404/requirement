import { NextRequest } from "next/server";
import { handleError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import {
  presenceSnapshot,
  subscribeWorkflowLive,
  touchWorkflowPresence,
} from "@/lib/workflow-live";

interface Params {
  params: Promise<{ id: string }>;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const encoder = new TextEncoder();
    const listenerId = `${session.id}:${crypto.randomUUID()}`;

    const stream = new ReadableStream({
      start(controller) {
        const send = (event: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };
        const unsubscribe = subscribeWorkflowLive(id, listenerId, send);
        touchWorkflowPresence(id, session, "viewing");
        send(presenceSnapshot(id));
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
