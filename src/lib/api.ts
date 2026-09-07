import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export async function parseBody<T>(request: Request, schema: ZodType<T>) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง",
      "VALIDATION_ERROR",
      400,
    );
  }
  return parsed.data;
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, errorCode: string, status = 400) {
  return NextResponse.json({ success: false, message, errorCode }, { status });
}

export class AppError extends Error {
  errorCode: string;
  status: number;

  constructor(message: string, errorCode: string, status = 400) {
    super(message);
    this.errorCode = errorCode;
    this.status = status;
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return fail(error.message, error.errorCode, error.status);
  }
  console.error(error);
  return fail("เกิดข้อผิดพลาดภายในระบบ", "INTERNAL_ERROR", 500);
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") || 20)),
  );
  const search = searchParams.get("search")?.trim() || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
  return { page, pageSize, search, sortBy, sortOrder };
}
