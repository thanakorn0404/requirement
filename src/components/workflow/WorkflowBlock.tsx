"use client";

import { memo } from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import { Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useWorkflowStore, type LocalBlock } from "@/stores/workflow.store";

export type WorkBlockNodeType = {
  block: LocalBlock;
  highlighted?: boolean;
  readOnly?: boolean;
};

function WorkflowBlockComponent({ id, data, selected }: NodeProps) {
  const block = (data as WorkBlockNodeType).block;
  const highlighted = (data as WorkBlockNodeType).highlighted;
  const readOnly = (data as WorkBlockNodeType).readOnly;
  const updateBlock = useWorkflowStore((state) => state.updateBlock);
  const deleteBlocks = useWorkflowStore((state) => state.deleteBlocks);
  const selectBlocks = useWorkflowStore((state) => state.selectBlocks);

  return (
    <div
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("application/x-workflow-person")) {
          event.preventDefault();
        }
      }}
      className={cn(
        "relative h-full rounded-3xl border-2 bg-white p-4 shadow-[0_16px_32px_-20px_rgba(63,13,18,0.4)]",
        selected ? "border-primary ring-4 ring-primary/15" : "border-primary/20",
        highlighted && "ring-4 ring-sts-red/25",
      )}
    >
      {!readOnly && (
        <NodeResizer minWidth={260} minHeight={180} color="#e11d2e" isVisible={selected} />
      )}
      <Handle id="top" type="target" position={Position.Top} />
      <Handle id="left" type="target" position={Position.Left} />
      <Handle id="right" type="source" position={Position.Right} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
      <div className="mb-3">
        {!readOnly && (
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">ตำแหน่ง / งาน</p>
            <button
              type="button"
              className="nodrag nopan rounded-xl p-2 text-destructive hover:bg-destructive/10"
              aria-label="ลบงาน / ตำแหน่ง / หน้าที่"
              onClick={(event) => {
                event.stopPropagation();
                if (!confirm("ต้องการลบงาน / ตำแหน่ง / หน้าที่นี้หรือไม่?")) return;
                deleteBlocks([id]);
                toast.message("ลบงานแล้ว ความต้องการของระบบที่เกี่ยวข้องจะถูกทำเครื่องหมายว่า Orphaned");
              }}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        )}
        {readOnly ? (
          <p className="text-center text-lg font-semibold text-sts-deep">{block.title}</p>
        ) : (
          <input
            className="nodrag nopan nowheel w-full rounded-2xl border border-primary/20 bg-[#fff8f8] px-3 py-2.5 text-center text-lg font-semibold text-sts-deep outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            value={block.title}
            placeholder="ตั้งชื่องาน / ตำแหน่ง / หน้าที่"
            aria-label="ชื่อ Block"
            onPointerDown={(event) => event.stopPropagation()}
            onFocus={() => selectBlocks([id])}
            onChange={(event) => updateBlock(id, { title: event.target.value }, false)}
            onBlur={() => {
              const title = block.title.trim();
              if (title !== block.title) {
                updateBlock(id, { title: title || "งานใหม่" }, true);
              }
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") {
                (event.target as HTMLInputElement).blur();
              }
            }}
          />
        )}
      </div>
      <p className="mb-2 text-sm font-semibold text-sts-navy">ผู้รับผิดชอบ</p>
      <div className="space-y-2">
        {block.responsiblePersons.map((person) => (
          <div key={person.personId} className="rounded-2xl bg-sts-soft px-3 py-2">
            <div className="flex items-center gap-2 text-base font-medium">
              <UserRound className="h-5 w-5 text-primary" />
              <span>{person.person?.displayName || "ไม่พบบุคลากร"}</span>
            </div>
            {person.responsibility && (
              <p className="pl-7 text-sm text-muted-foreground">{person.responsibility}</p>
            )}
            {person.personInactive && (
              <p className="pl-7 text-sm text-amber-700">บุคลากรถูกปิดใช้งาน</p>
            )}
          </div>
        ))}
        {!block.responsiblePersons.length && (
          <p className="rounded-2xl bg-[#f7f2f3] px-3 py-2 text-sm text-muted-foreground">ยังไม่มีผู้รับผิดชอบ</p>
        )}
      </div>
      {!readOnly && (
        <button
          type="button"
          className="nodrag nopan mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 px-3 py-2.5 text-base font-medium text-sts-deep transition hover:bg-sts-soft"
          onClick={(event) => {
            event.stopPropagation();
            window.dispatchEvent(new CustomEvent("open-add-person", { detail: { blockId: id } }));
          }}
        >
          <Plus className="h-5 w-5" /> เพิ่มผู้รับผิดชอบ
        </button>
      )}
      <p className="mt-3 text-sm text-muted-foreground">ความต้องการของระบบ: {block.requirementCount || 0} รายการ</p>
    </div>
  );
}

export const WorkflowBlockNode = memo(WorkflowBlockComponent);
