import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { listWorkflows } from "@/services/workflow.service";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    await connectDB();
    const search = new URL(request.url).searchParams.get("search") || "";
    return ok(await listWorkflows(undefined, search));
  } catch (error) {
    return handleError(error);
  }
}
