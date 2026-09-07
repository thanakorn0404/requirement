import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertWrite } from "@/lib/permissions";
import { removeResponsiblePerson } from "@/services/workflow.service";

interface Params {
  params: Promise<{ id: string; personId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    assertWrite(session.role);
    await connectDB();
    const { id, personId } = await params;
    return ok(await removeResponsiblePerson(id, personId, session));
  } catch (error) {
    return handleError(error);
  }
}
