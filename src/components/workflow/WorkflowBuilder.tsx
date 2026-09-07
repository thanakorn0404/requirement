"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ReactFlowInstance } from "@xyflow/react";
import { ArrowLeft, Link2, Radio, Save } from "lucide-react";
import { useWorkflowLive } from "@/hooks/use-workflow-live";
import { api, ClientApiError } from "@/lib/client-api";
import { STATUS_LABEL } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { AddResponsiblePersonModal } from "@/components/workflow/AddResponsiblePersonModal";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { WorkflowProperties } from "@/components/workflow/WorkflowProperties";
import { WorkflowSidebar } from "@/components/workflow/WorkflowSidebar";
import { WorkflowToolbar } from "@/components/workflow/WorkflowToolbar";
import { WorkflowVersionPanel } from "@/components/workflow/WorkflowVersionPanel";
import { RequirementForm } from "@/components/requirement/requirement-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWorkflowStore } from "@/stores/workflow.store";
import type {
  DepartmentDTO,
  OrganizationDTO,
  PersonDTO,
  PositionDTO,
  RequirementDTO,
  WorkflowFullDTO,
  WorkflowVersionDTO,
} from "@/types";

export function WorkflowBuilder({
  organizationId,
  departmentId,
  workflowId,
}: {
  organizationId: string;
  departmentId: string;
  workflowId: string;
}) {
  const router = useRouter();
  const { canWrite, isAdmin, user } = useAuth();
  const [organization, setOrganization] = useState<OrganizationDTO | null>(null);
  const [department, setDepartment] = useState<DepartmentDTO | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowFullDTO | null>(null);
  const [positions, setPositions] = useState<PositionDTO[]>([]);
  const [persons, setPersons] = useState<PersonDTO[]>([]);
  const [requirements, setRequirements] = useState<RequirementDTO[]>([]);
  const [versions, setVersions] = useState<WorkflowVersionDTO[]>([]);
  const [personModal, setPersonModal] = useState(false);
  const [targetBlockId, setTargetBlockId] = useState<string | null>(null);
  const [requirementOpen, setRequirementOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<RequirementDTO | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [viewVersion, setViewVersion] = useState<WorkflowVersionDTO | null>(null);
  const [createBlockOpen, setCreateBlockOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [newBlockTitle, setNewBlockTitle] = useState("");
  const flowRef = useRef<ReactFlowInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useWorkflowStore((state) => state.load);
  const dirty = useWorkflowStore((state) => state.dirty);
  const saving = useWorkflowStore((state) => state.saving);
  const lastSavedAt = useWorkflowStore((state) => state.lastSavedAt);
  const setSaving = useWorkflowStore((state) => state.setSaving);
  const setLastSavedAt = useWorkflowStore((state) => state.setLastSavedAt);
  const setDirty = useWorkflowStore((state) => state.setDirty);
  const setSearch = useWorkflowStore((state) => state.setSearch);
  const toPayload = useWorkflowStore((state) => state.toPayload);
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);
  const addBlock = useWorkflowStore((state) => state.addBlock);
  const deleteBlocks = useWorkflowStore((state) => state.deleteBlocks);
  const deleteEdge = useWorkflowStore((state) => state.deleteEdge);
  const selectedBlockIds = useWorkflowStore((state) => state.selectedBlockIds);
  const selectedEdgeId = useWorkflowStore((state) => state.selectedEdgeId);
  const duplicateBlocks = useWorkflowStore((state) => state.duplicateBlocks);

  const refresh = useCallback(async () => {
    const [org, dept, full, pos, people, reqs, vers] = await Promise.all([
      api<OrganizationDTO>(`/api/organizations/${organizationId}`),
      api<DepartmentDTO>(`/api/departments/${departmentId}`),
      api<WorkflowFullDTO>(`/api/workflows/${workflowId}/full`),
      api<PositionDTO[]>(`/api/departments/${departmentId}/positions`),
      api<PersonDTO[]>(`/api/departments/${departmentId}/persons`),
      api<{ items: RequirementDTO[] }>(`/api/departments/${departmentId}/requirements?workflowId=${workflowId}&pageSize=100`),
      api<WorkflowVersionDTO[]>(`/api/workflows/${workflowId}/versions`),
    ]);
    setOrganization(org);
    setDepartment(dept);
    setWorkflow(full);
    setPositions(pos);
    setPersons(people);
    setRequirements(reqs.items);
    setVersions(vers);
    load({ workflowId, blocks: full.blocks, edges: full.edges, requirements: reqs.items });
  }, [departmentId, load, organizationId, workflowId]);

  useEffect(() => {
    refresh().catch((error) => toast.error(error.message));
  }, [refresh]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ blockId: string }>).detail;
      setTargetBlockId(detail.blockId);
      setPersonModal(true);
    };
    window.addEventListener("open-add-person", handler);
    return () => window.removeEventListener("open-add-person", handler);
  }, []);

  const applySnapshot = useWorkflowStore((state) => state.applySnapshot);
  const blocks = useWorkflowStore((state) => state.blocks);
  const storeEdges = useWorkflowStore((state) => state.edges);
  const liveState = useWorkflowLive(workflowId, user, canWrite);

  const persistDraft = useCallback(async () => {
    if (!canWrite || !useWorkflowStore.getState().dirty) return;
    try {
      const saved = await api<WorkflowFullDTO>(`/api/workflows/${workflowId}/draft`, {
        method: "POST",
        body: JSON.stringify(toPayload()),
      });
      applySnapshot({ blocks: saved.blocks, edges: saved.edges });
      setLastSavedAt(new Date().toISOString());
      setDirty(false);
    } catch (error) {
      toast.error(error instanceof ClientApiError ? error.message : "บันทึกร่างไม่สำเร็จ");
    }
  }, [applySnapshot, canWrite, setDirty, setLastSavedAt, toPayload, workflowId]);

  useEffect(() => {
    if (!canWrite || !dirty) return;
    const timer = setTimeout(() => {
      persistDraft();
    }, 1200);
    return () => clearTimeout(timer);
  }, [blocks, canWrite, dirty, persistDraft, storeEdges]);

  const saveOfficial = async () => {
    if (!canWrite) return;
    setSaving(true);
    try {
      const result = await api<{ workflow: WorkflowFullDTO; version: number; warnings: string[] }>(
        `/api/workflows/${workflowId}/save`,
        { method: "POST", body: JSON.stringify(toPayload()) },
      );
      load({ workflowId, blocks: result.workflow.blocks, edges: result.workflow.edges, requirements });
      setWorkflow(result.workflow);
      setLastSavedAt(new Date().toISOString());
      setDirty(false);
      toast.success("บันทึกการเดินหนังสือเรียบร้อยแล้ว");
      const vers = await api<WorkflowVersionDTO[]>(`/api/workflows/${workflowId}/versions`);
      setVersions(vers);
    } catch (error) {
      toast.error(error instanceof ClientApiError ? error.message : "ไม่สามารถบันทึกการเดินหนังสือได้");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveOfficial();
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        redo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        const tag = (event.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (selectedEdgeId) deleteEdge(selectedEdgeId);
        if (selectedBlockIds.length) {
          if (confirm("ต้องการลบงาน/ตำแหน่งนี้หรือไม่?")) deleteBlocks(selectedBlockIds);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // saveOfficial ผูกกับ state ปัจจุบันตอนกด Ctrl+S
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteBlocks, deleteEdge, redo, selectedBlockIds, selectedEdgeId, undo]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  if (!workflow || !department || !organization) {
    return <p className="p-6 text-sm text-muted-foreground">กำลังโหลดตัวสร้างการเดินหนังสือ...</p>;
  }

  return (
    <div ref={containerRef} className="flex h-screen flex-col bg-[#f7f2f3]">
      <div className="sts-accent-bar h-1 w-full" />
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/10 bg-white px-5 py-4">
        <div>
          <button
            type="button"
            className="mb-1 flex items-center gap-1 text-base text-muted-foreground hover:text-primary"
            onClick={() => {
              if (dirty) setLeaveOpen(true);
              else router.push(`/admin/organizations/${organizationId}/departments/${departmentId}`);
            }}
          >
            <ArrowLeft className="h-5 w-5" /> กลับ
          </button>
          <h1 className="text-xl font-semibold text-sts-deep">{department.name}</h1>
          <p className="text-base text-muted-foreground">{workflow.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Version {workflow.currentVersion}</Badge>
          <Badge variant="info">{STATUS_LABEL[workflow.status]}</Badge>
          <Badge variant={liveState.live ? "success" : "secondary"} className="gap-1">
            <Radio className="h-3 w-3" />
            {liveState.live ? "ดูแบบสด" : "ยังไม่เชื่อมต่อสด"}
          </Badge>
          {liveState.editor && liveState.editor.id !== user?.id && (
            <span className="text-sm text-sts-deep">
              {liveState.editor.name} กำลังแก้ไข
            </span>
          )}
          {liveState.others.length > 0 && (
            <span className="text-sm text-muted-foreground">
              มีผู้ดู {liveState.others.length} คน
            </span>
          )}
          <span className="text-sm font-medium text-muted-foreground">
            {saving ? "กำลังบันทึก" : dirty ? "มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก" : lastSavedAt ? "บันทึกแล้ว" : "พร้อมใช้งาน"}
          </span>
          <Input
            className="w-56"
            placeholder="ค้นหาตำแหน่ง / ผู้รับผิดชอบ"
            onChange={(event) => setSearch(event.target.value)}
          />
          {canWrite && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const data = await api<{ shareToken: string }>(`/api/workflows/${workflowId}/share`, {
                    method: "POST",
                  });
                  const url = `${window.location.origin}/share/workflow/${data.shareToken}`;
                  setShareUrl(url);
                  setShareOpen(true);
                } catch (error) {
                  toast.error(error instanceof ClientApiError ? error.message : "สร้างลิงก์ไม่สำเร็จ");
                }
              }}
            >
              <Link2 className="h-4 w-4" /> ลิงก์ให้คนดู
            </Button>
          )}
          <Button variant="outline" onClick={() => setVersionOpen(true)}>เวอร์ชัน</Button>
          <Button variant="outline" onClick={() => setCreateBlockOpen(true)}>+ เพิ่มงาน / ตำแหน่ง / หน้าที่</Button>
          {canWrite && (
            <Button onClick={saveOfficial} disabled={saving}>
              <Save className="h-4 w-4" /> บันทึกการเดินหนังสือ
            </Button>
          )}
        </div>
      </header>
      <div className="border-b border-primary/10 bg-white px-5 py-3">
        <WorkflowToolbar
          onZoomIn={() => flowRef.current?.zoomIn()}
          onZoomOut={() => flowRef.current?.zoomOut()}
          onFitView={() => flowRef.current?.fitView()}
          onFullscreen={() => {
            if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
            else document.exitFullscreen();
          }}
        />
      </div>
      <div className="flex min-h-0 flex-1">
        <WorkflowSidebar positions={positions} persons={persons} />
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute left-4 top-4 z-20">
            <p className="ui-layer-title rounded-2xl border border-primary/10 bg-white/95 px-3 py-2 shadow-sm">
              <span className="ui-step">2</span>
              วางแผนผัง
            </p>
          </div>
          <WorkflowCanvas
            readOnly={!canWrite}
            onReady={(instance) => { flowRef.current = instance; }}
          />
        </div>
        <WorkflowProperties
          requirements={requirements}
          onAddPerson={(blockId) => {
            setTargetBlockId(blockId);
            setPersonModal(true);
          }}
          onAddRequirement={(blockId) => {
            setEditingRequirement({
              id: "",
              departmentId,
              organizationId,
              workflowId,
              blockId,
            } as RequirementDTO);
            setRequirementOpen(true);
          }}
          onEditRequirement={(item) => {
            setEditingRequirement(item);
            setRequirementOpen(true);
          }}
        />
      </div>

      <AddResponsiblePersonModal
        open={personModal}
        onOpenChange={setPersonModal}
        blockId={targetBlockId}
        persons={persons}
        positions={positions}
        departmentId={departmentId}
        onCreatedPerson={(person) => setPersons((current) => [...current, person])}
      />

      <RequirementForm
        open={requirementOpen}
        onOpenChange={setRequirementOpen}
        departmentId={departmentId}
        workflows={[workflow]}
        blocks={useWorkflowStore.getState().blocks.map((block) => ({
          id: block.id,
          title: block.title,
          workflowId,
        }))}
        persons={persons}
        positions={positions}
        initial={editingRequirement}
        onSaved={() => refresh()}
      />

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>อยู่ต่อ</Button>
            <Button variant="outline" onClick={() => router.push(`/admin/organizations/${organizationId}/departments/${departmentId}`)}>
              ออกโดยไม่บันทึก
            </Button>
            <Button
              onClick={async () => {
                await saveOfficial();
                router.push(`/admin/organizations/${organizationId}/departments/${departmentId}`);
              }}
            >
              บันทึกและออก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>เวอร์ชันการเดินหนังสือ</DialogTitle></DialogHeader>
          <WorkflowVersionPanel
            versions={versions}
            canRestore={isAdmin}
            onView={async (version) => {
              const data = await api<WorkflowVersionDTO>(`/api/workflows/${workflowId}/versions/${version}`);
              setViewVersion(data);
            }}
            onRestore={async (version) => {
              if (!confirm(`ต้องการเรียกคืน Workflow Version ${version} หรือไม่?`)) return;
              try {
                await api(`/api/workflows/${workflowId}/restore/${version}`, { method: "POST" });
                toast.success("เรียกคืนเวอร์ชันและสร้างเวอร์ชันใหม่แล้ว");
                await refresh();
              } catch (error) {
                toast.error(error instanceof ClientApiError ? error.message : "เรียกคืนไม่สำเร็จ");
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewVersion)} onOpenChange={() => setViewVersion(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Version {viewVersion?.version} (Snapshot)</DialogTitle></DialogHeader>
          <div className="max-h-80 space-y-2 overflow-auto text-sm">
            {viewVersion?.blocks.map((block) => (
              <div key={block.id} className="rounded-lg border p-3">
                <p className="font-medium">{block.title}</p>
                {block.responsiblePersons.map((person) => (
                  <p key={person.personId} className="text-xs text-muted-foreground">
                    {person.personNameSnapshot} · {person.responsibilitySnapshot || "-"}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createBlockOpen} onOpenChange={setCreateBlockOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>สร้าง Block</DialogTitle></DialogHeader>
          <Input placeholder="ชื่องาน / ตำแหน่ง / หน้าที่" value={newBlockTitle} onChange={(event) => setNewBlockTitle(event.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateBlockOpen(false)}>ยกเลิก</Button>
            <Button
              onClick={() => {
                if (!newBlockTitle.trim()) return;
                addBlock({
                  title: newBlockTitle.trim(),
                  description: "",
                  blockType: "work",
                  x: 160,
                  y: 80,
                  width: 320,
                  height: 230,
                  status: "active",
                  responsiblePersons: [],
                });
                setNewBlockTitle("");
                setCreateBlockOpen(false);
              }}
            >
              สร้าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ลิงก์ให้คนดูโดยไม่ต้องเข้าสู่ระบบ</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ส่งลิงก์นี้ให้คนอื่น เปิดแล้วจะเห็นการเดินหนังสือแบบสด ขณะที่มีคนกำลังแก้ไข
          </p>
          <Input readOnly value={shareUrl} onFocus={(event) => event.target.select()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)}>ปิด</Button>
            <Button
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                toast.success("คัดลอกลิงก์แล้ว");
              }}
            >
              คัดลอกลิงก์
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="hidden">
        <Link href={`/admin/organizations/${organizationId}`}>{organization.name}</Link>
        <button type="button" onClick={() => duplicateBlocks(selectedBlockIds)}>duplicate</button>
      </div>
    </div>
  );
}
