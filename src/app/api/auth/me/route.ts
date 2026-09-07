import { NextRequest } from "next/server";
import { fail, handleError, ok } from "@/lib/api";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { connectDB, prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return fail("กรุณาเข้าสู่ระบบ", "UNAUTHORIZED", 401);
    }
    await connectDB();
    const user = await prisma.user.findFirst({
      where: {
        id: session.id,
        status: "active",
        deletedAt: null,
      },
    });
    if (!user) {
      await clearSessionCookie();
      return fail("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", "SESSION_EXPIRED", 401);
    }
    return ok({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return handleError(error);
  }
}
