import type { SessionUser, WorkflowFullDTO } from "@/types";

export type LivePresence = {
  id: string;
  name: string;
  role: string;
  mode: "editing" | "viewing";
};

export type WorkflowLiveEvent =
  | { type: "presence"; viewers: LivePresence[]; editor: LivePresence | null }
  | { type: "graph"; actorId: string; actorName: string; workflow: WorkflowFullDTO }
  | { type: "ping" };

type Listener = (event: WorkflowLiveEvent) => void;

type Room = {
  listeners: Map<string, Listener>;
  presence: Map<string, LivePresence & { lastSeen: number }>;
};

const globalForLive = globalThis as typeof globalThis & {
  workflowLiveRooms?: Map<string, Room>;
};

const rooms = globalForLive.workflowLiveRooms ?? new Map<string, Room>();
globalForLive.workflowLiveRooms = rooms;

function getRoom(workflowId: string) {
  const existing = rooms.get(workflowId);
  if (existing) return existing;
  const created: Room = { listeners: new Map(), presence: new Map() };
  rooms.set(workflowId, created);
  return created;
}

function prunePresence(room: Room) {
  const cutoff = Date.now() - 20000;
  for (const [userId, user] of room.presence) {
    if (user.lastSeen < cutoff) room.presence.delete(userId);
  }
}

export function presenceSnapshot(workflowId: string) {
  const room = getRoom(workflowId);
  prunePresence(room);
  const viewers = [...room.presence.values()].map(({ lastSeen: _lastSeen, ...user }) => user);
  const editor =
    viewers.find((user) => user.mode === "editing") ||
    viewers.find((user) => user.role === "ADMIN" || user.role === "EDITOR") ||
    null;
  return { type: "presence" as const, viewers, editor };
}

export function publishWorkflowLive(workflowId: string, event: WorkflowLiveEvent) {
  const room = getRoom(workflowId);
  prunePresence(room);
  for (const listener of room.listeners.values()) {
    listener(event);
  }
}

export function subscribeWorkflowLive(workflowId: string, listenerId: string, listener: Listener) {
  const room = getRoom(workflowId);
  room.listeners.set(listenerId, listener);
  return () => {
    room.listeners.delete(listenerId);
  };
}

export function touchWorkflowPresence(
  workflowId: string,
  user: Pick<SessionUser, "id" | "name" | "role">,
  mode: "editing" | "viewing",
) {
  const room = getRoom(workflowId);
  room.presence.set(user.id, {
    id: user.id,
    name: user.name,
    role: user.role,
    mode,
    lastSeen: Date.now(),
  });
  publishWorkflowLive(workflowId, presenceSnapshot(workflowId));
}

export function leaveWorkflowPresence(workflowId: string, userId: string) {
  const room = getRoom(workflowId);
  room.presence.delete(userId);
  publishWorkflowLive(workflowId, presenceSnapshot(workflowId));
}
