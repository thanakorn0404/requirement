import { create } from "zustand";
import type { BlockType, PersonDTO, RequirementDTO, WorkflowBlockDTO, WorkflowEdgeDTO } from "@/types";

export interface LocalResponsible {
  personId: string;
  responsibility: string;
  person?: PersonDTO;
  personInactive?: boolean;
}

export interface LocalBlock {
  id: string;
  title: string;
  description: string;
  blockType: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  status: "active" | "inactive";
  responsiblePersons: LocalResponsible[];
  requirementCount?: number;
}

export interface LocalEdge {
  id: string;
  sourceBlockId: string;
  targetBlockId: string;
  sourceHandle: string;
  targetHandle: string;
  type: string;
  label: string;
  animated: boolean;
}

interface HistorySnapshot {
  blocks: LocalBlock[];
  edges: LocalEdge[];
}

interface WorkflowStore {
  workflowId: string;
  blocks: LocalBlock[];
  edges: LocalEdge[];
  selectedBlockIds: string[];
  selectedEdgeId: string | null;
  selectedPersonId: string | null;
  dirty: boolean;
  saving: boolean;
  lastSavedAt: string | null;
  search: string;
  highlightedIds: string[];
  history: HistorySnapshot[];
  historyIndex: number;
  requirements: RequirementDTO[];
  load: (input: {
    workflowId: string;
    blocks: WorkflowBlockDTO[];
    edges: WorkflowEdgeDTO[];
    requirements?: RequirementDTO[];
  }) => void;
  applySnapshot: (input: {
    blocks: WorkflowBlockDTO[];
    edges: WorkflowEdgeDTO[];
  }) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setLastSavedAt: (value: string | null) => void;
  setSearch: (value: string) => void;
  selectBlocks: (ids: string[]) => void;
  selectEdge: (id: string | null) => void;
  selectPerson: (id: string | null) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  addBlock: (block: Omit<LocalBlock, "id"> & { id?: string }) => string;
  updateBlock: (id: string, patch: Partial<LocalBlock>, recordHistory?: boolean) => void;
  moveBlock: (id: string, x: number, y: number) => void;
  resizeBlock: (id: string, width: number, height: number) => void;
  deleteBlocks: (ids: string[]) => void;
  duplicateBlocks: (ids: string[]) => void;
  addPersonToBlock: (blockId: string, person: PersonDTO, responsibility?: string) => void;
  removePersonFromBlock: (blockId: string, personId: string) => void;
  updateResponsibility: (blockId: string, personId: string, responsibility: string) => void;
  addEdge: (edge: Omit<LocalEdge, "id"> & { id?: string }) => void;
  updateEdge: (id: string, patch: Partial<LocalEdge>) => void;
  deleteEdge: (id: string) => void;
  align: (mode: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  distribute: (mode: "horizontal" | "vertical") => void;
  toPayload: () => {
    blocks: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function createId() {
  return `temp_${crypto.randomUUID()}`;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflowId: "",
  blocks: [],
  edges: [],
  selectedBlockIds: [],
  selectedEdgeId: null,
  selectedPersonId: null,
  dirty: false,
  saving: false,
  lastSavedAt: null,
  search: "",
  highlightedIds: [],
  history: [],
  historyIndex: -1,
  requirements: [],
  load: ({ workflowId, blocks, edges, requirements }) => {
    const localBlocks: LocalBlock[] = blocks.map((block) => ({
      id: block.id,
      title: block.title,
      description: block.description,
      blockType: block.blockType,
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
      status: block.status === "inactive" ? "inactive" : "active",
      responsiblePersons: block.responsiblePersons.map((person) => ({
        personId: person.personId,
        responsibility: person.responsibility,
        person: person.person,
        personInactive: person.personInactive,
      })),
      requirementCount: block.requirementCount,
    }));
    const localEdges: LocalEdge[] = edges.map((edge) => ({
      id: edge.id,
      sourceBlockId: edge.sourceBlockId,
      targetBlockId: edge.targetBlockId,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type,
      label: edge.label,
      animated: edge.animated,
    }));
    set({
      workflowId,
      blocks: localBlocks,
      edges: localEdges,
      requirements: requirements || [],
      dirty: false,
      selectedBlockIds: [],
      selectedEdgeId: null,
      history: [{ blocks: clone(localBlocks), edges: clone(localEdges) }],
      historyIndex: 0,
    });
  },
  applySnapshot: ({ blocks, edges }) => {
    const localBlocks: LocalBlock[] = blocks.map((block) => ({
      id: block.id,
      title: block.title,
      description: block.description,
      blockType: block.blockType,
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
      status: block.status === "inactive" ? "inactive" : "active",
      responsiblePersons: block.responsiblePersons.map((person) => ({
        personId: person.personId,
        responsibility: person.responsibility,
        person: person.person,
        personInactive: person.personInactive,
      })),
      requirementCount: block.requirementCount,
    }));
    const localEdges: LocalEdge[] = edges.map((edge) => ({
      id: edge.id,
      sourceBlockId: edge.sourceBlockId,
      targetBlockId: edge.targetBlockId,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type,
      label: edge.label,
      animated: edge.animated,
    }));
    const selectedBlockIds = get().selectedBlockIds.filter((id) =>
      localBlocks.some((block) => block.id === id),
    );
    const selectedEdgeId = localEdges.some((edge) => edge.id === get().selectedEdgeId)
      ? get().selectedEdgeId
      : null;
    set({
      blocks: localBlocks,
      edges: localEdges,
      dirty: false,
      selectedBlockIds,
      selectedEdgeId,
    });
  },
  setDirty: (dirty) => set({ dirty }),
  setSaving: (saving) => set({ saving }),
  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),
  setSearch: (search) => {
    const highlightedIds = get().blocks
      .filter((block) => {
        const text = [
          block.title,
          block.description,
          ...block.responsiblePersons.map((person) => person.person?.displayName || ""),
        ]
          .join(" ")
          .toLowerCase();
        return search && text.includes(search.toLowerCase());
      })
      .map((block) => block.id);
    set({ search, highlightedIds });
  },
  selectBlocks: (selectedBlockIds) => {
    const current = get().selectedBlockIds;
    const unchanged =
      current.length === selectedBlockIds.length &&
      current.every((id, index) => id === selectedBlockIds[index]);
    if (unchanged && get().selectedEdgeId === null) return;
    set({ selectedBlockIds, selectedEdgeId: null });
  },
  selectEdge: (selectedEdgeId) => {
    if (get().selectedEdgeId === selectedEdgeId && get().selectedBlockIds.length === 0) return;
    set({ selectedEdgeId, selectedBlockIds: [] });
  },
  selectPerson: (selectedPersonId) => {
    if (get().selectedPersonId === selectedPersonId) return;
    set({ selectedPersonId });
  },
  pushHistory: () => {
    const { blocks, edges, history, historyIndex } = get();
    const next = [...history.slice(0, historyIndex + 1), { blocks: clone(blocks), edges: clone(edges) }];
    set({ history: next.slice(-50), historyIndex: Math.min(next.length - 1, 49), dirty: true });
  },
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const snapshot = history[historyIndex - 1];
    set({
      blocks: clone(snapshot.blocks),
      edges: clone(snapshot.edges),
      historyIndex: historyIndex - 1,
      dirty: true,
    });
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const snapshot = history[historyIndex + 1];
    set({
      blocks: clone(snapshot.blocks),
      edges: clone(snapshot.edges),
      historyIndex: historyIndex + 1,
      dirty: true,
    });
  },
  addBlock: (block) => {
    const id = block.id || createId();
    set((state) => ({
      blocks: [
        ...state.blocks,
        {
          ...block,
          status: block.status || "active",
          responsiblePersons: block.responsiblePersons || [],
          id,
        },
      ],
      dirty: true,
    }));
    get().pushHistory();
    return id;
  },
  updateBlock: (id, patch, recordHistory = true) => {
    set((state) => ({
      blocks: state.blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)),
      dirty: true,
    }));
    if (recordHistory) get().pushHistory();
  },
  moveBlock: (id, x, y) => {
    const current = get().blocks.find((block) => block.id === id);
    if (!current || (current.x === x && current.y === y)) return;
    set((state) => ({
      blocks: state.blocks.map((block) => (block.id === id ? { ...block, x, y } : block)),
      dirty: true,
    }));
  },
  resizeBlock: (id, width, height) => {
    const current = get().blocks.find((block) => block.id === id);
    if (!current || (current.width === width && current.height === height)) return;
    set((state) => ({
      blocks: state.blocks.map((block) => (block.id === id ? { ...block, width, height } : block)),
      dirty: true,
    }));
  },
  deleteBlocks: (ids) => {
    set((state) => ({
      blocks: state.blocks.filter((block) => !ids.includes(block.id)),
      edges: state.edges.filter(
        (edge) => !ids.includes(edge.sourceBlockId) && !ids.includes(edge.targetBlockId),
      ),
      selectedBlockIds: [],
      dirty: true,
    }));
    get().pushHistory();
  },
  duplicateBlocks: (ids) => {
    const { blocks } = get();
    const copies = blocks
      .filter((block) => ids.includes(block.id))
      .map((block) => ({
        ...clone(block),
        id: createId(),
        x: block.x + 50,
        y: block.y + 50,
        responsiblePersons: [],
      }));
    set((state) => ({
      blocks: [...state.blocks, ...copies],
      selectedBlockIds: copies.map((item) => item.id),
      dirty: true,
    }));
    get().pushHistory();
  },
  addPersonToBlock: (blockId, person, responsibility = "") => {
    set((state) => ({
      blocks: state.blocks.map((block) => {
        if (block.id !== blockId) return block;
        if (block.responsiblePersons.some((item) => item.personId === person.id)) return block;
        return {
          ...block,
          responsiblePersons: [
            ...block.responsiblePersons,
            {
              personId: person.id,
              responsibility,
              person,
              personInactive: person.status !== "active",
            },
          ],
        };
      }),
      dirty: true,
    }));
    get().pushHistory();
  },
  removePersonFromBlock: (blockId, personId) => {
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              responsiblePersons: block.responsiblePersons.filter((item) => item.personId !== personId),
            }
          : block,
      ),
      dirty: true,
    }));
    get().pushHistory();
  },
  updateResponsibility: (blockId, personId, responsibility) => {
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              responsiblePersons: block.responsiblePersons.map((item) =>
                item.personId === personId ? { ...item, responsibility } : item,
              ),
            }
          : block,
      ),
      dirty: true,
    }));
  },
  addEdge: (edge) => {
    set((state) => ({
      edges: [
        ...state.edges,
        {
          ...edge,
          type: edge.type || "smoothstep",
          label: edge.label || "",
          animated: Boolean(edge.animated),
          sourceHandle: edge.sourceHandle || "bottom",
          targetHandle: edge.targetHandle || "top",
          id: edge.id || createId(),
        },
      ],
      dirty: true,
    }));
    get().pushHistory();
  },
  updateEdge: (id, patch) => {
    set((state) => ({
      edges: state.edges.map((edge) => (edge.id === id ? { ...edge, ...patch } : edge)),
      dirty: true,
    }));
    get().pushHistory();
  },
  deleteEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      selectedEdgeId: null,
      dirty: true,
    }));
    get().pushHistory();
  },
  align: (mode) => {
    const { blocks, selectedBlockIds } = get();
    const selected = blocks.filter((block) => selectedBlockIds.includes(block.id));
    if (selected.length < 2) return;
    const minX = Math.min(...selected.map((block) => block.x));
    const maxX = Math.max(...selected.map((block) => block.x + block.width));
    const minY = Math.min(...selected.map((block) => block.y));
    const maxY = Math.max(...selected.map((block) => block.y + block.height));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    set((state) => ({
      blocks: state.blocks.map((block) => {
        if (!selectedBlockIds.includes(block.id)) return block;
        if (mode === "left") return { ...block, x: minX };
        if (mode === "right") return { ...block, x: maxX - block.width };
        if (mode === "center") return { ...block, x: centerX - block.width / 2 };
        if (mode === "top") return { ...block, y: minY };
        if (mode === "bottom") return { ...block, y: maxY - block.height };
        return { ...block, y: centerY - block.height / 2 };
      }),
      dirty: true,
    }));
    get().pushHistory();
  },
  distribute: (mode) => {
    const { blocks, selectedBlockIds } = get();
    const selected = [...blocks.filter((block) => selectedBlockIds.includes(block.id))].sort((a, b) =>
      mode === "horizontal" ? a.x - b.x : a.y - b.y,
    );
    if (selected.length < 3) return;
    const start = mode === "horizontal" ? selected[0].x : selected[0].y;
    const end =
      mode === "horizontal"
        ? selected[selected.length - 1].x
        : selected[selected.length - 1].y;
    const gap = (end - start) / (selected.length - 1);
    set((state) => ({
      blocks: state.blocks.map((block) => {
        const index = selected.findIndex((item) => item.id === block.id);
        if (index < 0) return block;
        return mode === "horizontal"
          ? { ...block, x: start + gap * index }
          : { ...block, y: start + gap * index };
      }),
      dirty: true,
    }));
    get().pushHistory();
  },
  toPayload: () => {
    const { blocks, edges } = get();
    return {
      blocks: blocks.map((block) => ({
        id: block.id.startsWith("temp_") ? undefined : block.id,
        clientId: block.id,
        title: block.title,
        description: block.description,
        blockType: block.blockType,
        x: block.x,
        y: block.y,
        width: block.width,
        height: block.height,
        status: block.status,
        responsiblePersons: block.responsiblePersons.map((person) => ({
          personId: person.personId,
          responsibility: person.responsibility,
        })),
      })),
      edges: edges.map((edge) => ({
        id: edge.id.startsWith("temp_") ? undefined : edge.id,
        clientId: edge.id,
        sourceBlockId: edge.sourceBlockId,
        targetBlockId: edge.targetBlockId,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type,
        label: edge.label,
        animated: edge.animated,
      })),
    };
  },
}));
