import { AppError } from "@/lib/api";
import type { UserRole } from "@/types";

export function assertWrite(role: UserRole) {
  if (role !== "ADMIN" && role !== "EDITOR") {
    throw new AppError("บัญชีนี้สามารถดูข้อมูลได้อย่างเดียว", "FORBIDDEN", 403);
  }
}

export function assertAdmin(role: UserRole) {
  if (role !== "ADMIN") {
    throw new AppError("เฉพาะผู้ดูแลระบบเท่านั้น", "FORBIDDEN", 403);
  }
}

export function canManageOrganization(role: UserRole) {
  return role === "ADMIN";
}

export function canRestoreWorkflow(role: UserRole) {
  return role === "ADMIN";
}

export function canViewAudit(role: UserRole) {
  return role === "ADMIN";
}

export function canManageUsers(role: UserRole) {
  return role === "ADMIN";
}
