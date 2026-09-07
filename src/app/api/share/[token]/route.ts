import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getPublicWorkflowByToken } from "@/services/workflow.service";

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { token } = await params;
    return ok(await getPublicWorkflowByToken(token));
  } catch (error) {
    return handleError(error);
  }
}
