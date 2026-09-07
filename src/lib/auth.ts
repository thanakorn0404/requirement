import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { AppError } from "@/lib/api";
import { connectDB, prisma } from "@/lib/db";
import type { SessionUser, UserRole } from "@/types";

const COOKIE_NAME = "session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("กรุณากำหนด AUTH_SECRET ใน Environment Variables");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createPinLookup(pin: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("กรุณากำหนด AUTH_SECRET ใน Environment Variables");
  }
  return createHash("sha256").update(`${pin}:${secret}`).digest("hex");
}

export async function createSessionToken(user: SessionUser, remember = false) {
  const expiresIn = remember ? "30d" : "1d";
  return new SignJWT({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.id || !payload.email || !payload.role) return null;
    return {
      id: String(payload.id),
      name: String(payload.name || ""),
      username: payload.username ? String(payload.username) : undefined,
      email: String(payload.email),
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string, remember = false) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getTokenFromRequest(request?: NextRequest) {
  if (request) {
    return request.cookies.get(COOKIE_NAME)?.value || null;
  }
  return null;
}

export async function getSession(request?: NextRequest): Promise<SessionUser | null> {
  const token = request
    ? getTokenFromRequest(request)
    : (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(request?: NextRequest): Promise<SessionUser> {
  const session = await getSession(request);
  if (!session) {
    throw new AppError("กรุณาเข้าสู่ระบบ", "UNAUTHORIZED", 401);
  }
  await connectDB();
  const user = await prisma.user.findFirst({
    where: {
      id: session.id,
      status: "active",
      deletedAt: null,
    },
  });
  if (!user) {
    throw new AppError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", "SESSION_EXPIRED", 401);
  }
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role as UserRole,
  };
}

export async function requireRole(roles: UserRole[], request?: NextRequest) {
  const session = await requireSession(request);
  if (!roles.includes(session.role)) {
    throw new AppError("คุณไม่มีสิทธิ์ดำเนินการนี้", "FORBIDDEN", 403);
  }
  return session;
}

export function canWrite(role: UserRole) {
  return role === "ADMIN" || role === "EDITOR";
}

export function canAdmin(role: UserRole) {
  return role === "ADMIN";
}
