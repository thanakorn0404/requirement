export const USER_ROLES = ["ADMIN", "EDITOR", "VIEWER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ENTITY_STATUSES = ["active", "inactive", "deleted"] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];

export const ORGANIZATION_TYPES = [
  "อบต.",
  "เทศบาลตำบล",
  "เทศบาลเมือง",
  "เทศบาลนคร",
  "อื่นๆ",
] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const DEPARTMENT_TYPES = ["กอง", "สำนัก", "ฝ่าย", "งาน", "อื่นๆ"] as const;
export type DepartmentType = (typeof DEPARTMENT_TYPES)[number];

export const WORKFLOW_STATUSES = [
  "draft",
  "review",
  "approved",
  "archived",
  "deleted",
] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export const REQUIREMENT_STATUSES = [
  "draft",
  "review",
  "approved",
  "implemented",
  "rejected",
  "deleted",
] as const;
export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number];

export const REQUIREMENT_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;
export type RequirementPriority = (typeof REQUIREMENT_PRIORITIES)[number];

export const REQUIREMENT_CATEGORIES = [
  "functional",
  "non_functional",
  "business",
  "technical",
  "security",
  "performance",
  "integration",
  "user_experience",
  "report",
  "workflow",
] as const;
export type RequirementCategory = (typeof REQUIREMENT_CATEGORIES)[number];

export const BLOCK_TYPES = [
  "work",
  "position",
  "duty",
  "person",
  "document",
  "approval",
  "condition",
  "department",
  "start",
  "end",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const AUDIT_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "CREATE",
  "UPDATE",
  "DELETE",
  "CREATE_BLOCK",
  "UPDATE_BLOCK",
  "DELETE_BLOCK",
  "ADD_PERSON_TO_BLOCK",
  "REMOVE_PERSON_FROM_BLOCK",
  "SAVE_WORKFLOW",
  "RESTORE_WORKFLOW",
  "CREATE_REQUIREMENT",
  "UPDATE_REQUIREMENT",
  "DELETE_REQUIREMENT",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface SessionUser {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  provinces?: string[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errorCode: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface UserDTO {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  status: EntityStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationDTO {
  id: string;
  name: string;
  type: OrganizationType;
  province: string;
  district: string;
  subdistrict: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  logoUrl: string;
  status: EntityStatus;
  departmentCount?: number;
  personCount?: number;
  workflowCount?: number;
  requirementCount?: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentDTO {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  type: DepartmentType;
  description: string;
  status: EntityStatus;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PositionDTO {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  level: number;
  description: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PersonDTO {
  id: string;
  organizationId: string;
  departmentId: string;
  positionId: string | null;
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string;
  email: string;
  description: string;
  status: EntityStatus;
  positionName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResponsiblePersonDTO {
  id: string;
  blockId: string;
  personId: string;
  responsibility: string;
  person?: PersonDTO;
  personInactive?: boolean;
}

export interface WorkflowBlockDTO {
  id: string;
  workflowId: string;
  title: string;
  description: string;
  blockType: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  status: EntityStatus;
  responsiblePersons: ResponsiblePersonDTO[];
  requirementCount?: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowEdgeDTO {
  id: string;
  workflowId: string;
  sourceBlockId: string;
  targetBlockId: string;
  sourceHandle: string;
  targetHandle: string;
  type: string;
  label: string;
  animated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDTO {
  id: string;
  organizationId: string;
  departmentId: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  currentVersion: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  organizationName?: string;
  departmentName?: string;
}

export interface WorkflowFullDTO extends WorkflowDTO {
  blocks: WorkflowBlockDTO[];
  edges: WorkflowEdgeDTO[];
}

export interface VersionResponsibleSnapshot {
  personId: string;
  personNameSnapshot: string;
  positionId: string | null;
  positionNameSnapshot: string;
  responsibilitySnapshot: string;
}

export interface VersionBlockSnapshot {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blockType: BlockType;
  responsiblePersons: VersionResponsibleSnapshot[];
}

export interface VersionEdgeSnapshot {
  id: string;
  sourceBlockId: string;
  targetBlockId: string;
  sourceHandle: string;
  targetHandle: string;
  type: string;
  label: string;
}

export interface WorkflowVersionDTO {
  id: string;
  workflowId: string;
  version: number;
  name: string;
  blocks: VersionBlockSnapshot[];
  edges: VersionEdgeSnapshot[];
  createdBy: string | null;
  createdByName?: string;
  note: string;
  createdAt: string;
}

export interface RequirementDTO {
  id: string;
  organizationId: string;
  departmentId: string;
  workflowId: string | null;
  blockId: string | null;
  responsiblePersonId: string | null;
  positionId: string | null;
  requirementCode: string;
  title: string;
  category: RequirementCategory;
  description: string;
  input: string;
  process: string;
  output: string;
  relatedDocuments: string;
  currentProblem: string;
  desiredBehavior: string;
  priority: RequirementPriority;
  status: RequirementStatus;
  note: string;
  orphaned?: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  organizationName?: string;
  departmentName?: string;
  workflowName?: string;
  blockTitle?: string;
  personName?: string;
  positionName?: string;
}

export interface AuditLogDTO {
  id: string;
  actorId: string;
  actorName?: string;
  action: AuditAction | string;
  entityType: string;
  entityId: string;
  organizationId: string | null;
  departmentId: string | null;
  oldData: unknown;
  newData: unknown;
  createdAt: string;
}

export interface DashboardStats {
  organizationCount: number;
  departmentCount: number;
  personCount: number;
  workflowCount: number;
  requirementCount: number;
  recentOrganizations: OrganizationDTO[];
  recentWorkflows: WorkflowDTO[];
  recentRequirements: RequirementDTO[];
  recentActivities: AuditLogDTO[];
}
