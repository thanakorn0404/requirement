import { z } from "zod";
import { BLOCK_TYPES, WORKFLOW_STATUSES } from "@/types";
import { objectIdSchema } from "./common";

export const workflowSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อการเดินหนังสือ"),
  description: z.string().optional().default(""),
  status: z.enum(WORKFLOW_STATUSES).optional(),
});

export const updateWorkflowSchema = workflowSchema.partial();

export const blockSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่องาน / ตำแหน่ง / หน้าที่"),
  description: z.string().optional().default(""),
  blockType: z.enum(BLOCK_TYPES).optional().default("work"),
  x: z.number().optional().default(120),
  y: z.number().optional().default(80),
  width: z.number().optional().default(300),
  height: z.number().optional().default(200),
  status: z.enum(["active", "inactive"]).optional(),
  personIds: z.array(objectIdSchema).optional(),
});

export const updateBlockSchema = blockSchema.partial().extend({
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const responsibleSchema = z.object({
  personIds: z.array(objectIdSchema).min(1, "กรุณาเลือกบุคลากรอย่างน้อย 1 คน"),
  responsibility: z.string().optional().default(""),
  responsibilities: z.record(z.string(), z.string()).optional(),
});

export const edgeSchema = z.object({
  sourceBlockId: objectIdSchema,
  targetBlockId: objectIdSchema,
  sourceHandle: z.string().optional().default("bottom"),
  targetHandle: z.string().optional().default("top"),
  type: z.string().optional().default("smoothstep"),
  label: z.string().optional().default(""),
  animated: z.boolean().optional().default(false),
});

export const updateEdgeSchema = edgeSchema.partial();

export const draftSaveSchema = z.object({
  blocks: z
    .array(
      z.object({
        id: objectIdSchema.optional(),
        clientId: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional().default(""),
        blockType: z.enum(BLOCK_TYPES).optional().default("work"),
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
        status: z.enum(["active", "inactive"]).optional(),
        responsiblePersons: z
          .array(
            z.object({
              personId: objectIdSchema,
              responsibility: z.string().optional().default(""),
            }),
          )
          .optional()
          .default([]),
      }),
    )
    .optional()
    .default([]),
  edges: z
    .array(
      z.object({
        id: objectIdSchema.optional(),
        clientId: z.string().optional(),
        sourceBlockId: z.string(),
        targetBlockId: z.string(),
        sourceHandle: z.string().optional().default("bottom"),
        targetHandle: z.string().optional().default("top"),
        type: z.string().optional().default("smoothstep"),
        label: z.string().optional().default(""),
        animated: z.boolean().optional().default(false),
      }),
    )
    .optional()
    .default([]),
  note: z.string().optional().default(""),
});
