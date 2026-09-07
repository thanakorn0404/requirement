import { z } from "zod";
import { ORGANIZATION_TYPES } from "@/types";

export const organizationSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อหน่วยงาน"),
  type: z.enum(ORGANIZATION_TYPES),
  province: z.string().min(1, "กรุณากรอกจังหวัด"),
  district: z.string().optional().default(""),
  subdistrict: z.string().optional().default(""),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  description: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),
  status: z.enum(["active", "inactive"]).optional(),
});

export const updateOrganizationSchema = organizationSchema.partial();
