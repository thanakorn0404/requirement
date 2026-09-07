import { z } from "zod";

export const positionSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อตำแหน่ง"),
  code: z.string().optional().default(""),
  level: z.number().int().min(0).optional().default(0),
  description: z.string().optional().default(""),
  status: z.enum(["active", "inactive"]).optional(),
});

export const updatePositionSchema = positionSchema.partial();
