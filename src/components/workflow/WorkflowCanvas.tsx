"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import { WorkflowBlockNode } from "@/components/workflow/WorkflowBlock";
import { useWorkflowStore } from "@/stores/workflow.store";
import type { PersonDTO } from "@/types";

const nodeTypes = { workBlock: WorkflowBlockNode };

export function WorkflowCanvas({
  readOnly = false,
  onReady,
}: {
  readOnly?: boolean;
  onReady?: (instance: ReactFlowInstance) => void;
}) {
  const blocks = useWorkflowStore((state) => state.blocks);
  const storeEdges = useWorkflowStore((state) => state.edges);
  const highlightedIds = useWorkflowStore((state) => state.highlightedIds);
  const addBlock = useWorkflowStore((state) => state.addBlock);
  const addPersonToBlock = useWorkflowStore((state) => state.addPersonToBlock);
  const moveBlock = useWorkflowStore((state) => state.moveBlock);
  const resizeBlock = useWorkflowStore((state) => state.resizeBlock);
  const addEdgeStore = useWorkflowStore((state) => state.addEdge);
  const selectBlocks = useWorkflowStore((state) => state.selectBlocks);
  const selectEdge = useWorkflowStore((state) => state.selectEdge);
  const updateEdge = useWorkflowStore((state) => state.updateEdge);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ReactFlowInstance | null>(null);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSelection = useRef<string>("");

  const nodes: Node[] = useMemo(
    () =>
      blocks.map((block) => ({
        id: block.id,
        type: "workBlock",
        position: { x: block.x, y: block.y },
        style: { width: block.width, height: block.height },
        data: { block, highlighted: highlightedIds.includes(block.id), readOnly },
      })),
    [blocks, highlightedIds, readOnly],
  );

  const edges: Edge[] = useMemo(
    () =>
      storeEdges.map((edge) => ({
        id: edge.id,
        source: edge.sourceBlockId,
        target: edge.targetBlockId,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type || "smoothstep",
        label: edge.label,
        animated: edge.animated,
      })),
    [storeEdges],
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges);

  useEffect(() => {
    setRfNodes((current) => {
      const byId = new Map(nodes.map((node) => [node.id, node]));
      const sameSet =
        current.length === nodes.length &&
        current.every((node) => byId.has(node.id));
      if (sameSet) {
        return current.map((node) => {
          const next = byId.get(node.id);
          if (!next) return node;
          return {
            ...node,
            data: next.data,
            style: next.style,
            selected: node.selected,
            position: node.dragging ? node.position : next.position,
          };
        });
      }
      return nodes.map((node) => {
        const existing = current.find((item) => item.id === node.id);
        return existing ? { ...node, selected: existing.selected } : node;
      });
    });
    setRfEdges(edges);
  }, [nodes, edges, setRfNodes, setRfEdges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      changes.forEach((change) => {
        if (change.type === "position" && change.position && change.dragging === false) {
          if (moveTimer.current) clearTimeout(moveTimer.current);
          moveTimer.current = setTimeout(() => {
            moveBlock(change.id, change.position!.x, change.position!.y);
          }, 250);
        }
        if (
          change.type === "dimensions" &&
          change.dimensions &&
          "resizing" in change &&
          change.resizing === false
        ) {
          resizeBlock(change.id, change.dimensions.width, change.dimensions.height);
        }
      });
    },
    [moveBlock, onNodesChange, resizeBlock],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      setRfEdges((current) => addEdge({ ...connection, type: "smoothstep" }, current));
      addEdgeStore({
        sourceBlockId: connection.source,
        targetBlockId: connection.target,
        sourceHandle: connection.sourceHandle || "bottom",
        targetHandle: connection.targetHandle || "top",
        type: "smoothstep",
        label: "",
        animated: false,
      });
    },
    [addEdgeStore, setRfEdges],
  );

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams) => {
      const key = selectedEdges[0]
        ? `edge:${selectedEdges[0].id}`
        : `nodes:${selectedNodes.map((node) => node.id).join(",")}`;
      if (lastSelection.current === key) return;
      lastSelection.current = key;
      if (selectedEdges[0]) {
        selectEdge(selectedEdges[0].id);
        return;
      }
      selectBlocks(selectedNodes.map((node) => node.id));
    },
    [selectBlocks, selectEdge],
  );

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full bg-[radial-gradient(circle_at_1px_1px,rgba(225,29,46,0.07)_1px,transparent_0)] [background-size:28px_28px] bg-[#faf4f5]"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const instance = instanceRef.current;
        if (!instance || readOnly) return;
        const positionPayload = event.dataTransfer.getData("application/x-workflow-position");
        const personPayload = event.dataTransfer.getData("application/x-workflow-person");
        const bounds = wrapperRef.current?.getBoundingClientRect();
        const position = instance.screenToFlowPosition({
          x: event.clientX - (bounds?.left || 0),
          y: event.clientY - (bounds?.top || 0),
        });

        if (personPayload) {
          const person = JSON.parse(personPayload) as PersonDTO;
          const target = document.elementFromPoint(event.clientX, event.clientY);
          const nodeElement = target?.closest(".react-flow__node");
          const blockId = nodeElement?.getAttribute("data-id");
          if (blockId) {
            addPersonToBlock(blockId, person);
            toast.success(`เพิ่ม ${person.displayName} เป็นผู้รับผิดชอบแล้ว`);
          } else {
            toast.error("ลากบุคลากรไปวางบน Block เท่านั้น ไม่สร้าง Block จากชื่อบุคคล");
          }
          return;
        }

        if (positionPayload) {
          const payload = JSON.parse(positionPayload) as { title: string; blockType: "work" | "position" | "duty" };
          addBlock({
            title: payload.title,
            description: "",
            blockType: payload.blockType,
            x: position.x,
            y: position.y,
            width: 320,
            height: 230,
            status: "active",
            responsiblePersons: [],
          });
        }
      }}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={readOnly ? undefined : handleNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          instanceRef.current = instance;
          onReady?.(instance);
        }}
        onSelectionChange={handleSelectionChange}
        onEdgeDoubleClick={(_event, edge) => {
          const label = prompt("ข้อความบนลูกศร", String(edge.label || ""));
          if (label !== null) updateEdge(edge.id, { label });
        }}
        fitView
        minZoom={0.2}
        maxZoom={1.8}
        panOnScroll
        selectionOnDrag
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap />
        <Controls showInteractive={false} />
        <Background gap={28} size={1.2} />
      </ReactFlow>
      {!readOnly && blocks.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-8 z-10 flex justify-center px-6">
          <div className="rounded-2xl border border-primary/15 bg-white px-5 py-3 text-center shadow-lg">
            <p className="text-base font-semibold text-sts-deep">ขั้นตอนที่ 2 · วางแผนผัง</p>
            <p className="text-sm text-muted-foreground">ลากตำแหน่งจากซ้ายมาวางที่นี่ แล้วลากจุดแดงเพื่อเชื่อมสาย</p>
          </div>
        </div>
      )}
    </div>
  );
}
