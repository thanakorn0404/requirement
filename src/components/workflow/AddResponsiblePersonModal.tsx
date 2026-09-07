"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, ClientApiError } from "@/lib/client-api";
import { useWorkflowStore } from "@/stores/workflow.store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PersonDTO, PositionDTO } from "@/types";

export function AddResponsiblePersonModal({
  open,
  onOpenChange,
  blockId,
  persons,
  positions,
  departmentId,
  onCreatedPerson,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockId: string | null;
  persons: PersonDTO[];
  positions: PositionDTO[];
  departmentId: string;
  onCreatedPerson: (person: PersonDTO) => void;
}) {
  const addPersonToBlock = useWorkflowStore((state) => state.addPersonToBlock);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [responsibility, setResponsibility] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    positionId: "",
    phone: "",
    email: "",
    description: "",
  });

  useEffect(() => {
    if (open) {
      setSelected([]);
      setResponsibility("");
      setCreating(false);
      setSearch("");
    }
  }, [open]);

  const filtered = useMemo(
    () =>
      persons.filter((item) =>
        `${item.displayName} ${item.positionName || ""}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [persons, search],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>เพิ่มผู้รับผิดชอบ</DialogTitle>
        </DialogHeader>
        {!creating ? (
          <div className="space-y-3">
            <Input placeholder="ค้นหาชื่อบุคลากร" value={search} onChange={(event) => setSearch(event.target.value)} />
            <div className="max-h-64 space-y-2 overflow-auto">
              {filtered.map((item) => (
                <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={(event) => {
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, item.id]
                          : current.filter((id) => id !== item.id),
                      );
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">{item.displayName}</p>
                    <p className="text-xs text-muted-foreground">{item.positionName || "ไม่ระบุตำแหน่ง"}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>หน้าที่ในงานนี้</Label>
              <Textarea value={responsibility} onChange={(event) => setResponsibility(event.target.value)} />
            </div>
            <Button type="button" variant="outline" onClick={() => setCreating(true)}>
              + สร้างบุคลากรใหม่
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5"><Label>ชื่อ</Label><Input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></div>
              <div className="space-y-1.5"><Label>นามสกุล</Label><Input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>ชื่อแสดงผล</Label><Input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>ตำแหน่ง</Label>
              <Select value={form.positionId || "none"} onValueChange={(value) => setForm({ ...form, positionId: value === "none" ? "" : value })}>
                <SelectTrigger><SelectValue placeholder="เลือกตำแหน่ง" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ไม่ระบุ</SelectItem>
                  {positions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5"><Label>เบอร์โทร</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
              <div className="space-y-1.5"><Label>อีเมล</Label><Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>รายละเอียด</Label><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => (creating ? setCreating(false) : onOpenChange(false))}>
            ยกเลิก
          </Button>
          <Button
            onClick={async () => {
              try {
                if (creating) {
                  const person = await api<PersonDTO>(`/api/departments/${departmentId}/persons`, {
                    method: "POST",
                    body: JSON.stringify(form),
                  });
                  onCreatedPerson(person);
                  if (blockId) addPersonToBlock(blockId, person, responsibility);
                  toast.success("สร้างบุคลากรและเพิ่มเข้างานแล้ว");
                  onOpenChange(false);
                  return;
                }
                if (!blockId || !selected.length) return;
                selected.forEach((id) => {
                  const person = persons.find((item) => item.id === id);
                  if (person) addPersonToBlock(blockId, person, responsibility);
                });
                toast.success("เพิ่มผู้รับผิดชอบแล้ว");
                onOpenChange(false);
              } catch (error) {
                toast.error(error instanceof ClientApiError ? error.message : "ไม่สามารถเพิ่มผู้รับผิดชอบได้");
              }
            }}
          >
            {creating ? "สร้างและเพิ่ม" : "เพิ่มผู้รับผิดชอบ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
