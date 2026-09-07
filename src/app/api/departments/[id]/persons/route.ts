import { NextRequest } from "next/server";
import { handleError, ok, parseBody } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertWrite } from "@/lib/permissions";
import { personSchema } from "@/lib/validations/person";
import { createPerson, listPersons } from "@/services/person.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireSession();
    await connectDB();
    const { id } = await params;
    const search = new URL(request.url).searchParams.get("search") || "";
    return ok(await listPersons(id, search));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    assertWrite(session.role);
    await connectDB();
    const { id } = await params;
    const body = await parseBody(request, personSchema);
    return ok(await createPerson(id, body, session), 201);
  } catch (error) {
    return handleError(error);
  }
}
