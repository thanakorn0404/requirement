import { AppError } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { createPinLookup, hashPassword, verifyPassword } from "@/lib/auth";
import { asDoc, newId, notDeleted, prisma } from "@/lib/db";
import { serializeUser } from "@/lib/serializers";
import type { SessionUser } from "@/types";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

async function assertUniqueUsername(username: string, excludeId?: string) {
  const exists = await prisma.user.findFirst({
    where: {
      username: normalizeUsername(username),
      ...notDeleted,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (exists) {
    throw new AppError("Username นี้ถูกใช้แล้ว", "DUPLICATE_USERNAME", 400);
  }
}

export async function listUsers() {
  const items = await prisma.user.findMany({
    where: notDeleted,
    orderBy: { createdAt: "desc" },
  });
  return items.map((item) => serializeUser(asDoc(item)));
}

export async function createUser(
  data: {
    name: string;
    username: string;
    email: string;
    pin: string;
    role: string;
    status?: string;
  },
  actor: SessionUser,
) {
  const username = normalizeUsername(data.username);
  const exists = await prisma.user.findFirst({
    where: { email: data.email.toLowerCase(), ...notDeleted },
  });
  if (exists) throw new AppError("อีเมลนี้ถูกใช้แล้ว", "DUPLICATE_EMAIL", 400);
  await assertUniqueUsername(username);
  const created = await prisma.user.create({
    data: {
      id: newId(),
      name: data.name,
      username,
      email: data.email.toLowerCase(),
      passwordHash: await hashPassword(data.pin),
      pinLookup: createPinLookup(data.pin),
      role: data.role,
      status: data.status || "active",
    },
  });
  await writeAudit({
    actor,
    action: "CREATE",
    entityType: "User",
    entityId: created.id,
    newData: serializeUser(asDoc(created)),
  });
  return serializeUser(asDoc(created));
}

export async function updateUser(
  id: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const existing = await prisma.user.findFirst({
    where: { id, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบผู้ใช้งาน", "NOT_FOUND", 404);
  const oldData = serializeUser(asDoc(existing));
  const next: Record<string, unknown> = { ...data };
  if (next.username) {
    const username = normalizeUsername(String(next.username));
    await assertUniqueUsername(username, id);
    next.username = username;
  }
  if (next.pin) {
    const pin = String(next.pin);
    next.passwordHash = await hashPassword(pin);
    next.pinLookup = createPinLookup(pin);
    delete next.pin;
  }
  const updated = await prisma.user.update({
    where: { id },
    data: {
      name: next.name === undefined ? undefined : String(next.name),
      username: next.username === undefined ? undefined : String(next.username),
      email: next.email === undefined ? undefined : String(next.email).toLowerCase(),
      role: next.role === undefined ? undefined : String(next.role),
      status: next.status === undefined ? undefined : String(next.status),
      passwordHash: next.passwordHash === undefined ? undefined : String(next.passwordHash),
      pinLookup: next.pinLookup === undefined ? undefined : String(next.pinLookup),
    },
  });
  await writeAudit({
    actor,
    action: "UPDATE",
    entityType: "User",
    entityId: id,
    oldData,
    newData: serializeUser(asDoc(updated)),
  });
  return serializeUser(asDoc(updated));
}

export async function deleteUser(id: string, actor: SessionUser) {
  if (id === actor.id) {
    throw new AppError("ไม่สามารถลบบัญชีของตนเองได้", "FORBIDDEN", 400);
  }
  const existing = await prisma.user.findFirst({
    where: { id, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบผู้ใช้งาน", "NOT_FOUND", 404);
  const updated = await prisma.user.update({
    where: { id },
    data: { status: "deleted", deletedAt: new Date() },
  });
  await writeAudit({
    actor,
    action: "DELETE",
    entityType: "User",
    entityId: id,
    oldData: serializeUser(asDoc(updated)),
  });
  return { id };
}

export async function changeOwnPin(
  userId: string,
  currentPin: string,
  newPin: string,
  actor: SessionUser,
) {
  const existing = await prisma.user.findFirst({
    where: { id: userId, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบผู้ใช้งาน", "NOT_FOUND", 404);
  const matched = await verifyPassword(currentPin, existing.passwordHash);
  if (!matched) {
    throw new AppError("PIN ปัจจุบันไม่ถูกต้อง", "INVALID_PIN", 400);
  }
  if (currentPin === newPin) {
    throw new AppError("PIN ใหม่ต้องต่างจาก PIN เดิม", "SAME_PIN", 400);
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(newPin),
      pinLookup: createPinLookup(newPin),
    },
  });
  await writeAudit({
    actor,
    action: "UPDATE",
    entityType: "User",
    entityId: userId,
    newData: { pinChanged: true },
  });
  return { ok: true };
}
