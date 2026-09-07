import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isObjectId(value: string) {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

export function toId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const record = value as { _id?: unknown; id?: unknown };
    if (record._id) return String(record._id);
    if (record.id) return String(record.id);
  }
  return String(value);
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateShort(value?: string | Date | null) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  wait = 400,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  EDITOR: "ผู้แก้ไข",
  VIEWER: "ผู้ดูข้อมูล",
};

export const ORG_TYPE_LABEL: Record<string, string> = {
  "อบต.": "อบต.",
  เทศบาลตำบล: "เทศบาลตำบล",
  เทศบาลเมือง: "เทศบาลเมือง",
  เทศบาลนคร: "เทศบาลนคร",
  อื่นๆ: "อื่นๆ",
};

export const STATUS_LABEL: Record<string, string> = {
  active: "เปิดใช้งาน",
  inactive: "ปิดใช้งาน",
  deleted: "ลบแล้ว",
  draft: "ร่าง",
  review: "รอตรวจ",
  approved: "อนุมัติ",
  implemented: "ดำเนินการแล้ว",
  rejected: "ปฏิเสธ",
  archived: "เก็บถาวร",
};

export const PRIORITY_LABEL: Record<string, string> = {
  low: "ต่ำ",
  medium: "ปานกลาง",
  high: "สูง",
  critical: "เร่งด่วน",
};

export const CATEGORY_LABEL: Record<string, string> = {
  functional: "Functional",
  non_functional: "Non-Functional",
  business: "Business",
  technical: "Technical",
  security: "Security",
  performance: "Performance",
  integration: "Integration",
  user_experience: "User Experience",
  report: "Report",
  workflow: "Workflow",
};

export const BLOCK_TYPE_LABEL: Record<string, string> = {
  work: "งาน",
  position: "ตำแหน่ง",
  duty: "หน้าที่",
  person: "บุคลากร",
  document: "เอกสาร",
  approval: "อนุมัติ",
  condition: "เงื่อนไข",
  department: "กอง / สำนัก",
  start: "เริ่มต้น",
  end: "สิ้นสุด",
};

export function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(headers: string[], rows: unknown[][]) {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ];
  return `\uFEFF${lines.join("\n")}`;
}
