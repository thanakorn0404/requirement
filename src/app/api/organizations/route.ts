import { NextRequest } from "next/server";
import { handleError, ok, parseBody, parsePagination } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertAdmin } from "@/lib/permissions";
import { organizationSchema } from "@/lib/validations/organization";
import {
  createOrganization,
  listOrganizations,
} from "@/services/organization.service";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    await connectDB();
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    return ok(
      await listOrganizations({
        ...pagination,
        type: searchParams.get("type") || undefined,
        province: searchParams.get("province") || undefined,
        status: searchParams.get("status") || undefined,
      }),
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    assertAdmin(session.role);
    await connectDB();
    const body = await parseBody(request, organizationSchema);
    return ok(await createOrganization(body, session), 201);
  } catch (error) {
    return handleError(error);
  }
}
