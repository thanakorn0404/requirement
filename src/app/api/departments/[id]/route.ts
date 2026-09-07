import { NextRequest } from "next/server";
import { handleError, ok, parseBody } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertWrite } from "@/lib/permissions";
import { updateDepartmentSchema } from "@/lib/validations/department";
import {
  deleteDepartment,
  getDepartmentById,
  updateDepartment,
} from "@/services/department.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireSession();
    await connectDB();
    const { id } = await params;
    return ok(await getDepartmentById(id));
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    assertWrite(session.role);
    await connectDB();
    const { id } = await params;
    const body = await parseBody(request, updateDepartmentSchema);
    return ok(await updateDepartment(id, body, session));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    assertWrite(session.role);
    await connectDB();
    const { id } = await params;
    return ok(await deleteDepartment(id, session));
  } catch (error) {
    return handleError(error);
  }
}
