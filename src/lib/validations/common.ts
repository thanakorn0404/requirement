import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "รหัสข้อมูลไม่ถูกต้อง");

export const optionalObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "รหัสข้อมูลไม่ถูกต้อง")
  .optional()
  .or(z.literal(""));
