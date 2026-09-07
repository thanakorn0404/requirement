import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const notDeleted = {
  status: { not: "deleted" },
  deletedAt: null,
};

export function newId() {
  return randomBytes(12).toString("hex");
}

export function newShareToken() {
  return randomBytes(18).toString("base64url");
}

export function isId(value: string) {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

export function asDoc<T extends { id: string }>(row: T): Record<string, unknown> {
  return { ...row, _id: row.id };
}

export async function connectDB() {
  if (!process.env.DATABASE_URL) {
    throw new Error("กรุณากำหนด DATABASE_URL ใน Environment Variables");
  }
  await prisma.$connect();
  return prisma;
}
