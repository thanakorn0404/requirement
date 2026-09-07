import { NextRequest } from "next/server";
import { handleError, ok, parseBody } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertWrite } from "@/lib/permissions";
import { responsibleSchema } from "@/lib/validations/workflow";
import { addResponsiblePersons, getBlockWithRelations } from "@/services/workflow.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireSession();
    await connectDB();
    const { id } = await params;
    const block = await getBlockWithRelations(id);
    return ok(block.responsiblePersons);
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
    const body = await parseBody(request, responsibleSchema);
    return ok(
      await addResponsiblePersons(
        id,
        body.personIds,
        body.responsibility || "",
        session,
        body.responsibilities as Record<string, string> | undefined,
      ),
    );
  } catch (error) {
    return handleError(error);
  }
}
