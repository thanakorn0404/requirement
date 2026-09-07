import { NextRequest } from "next/server";
import { handleError, ok, parseBody } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertAdmin } from "@/lib/permissions";
import { updateOrganizationSchema } from "@/lib/validations/organization";
import {
  deleteOrganization,
  getOrganizationById,
  updateOrganization,
} from "@/services/organization.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireSession();
    await connectDB();
    const { id } = await params;
    return ok(await getOrganizationById(id));
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    assertAdmin(session.role);
    await connectDB();
    const { id } = await params;
    const body = await parseBody(request, updateOrganizationSchema);
    return ok(await updateOrganization(id, body, session));
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
    return ok(await deleteOrganization(id, session));
  } catch (error) {
    return handleError(error);
  }
}
