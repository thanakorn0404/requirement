import { NextRequest } from "next/server";
import { fail, handleError, ok, parseBody } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { connectDB, prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await parseBody(request, loginSchema);
    await connectDB();
    const user = await prisma.user.findFirst({
      where: {
        username: body.username.trim().toLowerCase(),
        status: "active",
        deletedAt: null,
      },
    });
    if (!user || !(await verifyPassword(body.pin, user.passwordHash))) {
      return fail("Username หรือ PIN ไม่ถูกต้อง", "INVALID_CREDENTIAL", 401);
    }
    const session = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    const token = await createSessionToken(session, Boolean(body.remember));
    await setSessionCookie(token, Boolean(body.remember));
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await writeAudit({
      actor: session,
      action: "LOGIN",
      entityType: "User",
      entityId: session.id,
    });
    return ok({
      user: session,
      redirectTo: session.role === "ADMIN" ? "/admin" : "/dashboard",
    });
  } catch (error) {
    return handleError(error);
  }
}
