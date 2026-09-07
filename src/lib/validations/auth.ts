import { z } from "zod";
import { USER_ROLES } from "@/types";

export const pinSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => /^\d{6}$/.test(value), "PIN ต้องเป็นตัวเลข 6 หลัก");

export const changePinSchema = z.object({
  currentPin: pinSchema,
  newPin: pinSchema,
});

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username ต้องมีอย่างน้อย 3 ตัวอักษร")
  .max(32, "Username ยาวเกินไป")
  .regex(/^[a-z0-9._-]+$/, "Username ใช้ได้เฉพาะ a-z, 0-9, จุด, _ และ -");

export const loginSchema = z.object({
  username: usernameSchema,
  pin: pinSchema,
  remember: z.boolean().optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อผู้ใช้"),
  username: usernameSchema,
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  pin: pinSchema,
  role: z.enum(USER_ROLES),
  status: z.enum(["active", "inactive"]).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  username: usernameSchema.optional(),
  email: z.string().email().optional(),
  pin: z.preprocess(
    (value) => (typeof value === "string" && value.replace(/\D/g, "") === "" ? undefined : value),
    pinSchema.optional(),
  ),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
