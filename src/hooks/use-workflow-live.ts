"use client";

import { useEffect, useState } from "react";
import type { LivePresence, WorkflowLiveEvent } from "@/lib/workflow-live";
import { useWorkflowStore } from "@/stores/workflow.store";
import type { SessionUser } from "@/types";

function guestIdentity() {
  if (typeof window === "undefined") {
    return { id: "guest", name: "ผู้ชม" };
  }
  const key = "workflow-share-guest";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    try {
      return JSON.parse(existing) as { id: string; name: string };
    } catch {
      // สร้างใหม่ถ้าข้อมูลเสีย
    }
  }
  const guest = { id: `guest_${crypto.randomUUID()}`, name: "ผู้ชม" };
  window.localStorage.setItem(key, JSON.stringify(guest));
  return guest;
}

export function useWorkflowLive(
  workflowId: string,
  user: SessionUser | null,
  canWrite: boolean,
  shareToken?: string,
) {
  const [viewers, setViewers] = useState<LivePresence[]>([]);
  const [editor, setEditor] = useState<LivePresence | null>(null);
  const [live, setLive] = useState(false);
  const applySnapshot = useWorkflowStore((state) => state.applySnapshot);
  const dirty = useWorkflowStore((state) => state.dirty);

  useEffect(() => {
    if (!workflowId && !shareToken) return;
    const self = user || guestIdentity();
    const liveUrl = shareToken
      ? `/api/share/${encodeURIComponent(shareToken)}/live?guestId=${encodeURIComponent(self.id)}&guestName=${encodeURIComponent(self.name)}`
      : `/api/workflows/${workflowId}/live`;
    const source = new EventSource(liveUrl);
    source.onopen = () => setLive(true);
    source.onerror = () => setLive(false);
    source.onmessage = (message) => {
      let event: WorkflowLiveEvent;
      try {
        event = JSON.parse(message.data) as WorkflowLiveEvent;
      } catch {
        return;
      }
      if (event.type === "presence") {
        setViewers(event.viewers);
        setEditor(event.editor);
        return;
      }
      if (event.type !== "graph" || event.actorId === self.id) return;
      if (canWrite && useWorkflowStore.getState().dirty) return;
      applySnapshot({
        blocks: event.workflow.blocks,
        edges: event.workflow.edges,
      });
    };
    return () => {
      source.close();
      if (shareToken) {
        fetch(
          `/api/share/${encodeURIComponent(shareToken)}/presence?guestId=${encodeURIComponent(self.id)}`,
          { method: "DELETE", keepalive: true },
        ).catch(() => undefined);
        return;
      }
      fetch(`/api/workflows/${workflowId}/presence`, {
        method: "DELETE",
        credentials: "include",
        keepalive: true,
      }).catch(() => undefined);
    };
  }, [applySnapshot, canWrite, shareToken, user, workflowId]);

  useEffect(() => {
    if (shareToken) {
      const guest = guestIdentity();
      const beat = () => {
        fetch(`/api/share/${encodeURIComponent(shareToken)}/presence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId: guest.id, guestName: guest.name }),
        }).catch(() => undefined);
      };
      beat();
      const timer = setInterval(beat, 8000);
      return () => clearInterval(timer);
    }
    if (!workflowId || !user) return;
    const beat = () => {
      fetch(`/api/workflows/${workflowId}/presence`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: canWrite ? "editing" : "viewing" }),
      }).catch(() => undefined);
    };
    beat();
    const timer = setInterval(beat, 8000);
    return () => clearInterval(timer);
  }, [canWrite, shareToken, user, workflowId]);

  const selfId = user?.id;
  return {
    live,
    viewers,
    editor,
    others: viewers.filter((item) => item.id !== selfId),
    dirty,
  };
}
