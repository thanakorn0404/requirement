import { z } from "zod";
import { DEPARTMENT_TYPES } from "@/types";

export const departmentSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อกอง / สำนัก"),
  code: z.string().optional().default(""),
  type: z.enum(DEPARTMENT_TYPES).optional().default("กอง"),
  description: z.string().optional().default(""),
  status: z.enum(["active", "inactive"]).optional(),
});

export const updateDepartmentSchema = departmentSchema.partial();
