"use client";

import { toast } from "sonner";
import { BLOCK_TYPES } from "@/types";
import { BLOCK_TYPE_LABEL } from "@/lib/utils";
import { useWorkflowStore } from "@/stores/workflow.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RequirementDTO } from "@/types";

export function WorkflowProperties({
  requirements,
  onAddPerson,
  onAddRequirement,
  onEditRequirement,
}: {
  requirements: RequirementDTO[];
  onAddPerson: (blockId: string) => void;
  onAddRequirement: (blockId: string) => void;
  onEditRequirement: (requirement: RequirementDTO) => void;
}) {
  const blocks = useWorkflowStore((state) => state.blocks);
  const edges = useWorkflowStore((state) => state.edges);
  const selectedBlockIds = useWorkflowStore((state) => state.selectedBlockIds);
  const selectedEdgeId = useWorkflowStore((state) => state.selectedEdgeId);
  const selectedPersonId = useWorkflowStore((state) => state.selectedPersonId);
  const updateBlock = useWorkflowStore((state) => state.updateBlock);
  const updateEdge = useWorkflowStore((state) => state.updateEdge);
  const deleteBlocks = useWorkflowStore((state) => state.deleteBlocks);
  const duplicateBlocks = useWorkflowStore((state) => state.duplicateBlocks);
  const deleteEdge = useWorkflowStore((state) => state.deleteEdge);
  const removePersonFromBlock = useWorkflowStore((state) => state.removePersonFromBlock);
  const updateResponsibility = useWorkflowStore((state) => state.updateResponsibility);
  const selectPerson = useWorkflowStore((state) => state.selectPerson);

  const block = blocks.find((item) => item.id === selectedBlockIds[0]);
  const edge = edges.find((item) => item.id === selectedEdgeId);
  const person = block?.responsiblePersons.find((item) => item.personId === selectedPersonId);

  if (person && block) {
    return (
      <aside className="ui-layer z-10 h-full w-[360px] overflow-auto rounded-none border-y-0 border-r-0 p-5">
        <h3 className="ui-layer-title mb-4">ข้อมูลบุคลากร</h3>
        <div className="space-y-4 text-base">
          <p><span className="text-muted-foreground">ชื่อ:</span> {person.person?.displayName}</p>
          <p><span className="text-muted-foreground">ตำแหน่ง:</span> {person.person?.positionName || "-"}</p>
          <p><span className="text-muted-foreground">เบอร์โทร:</span> {person.person?.phone || "-"}</p>
          <p><span className="text-muted-foreground">อีเมล:</span> {person.person?.email || "-"}</p>
          <div className="space-y-1.5">
            <Label>หน้าที่ในตำแหน่งนี้</Label>
            <Textarea
              value={person.responsibility}
              onChange={(event) => updateResponsibility(block.id, person.personId, event.target.value)}
            />
          </div>
          {person.personInactive && <p className="text-amber-700">บุคลากรถูกปิดใช้งาน</p>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => selectPerson(null)}>กลับ</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("ต้องการนำผู้รับผิดชอบรายนี้ออกจากงานหรือไม่?")) {
                  removePersonFromBlock(block.id, person.personId);
                  selectPerson(null);
                }
              }}
            >
              นำออกจากตำแหน่ง
            </Button>
          </div>
        </div>
      </aside>
    );
  }

  if (edge) {
    return (
      <aside className="ui-layer z-10 h-full w-[360px] overflow-auto rounded-none border-y-0 border-r-0 p-5">
        <h3 className="ui-layer-title mb-4">เส้นเชื่อม</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>ข้อความบนลูกศร</Label>
            <Input value={edge.label} onChange={(event) => updateEdge(edge.id, { label: event.target.value })} />
          </div>
          <Button variant="destructive" onClick={() => deleteEdge(edge.id)}>ลบเส้น</Button>
        </div>
      </aside>
    );
  }

  if (!block) {
    return (
      <aside className="ui-layer z-10 h-full w-[360px] rounded-none border-y-0 border-r-0 p-5">
        <p className="ui-layer-title mb-2">
          <span className="ui-step">3</span>
          รายละเอียด
        </p>
        <p className="mt-2 text-base text-muted-foreground">คลิกกล่องบนแผนผัง เพื่อดูและแก้ไขรายละเอียด</p>
      </aside>
    );
  }

  const blockRequirements = requirements.filter((item) => item.blockId === block.id);

  return (
      <aside className="ui-layer z-10 h-full w-[360px] overflow-auto rounded-none border-y-0 border-r-0 p-5">
      <h3 className="ui-layer-title mb-4">
        <span className="ui-step">3</span>
        รายละเอียดตำแหน่ง
      </h3>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>ชื่อ</Label>
          <Input
            value={block.title}
            onChange={(event) => updateBlock(block.id, { title: event.target.value }, false)}
            onBlur={() => {
              const title = block.title.trim();
              updateBlock(block.id, { title: title || "งานใหม่" }, true);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label>รายละเอียด</Label>
          <Textarea value={block.description} onChange={(event) => updateBlock(block.id, { description: event.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>ประเภท</Label>
          <Select
            value={block.blockType}
            onValueChange={(value) => {
              if (value === "person") {
                toast.error("ห้ามสร้าง Block จากบุคลากร");
                return;
              }
              updateBlock(block.id, { blockType: value as never });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BLOCK_TYPES.filter((item) => item !== "person").map((item) => (
                <SelectItem key={item} value={item}>{BLOCK_TYPE_LABEL[item]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>สถานะ</Label>
          <Select value={block.status} onValueChange={(value) => updateBlock(block.id, { status: value as "active" | "inactive" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">เปิดใช้งาน</SelectItem>
              <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">ผู้รับผิดชอบ</p>
          <div className="space-y-2">
            {block.responsiblePersons.map((personItem) => (
              <div key={personItem.personId} className="rounded-2xl border border-primary/10 p-3">
                <div className="flex items-center justify-between">
                  <button type="button" className="text-base font-medium" onClick={() => selectPerson(personItem.personId)}>
                    {personItem.person?.displayName}
                  </button>
                  <button
                    type="button"
                    className="text-base text-red-600"
                    onClick={() => {
                      if (confirm("ต้องการนำผู้รับผิดชอบรายนี้ออกจากงานหรือไม่?")) {
                        removePersonFromBlock(block.id, personItem.personId);
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{personItem.responsibility || "ยังไม่ระบุหน้าที่"}</p>
              </div>
            ))}
          </div>
          <Button className="mt-2 w-full" variant="outline" onClick={() => onAddPerson(block.id)}>
            + เพิ่มผู้รับผิดชอบ
          </Button>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">ความต้องการของระบบ</p>
          <div className="space-y-2">
            {blockRequirements.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full rounded-2xl border border-primary/10 p-3 text-left"
                onClick={() => onEditRequirement(item)}
              >
                <p className="text-sm font-medium text-primary">{item.requirementCode}</p>
                <p className="text-base">{item.title}</p>
              </button>
            ))}
          </div>
          <Button className="mt-2 w-full" variant="outline" onClick={() => onAddRequirement(block.id)}>
            + เพิ่มความต้องการของระบบ
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => duplicateBlocks([block.id])}>ทำสำเนา</Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("ต้องการลบงาน/ตำแหน่งนี้หรือไม่?")) {
                deleteBlocks([block.id]);
                toast.message("ลบงานแล้ว ความต้องการของระบบที่เกี่ยวข้องจะถูกทำเครื่องหมายว่า Orphaned");
              }
            }}
          >
            ลบ
          </Button>
        </div>
      </div>
    </aside>
  );
}
