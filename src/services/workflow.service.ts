import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { asDoc, isId, newId, newShareToken, notDeleted, prisma } from "@/lib/db";
import {
  serializeBlock,
  serializeEdge,
  serializePerson,
  serializeWorkflow,
} from "@/lib/serializers";
import { getDepartmentContext } from "@/services/position.service";
import { assertPersonInDepartment } from "@/services/person.service";
import type {
  PersonDTO,
  ResponsiblePersonDTO,
  SessionUser,
  VersionBlockSnapshot,
  VersionEdgeSnapshot,
  WorkflowFullDTO,
  WorkflowVersionDTO,
} from "@/types";

export async function listWorkflows(departmentId?: string, search = "") {
  if (departmentId) {
    await getDepartmentContext(departmentId);
  }
  const items = await prisma.workflow.findMany({
    where: {
      ...notDeleted,
      ...(departmentId ? { departmentId } : {}),
      ...(search ? { name: { contains: search } } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
  return items.map((item) => serializeWorkflow(asDoc(item)));
}

export async function getWorkflowById(id: string) {
  const workflow = await prisma.workflow.findFirst({
    where: { id, ...notDeleted },
  });
  if (!workflow) throw new AppError("ไม่พบการเดินหนังสือ", "NOT_FOUND", 404);
  return serializeWorkflow(asDoc(workflow));
}

export async function createWorkflow(
  departmentId: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const department = await getDepartmentContext(departmentId);
  const created = await prisma.workflow.create({
    data: {
      id: newId(),
      name: String(data.name || ""),
      description: String(data.description || ""),
      organizationId: department.organizationId,
      departmentId,
      status: String(data.status || "draft"),
      currentVersion: 0,
      createdBy: actor.id,
      updatedBy: actor.id,
    },
  });
  await writeAudit({
    actor,
    action: "CREATE",
    entityType: "Workflow",
    entityId: created.id,
    organizationId: department.organizationId,
    departmentId,
    newData: serializeWorkflow(asDoc(created)),
  });
  return serializeWorkflow(asDoc(created));
}

export async function updateWorkflow(
  id: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const existing = await prisma.workflow.findFirst({
    where: { id, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบการเดินหนังสือ", "NOT_FOUND", 404);
  const oldData = serializeWorkflow(asDoc(existing));
  const updated = await prisma.workflow.update({
    where: { id },
    data: {
      name: data.name === undefined ? undefined : String(data.name),
      description: data.description === undefined ? undefined : String(data.description),
      status: data.status === undefined ? undefined : String(data.status),
      updatedBy: actor.id,
    },
  });
  const newData = serializeWorkflow(asDoc(updated));
  await writeAudit({
    actor,
    action: "UPDATE",
    entityType: "Workflow",
    entityId: id,
    organizationId: existing.organizationId,
    departmentId: existing.departmentId,
    oldData,
    newData,
  });
  return newData;
}

export async function deleteWorkflow(id: string, actor: SessionUser) {
  const existing = await prisma.workflow.findFirst({
    where: { id, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบการเดินหนังสือ", "NOT_FOUND", 404);
  const updated = await prisma.workflow.update({
    where: { id },
    data: { status: "deleted", deletedAt: new Date(), updatedBy: actor.id },
  });
  await writeAudit({
    actor,
    action: "DELETE",
    entityType: "Workflow",
    entityId: id,
    organizationId: existing.organizationId,
    departmentId: existing.departmentId,
    oldData: serializeWorkflow(asDoc(updated)),
  });
  return { id };
}

async function loadResponsibleForBlocks(blockIds: string[]) {
  if (!blockIds.length) return new Map<string, ResponsiblePersonDTO[]>();
  const relations = await prisma.workflowBlockResponsible.findMany({
    where: { blockId: { in: blockIds } },
  });
  const personIds = relations.map((item) => item.personId);
  const persons = personIds.length
    ? await prisma.person.findMany({ where: { id: { in: personIds } } })
    : [];
  const positionIds = persons
    .map((item) => item.positionId)
    .filter((id): id is string => Boolean(id));
  const positions = positionIds.length
    ? await prisma.position.findMany({ where: { id: { in: positionIds } } })
    : [];
  const positionMap = Object.fromEntries(positions.map((item) => [item.id, item.name]));
  const personMap = Object.fromEntries(
    persons.map((item) => [
      item.id,
      serializePerson(asDoc(item), item.positionId ? positionMap[item.positionId] : undefined),
    ]),
  );

  const grouped = new Map<string, ResponsiblePersonDTO[]>();
  for (const relation of relations) {
    const person = personMap[relation.personId] as PersonDTO | undefined;
    const list = grouped.get(relation.blockId) || [];
    list.push({
      id: relation.id,
      blockId: relation.blockId,
      personId: relation.personId,
      responsibility: relation.responsibility || "",
      person,
      personInactive: person ? person.status !== "active" : true,
    });
    grouped.set(relation.blockId, list);
  }
  return grouped;
}

export async function getWorkflowFull(id: string): Promise<WorkflowFullDTO> {
  const workflow = await getWorkflowById(id);
  const [blocks, edges] = await Promise.all([
    prisma.workflowBlock.findMany({ where: { workflowId: id, ...notDeleted } }),
    prisma.workflowEdge.findMany({ where: { workflowId: id } }),
  ]);
  const blockIds = blocks.map((block) => block.id);
  const [responsibleMap, requirementCounts] = await Promise.all([
    loadResponsibleForBlocks(blockIds),
    blockIds.length
      ? prisma.requirement.groupBy({
          by: ["blockId"],
          where: { blockId: { in: blockIds }, status: { not: "deleted" } },
          _count: { _all: true },
        })
      : [],
  ]);
  const requirementMap = Object.fromEntries(
    requirementCounts
      .filter((item) => item.blockId)
      .map((item) => [item.blockId as string, item._count._all]),
  );

  return {
    ...workflow,
    blocks: blocks.map((block) => ({
      ...serializeBlock(asDoc(block)),
      responsiblePersons: responsibleMap.get(block.id) || [],
      requirementCount: requirementMap[block.id] || 0,
    })),
    edges: edges.map((edge) => serializeEdge(asDoc(edge))),
  };
}

export async function createBlock(
  workflowId: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, ...notDeleted },
  });
  if (!workflow) throw new AppError("ไม่พบการเดินหนังสือ", "NOT_FOUND", 404);
  if (data.blockType === "person") {
    throw new AppError("ห้ามสร้าง Block จากบุคลากร", "INVALID_BLOCK_TYPE", 400);
  }
  const created = await prisma.workflowBlock.create({
    data: {
      id: newId(),
      workflowId,
      title: String(data.title || ""),
      description: String(data.description || ""),
      blockType: String(data.blockType || "work"),
      x: Number(data.x ?? 120),
      y: Number(data.y ?? 80),
      width: Number(data.width ?? 300),
      height: Number(data.height ?? 200),
      status: String(data.status || "active"),
      createdBy: actor.id,
      updatedBy: actor.id,
    },
  });

  const personIds = Array.isArray(data.personIds) ? data.personIds.map(String) : [];
  if (personIds.length) {
    await addResponsiblePersons(
      created.id,
      personIds,
      String(data.responsibility || ""),
      actor,
    );
  }

  await writeAudit({
    actor,
    action: "CREATE_BLOCK",
    entityType: "WorkflowBlock",
    entityId: created.id,
    organizationId: workflow.organizationId,
    departmentId: workflow.departmentId,
    newData: serializeBlock(asDoc(created)),
  });
  return getBlockWithRelations(created.id);
}

export async function getBlockWithRelations(blockId: string) {
  const block = await prisma.workflowBlock.findFirst({
    where: { id: blockId, ...notDeleted },
  });
  if (!block) throw new AppError("ไม่พบงาน / ตำแหน่ง / หน้าที่", "NOT_FOUND", 404);
  const responsibleMap = await loadResponsibleForBlocks([blockId]);
  const requirementCount = await prisma.requirement.count({
    where: { blockId, status: { not: "deleted" } },
  });
  return {
    ...serializeBlock(asDoc(block)),
    responsiblePersons: responsibleMap.get(blockId) || [],
    requirementCount,
  };
}

export async function updateBlock(
  id: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const existing = await prisma.workflowBlock.findFirst({
    where: { id, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบงาน / ตำแหน่ง / หน้าที่", "NOT_FOUND", 404);
  const workflow = await prisma.workflow.findUnique({ where: { id: existing.workflowId } });
  const oldData = serializeBlock(asDoc(existing));
  const updated = await prisma.workflowBlock.update({
    where: { id },
    data: {
      title: data.title === undefined ? undefined : String(data.title),
      description: data.description === undefined ? undefined : String(data.description),
      blockType: data.blockType === undefined ? undefined : String(data.blockType),
      x: data.x === undefined ? undefined : Number(data.x),
      y: data.y === undefined ? undefined : Number(data.y),
      width: data.width === undefined ? undefined : Number(data.width),
      height: data.height === undefined ? undefined : Number(data.height),
      status: data.status === undefined ? undefined : String(data.status),
      updatedBy: actor.id,
    },
  });
  await writeAudit({
    actor,
    action: "UPDATE_BLOCK",
    entityType: "WorkflowBlock",
    entityId: id,
    organizationId: workflow?.organizationId ?? null,
    departmentId: workflow?.departmentId ?? null,
    oldData,
    newData: serializeBlock(asDoc(updated)),
  });
  return getBlockWithRelations(id);
}

export async function deleteBlock(id: string, actor: SessionUser) {
  const existing = await prisma.workflowBlock.findFirst({
    where: { id, ...notDeleted },
  });
  if (!existing) throw new AppError("ไม่พบงาน / ตำแหน่ง / หน้าที่", "NOT_FOUND", 404);
  const workflow = await prisma.workflow.findUnique({ where: { id: existing.workflowId } });
  await prisma.workflowBlockResponsible.deleteMany({ where: { blockId: id } });
  await prisma.workflowEdge.deleteMany({
    where: { OR: [{ sourceBlockId: id }, { targetBlockId: id }] },
  });
  await prisma.requirement.updateMany({
    where: { blockId: id, status: { not: "deleted" } },
    data: { orphaned: true, blockId: null },
  });
  const updated = await prisma.workflowBlock.update({
    where: { id },
    data: { status: "deleted", deletedAt: new Date(), updatedBy: actor.id },
  });
  await writeAudit({
    actor,
    action: "DELETE_BLOCK",
    entityType: "WorkflowBlock",
    entityId: id,
    organizationId: workflow?.organizationId ?? null,
    departmentId: workflow?.departmentId ?? null,
    oldData: serializeBlock(asDoc(updated)),
  });
  return { id, orphanedRequirements: true };
}

export async function addResponsiblePersons(
  blockId: string,
  personIds: string[],
  responsibility: string,
  actor: SessionUser,
  responsibilities?: Record<string, string>,
) {
  const block = await prisma.workflowBlock.findFirst({
    where: { id: blockId, ...notDeleted },
  });
  if (!block) throw new AppError("ไม่พบงาน / ตำแหน่ง / หน้าที่", "NOT_FOUND", 404);
  const workflow = await prisma.workflow.findUnique({ where: { id: block.workflowId } });
  if (!workflow) throw new AppError("ไม่พบการเดินหนังสือ", "NOT_FOUND", 404);

  for (const personId of personIds) {
    const person = await assertPersonInDepartment(personId, workflow.departmentId);
    const existing = await prisma.workflowBlockResponsible.findUnique({
      where: { blockId_personId: { blockId, personId } },
    });
    if (existing) {
      if (responsibilities?.[personId] || responsibility) {
        await prisma.workflowBlockResponsible.update({
          where: { id: existing.id },
          data: { responsibility: responsibilities?.[personId] || responsibility },
        });
      }
      continue;
    }
    await prisma.workflowBlockResponsible.create({
      data: {
        id: newId(),
        blockId,
        personId,
        responsibility: responsibilities?.[personId] || responsibility || "",
      },
    });
    await writeAudit({
      actor,
      action: "ADD_PERSON_TO_BLOCK",
      entityType: "WorkflowBlockResponsible",
      entityId: blockId,
      organizationId: workflow.organizationId,
      departmentId: workflow.departmentId,
      newData: {
        blockTitle: block.title,
        personName: person.displayName,
        personId,
      },
    });
  }
  return getBlockWithRelations(blockId);
}

export async function removeResponsiblePerson(
  blockId: string,
  personId: string,
  actor: SessionUser,
) {
  const block = await prisma.workflowBlock.findFirst({
    where: { id: blockId, ...notDeleted },
  });
  if (!block) throw new AppError("ไม่พบงาน / ตำแหน่ง / หน้าที่", "NOT_FOUND", 404);
  const workflow = await prisma.workflow.findUnique({ where: { id: block.workflowId } });
  const person = await prisma.person.findUnique({ where: { id: personId } });
  const deleted = await prisma.workflowBlockResponsible.findUnique({
    where: { blockId_personId: { blockId, personId } },
  });
  if (!deleted) {
    throw new AppError("ไม่พบผู้รับผิดชอบในงานนี้", "NOT_FOUND", 404);
  }
  await prisma.workflowBlockResponsible.delete({ where: { id: deleted.id } });
  await writeAudit({
    actor,
    action: "REMOVE_PERSON_FROM_BLOCK",
    entityType: "WorkflowBlockResponsible",
    entityId: blockId,
    organizationId: workflow?.organizationId ?? null,
    departmentId: workflow?.departmentId ?? null,
    oldData: {
      blockTitle: block.title,
      personName: person?.displayName,
      personId,
    },
  });
  return getBlockWithRelations(blockId);
}

export async function createEdge(
  workflowId: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, ...notDeleted },
  });
  if (!workflow) throw new AppError("ไม่พบการเดินหนังสือ", "NOT_FOUND", 404);
  const [source, target] = await Promise.all([
    prisma.workflowBlock.findFirst({
      where: { id: String(data.sourceBlockId), workflowId, ...notDeleted },
    }),
    prisma.workflowBlock.findFirst({
      where: { id: String(data.targetBlockId), workflowId, ...notDeleted },
    }),
  ]);
  if (!source || !target) {
    throw new AppError("พบเส้นเชื่อมที่มีปลายทางไม่ถูกต้อง", "BROKEN_EDGE", 400);
  }
  const created = await prisma.workflowEdge.create({
    data: {
      id: newId(),
      workflowId,
      sourceBlockId: String(data.sourceBlockId),
      targetBlockId: String(data.targetBlockId),
      sourceHandle: String(data.sourceHandle || "bottom"),
      targetHandle: String(data.targetHandle || "top"),
      type: String(data.type || "smoothstep"),
      label: String(data.label || ""),
      animated: Boolean(data.animated),
    },
  });
  await writeAudit({
    actor,
    action: "CREATE",
    entityType: "WorkflowEdge",
    entityId: created.id,
    organizationId: workflow.organizationId,
    departmentId: workflow.departmentId,
    newData: serializeEdge(asDoc(created)),
  });
  return serializeEdge(asDoc(created));
}

export async function updateEdge(
  id: string,
  data: Record<string, unknown>,
  actor: SessionUser,
) {
  const existing = await prisma.workflowEdge.findUnique({ where: { id } });
  if (!existing) throw new AppError("ไม่พบเส้นเชื่อม", "NOT_FOUND", 404);
  const workflow = await prisma.workflow.findUnique({ where: { id: existing.workflowId } });
  const updated = await prisma.workflowEdge.update({
    where: { id },
    data: {
      sourceHandle: data.sourceHandle === undefined ? undefined : String(data.sourceHandle),
      targetHandle: data.targetHandle === undefined ? undefined : String(data.targetHandle),
      type: data.type === undefined ? undefined : String(data.type),
      label: data.label === undefined ? undefined : String(data.label),
      animated: data.animated === undefined ? undefined : Boolean(data.animated),
    },
  });
  await writeAudit({
    actor,
    action: "UPDATE",
    entityType: "WorkflowEdge",
    entityId: id,
    organizationId: workflow?.organizationId ?? null,
    departmentId: workflow?.departmentId ?? null,
    newData: serializeEdge(asDoc(updated)),
  });
  return serializeEdge(asDoc(updated));
}

export async function deleteEdge(id: string, actor: SessionUser) {
  const existing = await prisma.workflowEdge.findUnique({ where: { id } });
  if (!existing) throw new AppError("ไม่พบเส้นเชื่อม", "NOT_FOUND", 404);
  const workflow = await prisma.workflow.findUnique({ where: { id: existing.workflowId } });
  await prisma.workflowEdge.delete({ where: { id } });
  await writeAudit({
    actor,
    action: "DELETE",
    entityType: "WorkflowEdge",
    entityId: id,
    organizationId: workflow?.organizationId ?? null,
    departmentId: workflow?.departmentId ?? null,
    oldData: serializeEdge(asDoc(existing)),
  });
  return { id };
}

function resolveBlockId(value: string, idMap: Map<string, string>) {
  if (isId(value) && idMap.has(value)) return idMap.get(value)!;
  if (idMap.has(value)) return idMap.get(value)!;
  if (isId(value)) return value;
  return "";
}

export async function persistWorkflowGraph(
  workflowId: string,
  payload: {
    blocks: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
  },
  actor: SessionUser,
) {
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, ...notDeleted },
  });
  if (!workflow) throw new AppError("ไม่พบการเดินหนังสือ", "NOT_FOUND", 404);

  const incomingBlocks = payload.blocks || [];
  const incomingIds = incomingBlocks
    .map((block) => (block.id ? String(block.id) : ""))
    .filter((id) => isId(id));

  const existingBlocks = await prisma.workflowBlock.findMany({
    where: { workflowId, ...notDeleted },
  });
  const existingIds = existingBlocks.map((block) => block.id);
  const removedIds = existingIds.filter((id) => !incomingIds.includes(id));

  for (const removedId of removedIds) {
    await deleteBlock(removedId, actor);
  }

  const idMap = new Map<string, string>();

  for (const block of incomingBlocks) {
    const clientId = String(block.clientId || block.id || "");
    const existingId = block.id && isId(String(block.id)) ? String(block.id) : "";
    if (existingId && existingIds.includes(existingId)) {
      await prisma.workflowBlock.update({
        where: { id: existingId },
        data: {
          title: String(block.title || ""),
          description: String(block.description || ""),
          blockType: String(block.blockType || "work"),
          x: Number(block.x ?? 120),
          y: Number(block.y ?? 80),
          width: Number(block.width ?? 300),
          height: Number(block.height ?? 200),
          status: String(block.status || "active"),
          updatedBy: actor.id,
        },
      });
      idMap.set(existingId, existingId);
      if (clientId) idMap.set(clientId, existingId);

      const incomingPeople = Array.isArray(block.responsiblePersons)
        ? (block.responsiblePersons as Array<{ personId: string; responsibility?: string }>)
        : [];
      const current = await prisma.workflowBlockResponsible.findMany({
        where: { blockId: existingId },
      });
      const incomingPersonIds = incomingPeople.map((item) => item.personId);
      for (const relation of current) {
        if (!incomingPersonIds.includes(relation.personId)) {
          await prisma.workflowBlockResponsible.delete({ where: { id: relation.id } });
        }
      }
      for (const person of incomingPeople) {
        await assertPersonInDepartment(person.personId, workflow.departmentId);
        await prisma.workflowBlockResponsible.upsert({
          where: { blockId_personId: { blockId: existingId, personId: person.personId } },
          update: { responsibility: person.responsibility || "" },
          create: {
            id: newId(),
            blockId: existingId,
            personId: person.personId,
            responsibility: person.responsibility || "",
          },
        });
      }
    } else {
      const created = await prisma.workflowBlock.create({
        data: {
          id: newId(),
          workflowId,
          title: String(block.title || ""),
          description: String(block.description || ""),
          blockType: String(block.blockType || "work"),
          x: Number(block.x ?? 120),
          y: Number(block.y ?? 80),
          width: Number(block.width ?? 300),
          height: Number(block.height ?? 200),
          status: String(block.status || "active"),
          createdBy: actor.id,
          updatedBy: actor.id,
        },
      });
      if (clientId) idMap.set(clientId, created.id);
      idMap.set(created.id, created.id);
      const incomingPeople = Array.isArray(block.responsiblePersons)
        ? (block.responsiblePersons as Array<{ personId: string; responsibility?: string }>)
        : [];
      for (const person of incomingPeople) {
        await assertPersonInDepartment(person.personId, workflow.departmentId);
        await prisma.workflowBlockResponsible.create({
          data: {
            id: newId(),
            blockId: created.id,
            personId: person.personId,
            responsibility: person.responsibility || "",
          },
        });
      }
    }
  }

  await prisma.workflowEdge.deleteMany({ where: { workflowId } });
  for (const edge of payload.edges || []) {
    const sourceBlockId = resolveBlockId(String(edge.sourceBlockId), idMap);
    const targetBlockId = resolveBlockId(String(edge.targetBlockId), idMap);
    if (!sourceBlockId || !targetBlockId) continue;
    await prisma.workflowEdge.create({
      data: {
        id: newId(),
        workflowId,
        sourceBlockId,
        targetBlockId,
        sourceHandle: String(edge.sourceHandle || "bottom"),
        targetHandle: String(edge.targetHandle || "top"),
        type: String(edge.type || "smoothstep"),
        label: String(edge.label || ""),
        animated: Boolean(edge.animated),
      },
    });
  }

  await prisma.workflow.update({
    where: { id: workflowId },
    data: { updatedBy: actor.id },
  });
  return getWorkflowFull(workflowId);
}

export async function validateWorkflowGraph(workflowId: string) {
  const full = await getWorkflowFull(workflowId);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!full.blocks.length) {
    warnings.push("ยังไม่มีงาน / ตำแหน่ง / หน้าที่ บน Canvas");
  }

  for (const block of full.blocks) {
    if (!block.title.trim()) {
      errors.push("พบ Block ที่ยังไม่มีชื่อ");
    }
    for (const person of block.responsiblePersons) {
      if (!person.person) {
        errors.push(`บุคลากรใน ${block.title} ไม่มีอยู่ในระบบ`);
      } else if (person.person.departmentId !== full.departmentId) {
        errors.push(`บุคลากร ${person.person.displayName} ไม่อยู่ในกอง / สำนักนี้`);
      } else if (person.person.organizationId !== full.organizationId) {
        errors.push(`บุคลากร ${person.person.displayName} ไม่อยู่ในหน่วยงานนี้`);
      }
    }
  }

  const blockIds = new Set(full.blocks.map((block) => block.id));
  for (const edge of full.edges) {
    if (!blockIds.has(edge.sourceBlockId) || !blockIds.has(edge.targetBlockId)) {
      errors.push("พบเส้นเชื่อมที่มีปลายทางไม่ถูกต้อง");
    }
  }

  return { warnings, errors, valid: errors.length === 0 };
}

async function createVersionSnapshot(workflowId: string, actor: SessionUser, note = "") {
  const full = await getWorkflowFull(workflowId);
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new AppError("ไม่พบการเดินหนังสือ", "NOT_FOUND", 404);
  const nextVersion = Number(workflow.currentVersion || 0) + 1;

  const blocks: VersionBlockSnapshot[] = full.blocks.map((block) => ({
    id: block.id,
    title: block.title,
    description: block.description,
    x: block.x,
    y: block.y,
    width: block.width,
    height: block.height,
    blockType: block.blockType,
    responsiblePersons: block.responsiblePersons.map((person) => ({
      personId: person.personId,
      personNameSnapshot: person.person?.displayName || "ไม่พบบุคลากร",
      positionId: person.person?.positionId || null,
      positionNameSnapshot: person.person?.positionName || "",
      responsibilitySnapshot: person.responsibility || "",
    })),
  }));

  const edges: VersionEdgeSnapshot[] = full.edges.map((edge) => ({
    id: edge.id,
    sourceBlockId: edge.sourceBlockId,
    targetBlockId: edge.targetBlockId,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: edge.type,
    label: edge.label,
  }));

  const version = await prisma.workflowVersion.create({
    data: {
      id: newId(),
      workflowId,
      version: nextVersion,
      name: `Version ${nextVersion}`,
      blocks: blocks as unknown as Prisma.InputJsonValue,
      edges: edges as unknown as Prisma.InputJsonValue,
      createdBy: actor.id,
      note,
    },
  });

  await prisma.workflow.update({
    where: { id: workflowId },
    data: { currentVersion: nextVersion, updatedBy: actor.id },
  });

  return version;
}

export async function saveWorkflowOfficial(
  workflowId: string,
  payload: {
    blocks: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
    note?: string;
  },
  actor: SessionUser,
) {
  await persistWorkflowGraph(workflowId, payload, actor);
  const validation = await validateWorkflowGraph(workflowId);
  if (!validation.valid) {
    throw new AppError(validation.errors.join(" | "), "VALIDATION_FAILED", 400);
  }
  const version = await createVersionSnapshot(workflowId, actor, payload.note || "");
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  await writeAudit({
    actor,
    action: "SAVE_WORKFLOW",
    entityType: "Workflow",
    entityId: workflowId,
    organizationId: workflow?.organizationId ?? null,
    departmentId: workflow?.departmentId ?? null,
    newData: { version: version.version, warnings: validation.warnings },
  });
  return {
    workflow: await getWorkflowFull(workflowId),
    version: version.version,
    warnings: validation.warnings,
  };
}

export async function listVersions(workflowId: string) {
  await getWorkflowById(workflowId);
  const versions = await prisma.workflowVersion.findMany({
    where: { workflowId },
    orderBy: { version: "desc" },
  });
  return versions.map((item) => ({
    id: item.id,
    workflowId: item.workflowId,
    version: item.version,
    name: item.name,
    blocks: item.blocks as VersionBlockSnapshot[],
    edges: item.edges as VersionEdgeSnapshot[],
    createdBy: item.createdBy,
    note: item.note || "",
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function getVersion(workflowId: string, version: number): Promise<WorkflowVersionDTO> {
  const item = await prisma.workflowVersion.findUnique({
    where: { workflowId_version: { workflowId, version } },
  });
  if (!item) throw new AppError("ไม่พบเวอร์ชันการเดินหนังสือ", "NOT_FOUND", 404);
  return {
    id: item.id,
    workflowId: item.workflowId,
    version: item.version,
    name: item.name,
    blocks: item.blocks as VersionBlockSnapshot[],
    edges: item.edges as VersionEdgeSnapshot[],
    createdBy: item.createdBy,
    note: item.note || "",
    createdAt: item.createdAt.toISOString(),
  };
}

export async function restoreVersion(
  workflowId: string,
  version: number,
  actor: SessionUser,
) {
  const snapshot = await getVersion(workflowId, version);
  const payload = {
    blocks: snapshot.blocks.map((block) => ({
      id: block.id,
      title: block.title,
      description: block.description,
      blockType: block.blockType,
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
      responsiblePersons: block.responsiblePersons.map((person) => ({
        personId: person.personId,
        responsibility: person.responsibilitySnapshot,
      })),
    })),
    edges: snapshot.edges.map((edge) => ({
      sourceBlockId: edge.sourceBlockId,
      targetBlockId: edge.targetBlockId,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type,
      label: edge.label,
    })),
    note: `เรียกคืนจาก Version ${version}`,
  };

  const result = await saveWorkflowOfficial(workflowId, payload, actor);
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  await writeAudit({
    actor,
    action: "RESTORE_WORKFLOW",
    entityType: "Workflow",
    entityId: workflowId,
    organizationId: workflow?.organizationId ?? null,
    departmentId: workflow?.departmentId ?? null,
    newData: {
      restoredFrom: version,
      newVersion: result.version,
    },
  });
  return result;
}

export async function getOrCreateShareLink(workflowId: string, actor: SessionUser) {
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, ...notDeleted },
  });
  if (!workflow) throw new AppError("ไม่พบการเดินหนังสือ", "NOT_FOUND", 404);

  const existing = await prisma.$queryRaw<Array<{ share_token: string | null }>>`
    SELECT share_token FROM workflows WHERE id = ${workflowId} LIMIT 1
  `;
  let shareToken = existing[0]?.share_token || "";
  if (!shareToken) {
    shareToken = newShareToken();
    await prisma.$executeRaw`
      UPDATE workflows
      SET share_token = ${shareToken}, updated_by = ${actor.id}
      WHERE id = ${workflowId}
    `;
    await writeAudit({
      actor,
      action: "UPDATE",
      entityType: "Workflow",
      entityId: workflowId,
      organizationId: workflow.organizationId,
      departmentId: workflow.departmentId,
      newData: { shareLinkCreated: true },
    });
  }
  return { shareToken, workflowId };
}

export async function getWorkflowIdByShareToken(token: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM workflows
    WHERE share_token = ${token} AND status <> 'deleted' AND deleted_at IS NULL
    LIMIT 1
  `;
  if (!rows[0]) throw new AppError("ไม่พบลิงก์ดูการเดินหนังสือ", "SHARE_NOT_FOUND", 404);
  return rows[0].id;
}

export async function getPublicWorkflowByToken(token: string) {
  const id = await getWorkflowIdByShareToken(token);
  const workflow = await prisma.workflow.findFirst({
    where: { id, ...notDeleted },
  });
  if (!workflow) throw new AppError("ไม่พบลิงก์ดูการเดินหนังสือ", "SHARE_NOT_FOUND", 404);
  const [full, organization, department] = await Promise.all([
    getWorkflowFull(workflow.id),
    prisma.organization.findUnique({ where: { id: workflow.organizationId } }),
    prisma.department.findUnique({ where: { id: workflow.departmentId } }),
  ]);
  return {
    ...full,
    organizationName: organization?.name || "",
    departmentName: department?.name || "",
  };
}
