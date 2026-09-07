import { NextRequest } from "next/server";
import { handleError, ok, parseBody } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertAdmin } from "@/lib/permissions";
import { updateUserSchema } from "@/lib/validations/auth";
import { deleteUser, updateUser } from "@/services/user.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    assertAdmin(session.role);
    await connectDB();
    const { id } = await params;
    const body = await parseBody(request, updateUserSchema);
    return ok(await updateUser(id, body, session));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    assertAdmin(session.role);
    await connectDB();
    const { id } = await params;
    return ok(await deleteUser(id, session));
  } catch (error) {
    return handleError(error);
  }
}
