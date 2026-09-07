import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { clearSessionCookie, getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    await clearSessionCookie();
    if (session) {
      await writeAudit({
        actor: session,
        action: "LOGOUT",
        entityType: "User",
        entityId: session.id,
      });
    }
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
