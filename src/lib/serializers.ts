import { toId } from "@/lib/utils";
import type { BlockType, EntityStatus, WorkflowStatus } from "@/types";

export function serializeUser(doc: Record<string, unknown>) {
  return {
    id: toId(doc._id),
    name: String(doc.name || ""),
    username: String(doc.username || ""),
    email: String(doc.email || ""),
    role: doc.role,
    status: doc.status,
    lastLoginAt: doc.lastLoginAt ? new Date(doc.lastLoginAt as string).toISOString() : null,
    createdAt: new Date(doc.createdAt as string).toISOString(),
    updatedAt: new Date(doc.updatedAt as string).toISOString(),
  };
}

export function serializeOrganization(doc: Record<string, unknown>) {
  return {
    id: toId(doc._id),
    name: String(doc.name || ""),
    type: doc.type,
    province: String(doc.province || ""),
    district: String(doc.district || ""),
    subdistrict: String(doc.subdistrict || ""),
    address: String(doc.address || ""),
    phone: String(doc.phone || ""),
    email: String(doc.email || ""),
    description: String(doc.description || ""),
    logoUrl: String(doc.logoUrl || ""),
    status: doc.status as EntityStatus,
    createdBy: doc.createdBy ? toId(doc.createdBy) : null,
    updatedBy: doc.updatedBy ? toId(doc.updatedBy) : null,
    createdAt: new Date(doc.createdAt as string).toISOString(),
    updatedAt: new Date(doc.updatedAt as string).toISOString(),
  };
}

export function serializeDepartment(doc: Record<string, unknown>) {
  return {
    id: toId(doc._id),
    organizationId: toId(doc.organizationId),
    name: String(doc.name || ""),
    code: String(doc.code || ""),
    type: doc.type,
    description: String(doc.description || ""),
    status: doc.status as EntityStatus,
    createdBy: doc.createdBy ? toId(doc.createdBy) : null,
    updatedBy: doc.updatedBy ? toId(doc.updatedBy) : null,
    createdAt: new Date(doc.createdAt as string).toISOString(),
    updatedAt: new Date(doc.updatedAt as string).toISOString(),
  };
}

export function serializePosition(doc: Record<string, unknown>) {
  return {
    id: toId(doc._id),
    departmentId: toId(doc.departmentId),
    name: String(doc.name || ""),
    code: String(doc.code || ""),
    level: Number(doc.level || 0),
    description: String(doc.description || ""),
    status: doc.status as EntityStatus,
    createdAt: new Date(doc.createdAt as string).toISOString(),
    updatedAt: new Date(doc.updatedAt as string).toISOString(),
  };
}

export function serializePerson(doc: Record<string, unknown>, positionName?: string) {
  return {
    id: toId(doc._id),
    organizationId: toId(doc.organizationId),
    departmentId: toId(doc.departmentId),
    positionId: doc.positionId ? toId(doc.positionId) : null,
    firstName: String(doc.firstName || ""),
    lastName: String(doc.lastName || ""),
    displayName: String(doc.displayName || ""),
    phone: String(doc.phone || ""),
    email: String(doc.email || ""),
    description: String(doc.description || ""),
    status: doc.status as EntityStatus,
    positionName,
    createdAt: new Date(doc.createdAt as string).toISOString(),
    updatedAt: new Date(doc.updatedAt as string).toISOString(),
  };
}

export function serializeWorkflow(doc: Record<string, unknown>) {
  return {
    id: toId(doc._id),
    organizationId: toId(doc.organizationId),
    departmentId: toId(doc.departmentId),
    name: String(doc.name || ""),
    description: String(doc.description || ""),
    status: doc.status as WorkflowStatus,
    currentVersion: Number(doc.currentVersion || 0),
    createdBy: doc.createdBy ? toId(doc.createdBy) : null,
    updatedBy: doc.updatedBy ? toId(doc.updatedBy) : null,
    createdAt: new Date(doc.createdAt as string).toISOString(),
    updatedAt: new Date(doc.updatedAt as string).toISOString(),
  };
}

export function serializeBlock(doc: Record<string, unknown>) {
  return {
    id: toId(doc._id),
    workflowId: toId(doc.workflowId),
    title: String(doc.title || ""),
    description: String(doc.description || ""),
    blockType: doc.blockType as BlockType,
    x: Number(doc.x || 0),
    y: Number(doc.y || 0),
    width: Number(doc.width || 300),
    height: Number(doc.height || 200),
    status: doc.status as EntityStatus,
    createdBy: doc.createdBy ? toId(doc.createdBy) : null,
    updatedBy: doc.updatedBy ? toId(doc.updatedBy) : null,
    createdAt: new Date(doc.createdAt as string).toISOString(),
    updatedAt: new Date(doc.updatedAt as string).toISOString(),
  };
}

export function serializeEdge(doc: Record<string, unknown>) {
  return {
    id: toId(doc._id),
    workflowId: toId(doc.workflowId),
    sourceBlockId: toId(doc.sourceBlockId),
    targetBlockId: toId(doc.targetBlockId),
    sourceHandle: String(doc.sourceHandle || "bottom"),
    targetHandle: String(doc.targetHandle || "top"),
    type: String(doc.type || "smoothstep"),
    label: String(doc.label || ""),
    animated: Boolean(doc.animated),
    createdAt: new Date(doc.createdAt as string).toISOString(),
    updatedAt: new Date(doc.updatedAt as string).toISOString(),
  };
}

export function serializeRequirement(doc: Record<string, unknown>) {
  return {
    id: toId(doc._id),
    organizationId: toId(doc.organizationId),
    departmentId: toId(doc.departmentId),
    workflowId: doc.workflowId ? toId(doc.workflowId) : null,
    blockId: doc.blockId ? toId(doc.blockId) : null,
    responsiblePersonId: doc.responsiblePersonId ? toId(doc.responsiblePersonId) : null,
    positionId: doc.positionId ? toId(doc.positionId) : null,
    requirementCode: String(doc.requirementCode || ""),
    title: String(doc.title || ""),
    category: doc.category,
    description: String(doc.description || ""),
    input: String(doc.input || ""),
    process: String(doc.process || ""),
    output: String(doc.output || ""),
    relatedDocuments: String(doc.relatedDocuments || ""),
    currentProblem: String(doc.currentProblem || ""),
    desiredBehavior: String(doc.desiredBehavior || ""),
    priority: doc.priority,
    status: doc.status,
    note: String(doc.note || ""),
    orphaned: Boolean(doc.orphaned),
    createdBy: doc.createdBy ? toId(doc.createdBy) : null,
    updatedBy: doc.updatedBy ? toId(doc.updatedBy) : null,
    createdAt: new Date(doc.createdAt as string).toISOString(),
    updatedAt: new Date(doc.updatedAt as string).toISOString(),
  };
}

export function serializeAudit(doc: Record<string, unknown>, actorName?: string) {
  return {
    id: toId(doc._id),
    actorId: toId(doc.actorId),
    actorName,
    action: String(doc.action || ""),
    entityType: String(doc.entityType || ""),
    entityId: String(doc.entityId || ""),
    organizationId: doc.organizationId ? toId(doc.organizationId) : null,
    departmentId: doc.departmentId ? toId(doc.departmentId) : null,
    oldData: doc.oldData ?? null,
    newData: doc.newData ?? null,
    createdAt: new Date(doc.createdAt as string).toISOString(),
  };
}
