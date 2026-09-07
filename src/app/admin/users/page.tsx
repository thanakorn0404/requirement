"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { api, ClientApiError } from "@/lib/client-api";
import { ROLE_LABEL } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserDTO } from "@/types";

type UserFormValues = {
  name: string;
  username: string;
  email: string;
  pin: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  status: "active" | "inactive";
};

export default function UsersPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<UserDTO[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserDTO | null>(null);
  const form = useForm<UserFormValues>({
    defaultValues: { name: "", username: "", email: "", pin: "", role: "EDITOR", status: "active" },
  });

  const load = async () => setItems(await api<UserDTO[]>("/api/users"));

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", username: "", email: "", pin: "", role: "EDITOR", status: "active" });
    setOpen(true);
  };

  const openEdit = (item: UserDTO) => {
    setEditing(item);
    form.reset({
      name: item.name,
      username: item.username || "",
      email: item.email,
      pin: "",
      role: item.role,
      status: item.status === "inactive" ? "inactive" : "active",
    });
    setOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="ผู้ใช้งาน"
        crumbs={[{ href: "/admin", label: "แดชบอร์ด" }, { label: "ผู้ใช้งาน" }]}
        actions={<Button onClick={openCreate}>เพิ่มผู้ใช้</Button>}
      />
      {!items.length ? (
        <EmptyState title="ยังไม่มีผู้ใช้" actionLabel="+ เพิ่มผู้ใช้" onAction={openCreate} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>อีเมล</TableHead>
              <TableHead>สิทธิ์</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.username || "-"}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{ROLE_LABEL[item.role]}</TableCell>
                <TableCell><StatusBadge status={item.status} /></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" aria-label="แก้ไข" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="ลบ"
                    disabled={item.id === user?.id}
                    onClick={async () => {
                      if (item.id === user?.id) return;
                      if (!window.confirm(`ลบผู้ใช้ ${item.name}?`)) return;
                      try {
                        await api(`/api/users/${item.id}`, { method: "DELETE" });
                        toast.success("ลบผู้ใช้แล้ว");
                        await load();
                      } catch (error) {
                        toast.error(error instanceof ClientApiError ? error.message : "ลบไม่สำเร็จ");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit(async (values) => {
              const pin = values.pin.replace(/\D/g, "");
              if (!values.name.trim()) {
                toast.error("กรุณากรอกชื่อ");
                return;
              }
              if (!/^[a-z0-9._-]{3,32}$/.test(values.username.trim().toLowerCase())) {
                toast.error("Username ใช้ได้เฉพาะ a-z, 0-9, จุด, _ และ - อย่างน้อย 3 ตัว");
                return;
              }
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
                toast.error("รูปแบบอีเมลไม่ถูกต้อง");
                return;
              }
              if (!editing && !/^\d{6}$/.test(pin)) {
                toast.error("PIN ต้องเป็นตัวเลข 6 หลัก");
                return;
              }
              if (editing && pin && !/^\d{6}$/.test(pin)) {
                toast.error("PIN ต้องเป็นตัวเลข 6 หลัก");
                return;
              }
              try {
                const payload = {
                  ...values,
                  pin,
                };
                if (editing && !payload.pin) {
                  delete (payload as { pin?: string }).pin;
                }
                if (editing) {
                  await api(`/api/users/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
                  toast.success("บันทึกผู้ใช้แล้ว");
                } else {
                  await api("/api/users", { method: "POST", body: JSON.stringify(payload) });
                  toast.success("สร้างผู้ใช้แล้ว");
                }
                setOpen(false);
                form.reset();
                await load();
              } catch (error) {
                toast.error(error instanceof ClientApiError ? error.message : "บันทึกไม่สำเร็จ");
              }
            })}
          >
            <div className="space-y-1.5">
              <Label>ชื่อ</Label>
              <Input {...form.register("name")} />
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input
                autoComplete="off"
                placeholder="เช่น thanakorn"
                {...form.register("username")}
                onChange={(event) => form.setValue("username", event.target.value.toLowerCase())}
              />
              <p className="text-xs text-muted-foreground">ห้ามซ้ำ ใช้เข้าสู่ระบบคู่กับ PIN</p>
            </div>
            <div className="space-y-1.5">
              <Label>อีเมล</Label>
              <Input type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{editing ? "PIN ใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" : "PIN 6 หลัก"}</Label>
              <Input
                inputMode="numeric"
                maxLength={6}
                placeholder="เช่น 456789"
                {...form.register("pin")}
                onChange={(event) => form.setValue("pin", event.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <p className="text-xs text-muted-foreground">PIN ซ้ำกับผู้ใช้อื่นได้</p>
            </div>
            <div className="space-y-1.5">
              <Label>สิทธิ์</Label>
              <Select value={form.watch("role")} onValueChange={(value) => form.setValue("role", value as UserFormValues["role"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ผู้ดูแลระบบ</SelectItem>
                  <SelectItem value="EDITOR">ผู้แก้ไข</SelectItem>
                  <SelectItem value="VIEWER">ผู้ดูข้อมูล</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>สถานะ</Label>
              <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as UserFormValues["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">เปิดใช้งาน</SelectItem>
                  <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button type="submit">{editing ? "บันทึก" : "สร้าง"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
