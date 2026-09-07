"use client";

import type { ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Expand,
  Maximize,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkflowStore } from "@/stores/workflow.store";

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button variant="outline" aria-label={label} onClick={onClick} className="h-11 px-3">
      {children}
      <span>{label}</span>
    </Button>
  );
}

export function WorkflowToolbar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onFullscreen,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onFullscreen: () => void;
}) {
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);
  const align = useWorkflowStore((state) => state.align);
  const distribute = useWorkflowStore((state) => state.distribute);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToolButton label="ย้อนกลับ" onClick={undo}><Undo2 /></ToolButton>
      <ToolButton label="ทำซ้ำ" onClick={redo}><Redo2 /></ToolButton>
      <ToolButton label="ขยาย" onClick={onZoomIn}><ZoomIn /></ToolButton>
      <ToolButton label="ย่อ" onClick={onZoomOut}><ZoomOut /></ToolButton>
      <ToolButton label="พอดีจอ" onClick={onFitView}><Maximize /></ToolButton>
      <ToolButton label="เต็มจอ" onClick={onFullscreen}><Expand /></ToolButton>
      <ToolButton label="ชิดซ้าย" onClick={() => align("left")}><AlignLeft /></ToolButton>
      <ToolButton label="กึ่งกลาง" onClick={() => align("center")}><AlignCenter /></ToolButton>
      <ToolButton label="ชิดขวา" onClick={() => align("right")}><AlignRight /></ToolButton>
      <Button variant="outline" onClick={() => distribute("horizontal")}>กระจายแนวนอน</Button>
      <Button variant="outline" onClick={() => distribute("vertical")}>กระจายแนวตั้ง</Button>
    </div>
  );
}
