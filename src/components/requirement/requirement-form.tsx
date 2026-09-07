"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { api, ClientApiError } from "@/lib/client-api";
import { REQUIREMENT_CATEGORIES, REQUIREMENT_PRIORITIES, REQUIREMENT_STATUSES } from "@/types";
import { CATEGORY_LABEL, PRIORITY_LABEL, STATUS_LABEL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PersonDTO, PositionDTO, RequirementDTO, WorkflowBlockDTO, WorkflowDTO } from "@/types";

export function RequirementForm({
  open,
  onOpenChange,
  departmentId,
  workflows,
  blocks,
  persons,
  positions,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentId: string;
  workflows: WorkflowDTO[];
  blocks: Array<Pick<WorkflowBlockDTO, "id" | "title" | "workflowId">>;
  persons: PersonDTO[];
  positions: PositionDTO[];
  initial?: Partial<RequirementDTO> | null;
  onSaved: () => void;
}) {
  const form = useForm({
    defaultValues: {
      requirementCode: "",
      title: "",
      category: "workflow",
      description: "",
      workflowId: "",
      blockId: "",
      responsiblePersonId: "",
      positionId: "",
      input: "",
      process: "",
      output: "",
      relatedDocuments: "",
      currentProblem: "",
      desiredBehavior: "",
      priority: "medium",
      status: "draft",
      note: "",
    },
  });

  useEffect(() => {
    form.reset({
      requirementCode: initial?.requirementCode || "",
      title: initial?.title || "",
      category: initial?.category || "workflow",
      description: initial?.description || "",
      workflowId: initial?.workflowId || "",
      blockId: initial?.blockId || "",
      responsiblePersonId: initial?.responsiblePersonId || "",
      positionId: initial?.positionId || "",
      input: initial?.input || "",
      process: initial?.process || "",
      output: initial?.output || "",
      relatedDocuments: initial?.relatedDocuments || "",
      currentProblem: initial?.currentProblem || "",
      desiredBehavior: initial?.desiredBehavior || "",
      priority: initial?.priority || "medium",
      status: initial?.status || "draft",
      note: initial?.note || "",
    });
  }, [initial, open, form]);

  const workflowId = form.watch("workflowId");
  const filteredBlocks = blocks.filter((item) => !workflowId || item.workflowId === workflowId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "แก้ไขความต้องการของระบบ" : "สร้างความต้องการของระบบ"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              if (initial?.id) {
                await api(`/api/requirements/${initial.id}`, {
                  method: "PATCH",
                  body: JSON.stringify(values),
                });
              } else {
                await api(`/api/departments/${departmentId}/requirements`, {
                  method: "POST",
                  body: JSON.stringify(values),
                });
              }
              toast.success("บันทึกความต้องการของระบบแล้ว");
              onSaved();
              onOpenChange(false);
            } catch (error) {
              toast.error(error instanceof ClientApiError ? error.message : "บันทึกไม่สำเร็จ");
            }
          })}
        >
          <div className="space-y-1.5"><Label>รหัส</Label><Input {...form.register("requirementCode")} placeholder="REQ-001" /></div>
          <div className="space-y-1.5"><Label>ชื่อ Requirement</Label><Input {...form.register("title")} /></div>
          <div className="space-y-1.5">
            <Label>หมวดหมู่</Label>
            <Select value={form.watch("category")} onValueChange={(value) => form.setValue("category", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REQUIREMENT_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{CATEGORY_LABEL[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>การเดินหนังสือ</Label>
            <Select value={form.watch("workflowId") || "none"} onValueChange={(value) => form.setValue("workflowId", value === "none" ? "" : value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่ระบุ</SelectItem>
                {workflows.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>งาน / ตำแหน่ง / หน้าที่</Label>
            <Select value={form.watch("blockId") || "none"} onValueChange={(value) => form.setValue("blockId", value === "none" ? "" : value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่ระบุ</SelectItem>
                {filteredBlocks.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>ผู้รับผิดชอบ</Label>
            <Select value={form.watch("responsiblePersonId") || "none"} onValueChange={(value) => form.setValue("responsiblePersonId", value === "none" ? "" : value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่ระบุ</SelectItem>
                {persons.map((item) => <SelectItem key={item.id} value={item.id}>{item.displayName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>ตำแหน่ง</Label>
            <Select value={form.watch("positionId") || "none"} onValueChange={(value) => form.setValue("positionId", value === "none" ? "" : value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่ระบุ</SelectItem>
                {positions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>ความสำคัญ</Label>
            <Select value={form.watch("priority")} onValueChange={(value) => form.setValue("priority", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REQUIREMENT_PRIORITIES.map((item) => <SelectItem key={item} value={item}>{PRIORITY_LABEL[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>สถานะ</Label>
            <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REQUIREMENT_STATUSES.filter((item) => item !== "deleted").map((item) => (
                  <SelectItem key={item} value={item}>{STATUS_LABEL[item]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2"><Label>รายละเอียด</Label><Textarea {...form.register("description")} /></div>
          <div className="space-y-1.5"><Label>Input</Label><Textarea {...form.register("input")} /></div>
          <div className="space-y-1.5"><Label>Process</Label><Textarea {...form.register("process")} /></div>
          <div className="space-y-1.5"><Label>Output</Label><Textarea {...form.register("output")} /></div>
          <div className="space-y-1.5"><Label>เอกสารที่เกี่ยวข้อง</Label><Textarea {...form.register("relatedDocuments")} /></div>
          <div className="space-y-1.5"><Label>ปัญหาปัจจุบัน</Label><Textarea {...form.register("currentProblem")} /></div>
          <div className="space-y-1.5"><Label>ความต้องการของระบบ</Label><Textarea {...form.register("desiredBehavior")} /></div>
          <div className="space-y-1.5 md:col-span-2"><Label>หมายเหตุ</Label><Textarea {...form.register("note")} /></div>
          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
            <Button type="submit">บันทึก</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
