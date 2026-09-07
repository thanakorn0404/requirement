import { NextRequest } from "next/server";
import { handleError, ok, parseBody } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertWrite } from "@/lib/permissions";
import { updateBlockSchema } from "@/lib/validations/workflow";
import { deleteBlock, getBlockWithRelations, updateBlock } from "@/services/workflow.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireSession();
    await connectDB();
    const { id } = await params;
    return ok(await getBlockWithRelations(id));
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
    const body = await parseBody(request, updateBlockSchema);
    return ok(await updateBlock(id, body, session));
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
    return ok(await deleteBlock(id, session));
  } catch (error) {
    return handleError(error);
  }
}
