import { z } from "zod";
import { optionalObjectIdSchema } from "./common";

export const personSchema = z.object({
  firstName: z.string().min(1, "กรุณากรอกชื่อ"),
  lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
  displayName: z.string().optional().default(""),
  positionId: optionalObjectIdSchema,
  phone: z.string().optional().default(""),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  description: z.string().optional().default(""),
  status: z.enum(["active", "inactive"]).optional(),
});

export const updatePersonSchema = personSchema.partial();
