"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { toast } from "sonner";
import { api, ClientApiError } from "@/lib/client-api";
import { useWorkflowLive } from "@/hooks/use-workflow-live";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { Badge } from "@/components/ui/badge";
import { useWorkflowStore } from "@/stores/workflow.store";
import type { WorkflowFullDTO } from "@/types";

export function WorkflowPublicViewer({ token }: { token: string }) {
  const [workflow, setWorkflow] = useState<WorkflowFullDTO | null>(null);
  const [missing, setMissing] = useState(false);
  const load = useWorkflowStore((state) => state.load);
  const liveState = useWorkflowLive(workflow?.id || "", null, false, token);

  useEffect(() => {
    api<WorkflowFullDTO>(`/api/share/${encodeURIComponent(token)}`)
      .then((data) => {
        setWorkflow(data);
        load({
          workflowId: data.id,
          blocks: data.blocks,
          edges: data.edges,
        });
      })
      .catch((error) => {
        setMissing(true);
        toast.error(error instanceof ClientApiError ? error.message : "ไม่พบลิงก์นี้");
      });
  }, [load, token]);

  if (missing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef6fb] p-6">
        <p className="text-sm text-muted-foreground">ไม่พบลิงก์ดูการเดินหนังสือ หรือลิงก์นี้หมดอายุแล้ว</p>
      </div>
    );
  }

  if (!workflow) {
    return <p className="p-6 text-sm text-muted-foreground">กำลังเปิดหน้าดูแบบสด...</p>;
  }

  return (
    <div className="flex h-screen flex-col bg-[#f7f2f3]">
      <div className="sts-accent-bar h-1 w-full" />
      <header className="flex items-center justify-between border-b border-primary/10 bg-white px-5 py-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {workflow.organizationName} · {workflow.departmentName}
          </p>
          <h1 className="text-xl font-semibold text-sts-deep">{workflow.name}</h1>
          <p className="text-base text-muted-foreground">โหมดดูอย่างเดียว ไม่ต้องเข้าสู่ระบบ</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={liveState.live ? "success" : "secondary"} className="gap-1">
            <Radio className="h-3 w-3" />
            {liveState.live ? "ดูแบบสด" : "กำลังเชื่อมต่อ"}
          </Badge>
          {liveState.editor && (
            <span className="text-xs text-sts-deep">{liveState.editor.name} กำลังแก้ไข</span>
          )}
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <WorkflowCanvas readOnly />
      </div>
    </div>
  );
}
