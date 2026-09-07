import type { ApiResponse } from "@/types";

export class ClientApiError extends Error {
  errorCode: string;
  status: number;

  constructor(message: string, errorCode: string, status: number) {
    super(message);
    this.errorCode = errorCode;
    this.status = status;
  }
}

export async function api<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ClientApiError("ไม่สามารถอ่านผลลัพธ์จากเซิร์ฟเวอร์", "PARSE_ERROR", response.status);
  }

  if (!payload.success) {
    throw new ClientApiError(
      payload.message || "เกิดข้อผิดพลาด",
      payload.errorCode || "REQUEST_FAILED",
      response.status,
    );
  }

  return payload.data;
}

export function buildQuery(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}
