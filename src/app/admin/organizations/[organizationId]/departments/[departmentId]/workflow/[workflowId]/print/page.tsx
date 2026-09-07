"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/client-api";
import { formatDate } from "@/lib/utils";
import type { WorkflowFullDTO, WorkflowVersionDTO } from "@/types";

export default function WorkflowPrintPage() {
  const params = useParams<{ workflowId: string }>();
  const [workflow, setWorkflow] = useState<WorkflowFullDTO | null>(null);
  const [versions, setVersions] = useState<WorkflowVersionDTO[]>([]);

  useEffect(() => {
    Promise.all([
      api<WorkflowFullDTO>(`/api/workflows/${params.workflowId}/full`),
      api<WorkflowVersionDTO[]>(`/api/workflows/${params.workflowId}/versions`),
    ]).then(([full, vers]) => {
      setWorkflow(full);
      setVersions(vers);
    });
  }, [params.workflowId]);

  if (!workflow) return <p className="p-8">กำลังเตรียมเอกสาร...</p>;

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 print:p-0">
      <h1 className="text-2xl font-semibold">{workflow.name}</h1>
      <p className="text-sm text-muted-foreground">เวอร์ชันปัจจุบัน {workflow.currentVersion} · {formatDate(workflow.updatedAt)}</p>
      <div className="mt-6 space-y-4">
        {workflow.blocks.map((block) => (
          <section key={block.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">{block.title}</h2>
            <p className="text-sm text-muted-foreground">{block.description}</p>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {block.responsiblePersons.map((person) => (
                <li key={person.personId}>
                  {person.person?.displayName} {person.responsibility ? `· ${person.responsibility}` : ""}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-6">
        <h3 className="font-semibold">เส้นทางหนังสือ</h3>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {workflow.edges.map((edge) => {
            const source = workflow.blocks.find((block) => block.id === edge.sourceBlockId)?.title;
            const target = workflow.blocks.find((block) => block.id === edge.targetBlockId)?.title;
            return (
              <li key={edge.id}>
                {source} → {target} {edge.label ? `(${edge.label})` : ""}
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">เอกสารนี้สร้างจาก Structured Data ไม่ใช่ภาพหน้าจอ · เวอร์ชันที่เก็บไว้ {versions.length} รายการ</p>
    </div>
  );
}
