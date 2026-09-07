import { NextRequest } from "next/server";
import { handleError, ok, parseBody } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertAdmin } from "@/lib/permissions";
import { createUserSchema } from "@/lib/validations/auth";
import { createUser, listUsers } from "@/services/user.service";

export async function GET() {
  try {
    const session = await requireSession();
    assertAdmin(session.role);
    await connectDB();
    return ok(await listUsers());
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    assertAdmin(session.role);
    await connectDB();
    const body = await parseBody(request, createUserSchema);
    return ok(await createUser(body, session), 201);
  } catch (error) {
    return handleError(error);
  }
}
