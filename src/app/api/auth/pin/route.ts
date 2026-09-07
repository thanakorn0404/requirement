import { NextRequest } from "next/server";
import { handleError, ok, parseBody } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { changePinSchema } from "@/lib/validations/auth";
import { changeOwnPin } from "@/services/user.service";

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    await connectDB();
    const body = await parseBody(request, changePinSchema);
    return ok(await changeOwnPin(session.id, body.currentPin, body.newPin, session));
  } catch (error) {
    return handleError(error);
  }
}
