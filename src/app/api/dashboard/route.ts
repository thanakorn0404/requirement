import { handleError, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getDashboardStats } from "@/services/dashboard.service";

export async function GET() {
  try {
    await requireSession();
    await connectDB();
    return ok(await getDashboardStats());
  } catch (error) {
    return handleError(error);
  }
}
