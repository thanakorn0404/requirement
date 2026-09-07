import { z } from "zod";
import {
  REQUIREMENT_CATEGORIES,
  REQUIREMENT_PRIORITIES,
  REQUIREMENT_STATUSES,
} from "@/types";
import { optionalObjectIdSchema } from "./common";

export const requirementSchema = z.object({
  requirementCode: z.string().optional().default(""),
  title: z.string().min(1, "กรุณากรอกชื่อความต้องการของระบบ"),
  category: z.enum(REQUIREMENT_CATEGORIES).optional().default("workflow"),
  description: z.string().optional().default(""),
  workflowId: optionalObjectIdSchema,
  blockId: optionalObjectIdSchema,
  responsiblePersonId: optionalObjectIdSchema,
  positionId: optionalObjectIdSchema,
  input: z.string().optional().default(""),
  process: z.string().optional().default(""),
  output: z.string().optional().default(""),
  relatedDocuments: z.string().optional().default(""),
  currentProblem: z.string().optional().default(""),
  desiredBehavior: z.string().optional().default(""),
  priority: z.enum(REQUIREMENT_PRIORITIES).optional().default("medium"),
  status: z.enum(REQUIREMENT_STATUSES).optional().default("draft"),
  note: z.string().optional().default(""),
});

export const updateRequirementSchema = requirementSchema.partial();
