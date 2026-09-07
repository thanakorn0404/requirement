"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { api, ClientApiError } from "@/lib/client-api";
import { DEPARTMENT_TYPES, ORGANIZATION_TYPES } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DepartmentDTO, OrganizationDTO, RequirementDTO, WorkflowDTO } from "@/types";

export function OrganizationDetail({ organizationId }: { organizationId: string }) {
  const { canWrite, isAdmin } = useAuth();
  const [organization, setOrganization] = useState<OrganizationDTO | null>(null);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDTO[]>([]);
  const [requirements, setRequirements] = useState<RequirementDTO[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState<DepartmentDTO | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const form = useForm({
    defaultValues: { name: "", code: "", type: "กอง", description: "", status: "active" },
  });
  const orgForm = useForm({
    defaultValues: {
      name: "",
      type: "อบต.",
      province: "",
      district: "",
      subdistrict: "",
      address: "",
      phone: "",
      email: "",
      description: "",
      status: "active",
    },
  });

  const load = async () => {
    const [org, deps, reqs, flows] = await Promise.all([
      api<OrganizationDTO>(`/api/organizations/${organizationId}`),
      api<DepartmentDTO[]>(`/api/organizations/${organizationId}/departments`),
      api<{ items: RequirementDTO[] }>(`/api/requirements?organizationId=${organizationId}&pageSize=50`),
      api<WorkflowDTO[]>("/api/workflows"),
    ]);
    setOrganization(org);
    setDepartments(deps);
    setRequirements(reqs.items);
    setWorkflows(flows.filter((item) => item.organizationId === organizationId));
    orgForm.reset({
      name: org.name,
      type: org.type,
      province: org.province,
      district: org.district,
      subdistrict: org.subdistrict,
      address: org.address,
      phone: org.phone,
      email: org.email,
      description: org.description,
      status: org.status,
    });
  };

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
    // โหลดครั้งแรกเมื่อเข้าหน้าหน่วยงาน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  if (!organization) return <p className="text-sm text-muted-foreground">กำลังโหลด...</p>;

  return (
    <div>
      <Button asChild variant="ghost" className="mb-3 px-0">
        <Link href="/admin/organizations"><ArrowLeft className="h-4 w-4" /> กลับ</Link>
      </Button>
      <PageHeader
        title={organization.name}
        description={`จังหวัด${organization.province}${organization.district ? ` · อำเภอ${organization.district}` : ""}${organization.subdistrict ? ` · ตำบล${organization.subdistrict}` : ""}`}
        crumbs={[
          { href: "/admin", label: "แดชบอร์ด" },
          { href: "/admin/organizations", label: "หน่วยงาน" },
          { label: organization.name },
        ]}
        actions={
          isAdmin ? (
            <Button variant="outline" onClick={() => setEditing(true)}>แก้ไขข้อมูล</Button>
          ) : null
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          ["จำนวนกอง", organization.departmentCount],
          ["บุคลากร", organization.personCount],
          ["การเดินหนังสือ", organization.workflowCount],
          ["ความต้องการของระบบ", organization.requirementCount],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{Number(value || 0).toLocaleString("th-TH")}</CardContent>
          </Card>
        ))}
      </div>
      <Tabs defaultValue="info">
        <TabsList className="flex-wrap">
          <TabsTrigger value="info">ข้อมูลหน่วยงาน</TabsTrigger>
          <TabsTrigger value="departments">กอง / สำนัก</TabsTrigger>
          <TabsTrigger value="workflows">การเดินหนังสือ</TabsTrigger>
          <TabsTrigger value="requirements">ความต้องการของระบบ</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <Card>
            <CardContent className="grid gap-3 p-6 md:grid-cols-2">
              <p><span className="text-muted-foreground">ประเภท:</span> {organization.type}</p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">สถานะ:</span>
                <StatusBadge status={organization.status} />
              </div>
              <p><span className="text-muted-foreground">เบอร์โทร:</span> {organization.phone || "-"}</p>
              <p><span className="text-muted-foreground">อีเมล:</span> {organization.email || "-"}</p>
              <p className="md:col-span-2"><span className="text-muted-foreground">ที่อยู่:</span> {organization.address || "-"}</p>
              <p className="md:col-span-2"><span className="text-muted-foreground">รายละเอียด:</span> {organization.description || "-"}</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="departments">
          <div className="mb-3 flex justify-end">
            {canWrite && (
              <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> สร้างกอง / สำนัก</Button>
            )}
          </div>
          {!departments.length ? (
            <EmptyState title="ยังไม่มีข้อมูล" actionLabel={canWrite ? "+ เพิ่มข้อมูล" : undefined} onAction={() => setOpen(true)} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {departments.map((item) => (
                <Card key={item.id} className="card-hover">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/admin/organizations/${organizationId}/departments/${item.id}`}
                        className="min-w-0 flex-1"
                      >
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.type} {item.code && `· ${item.code}`}
                        </p>
                      </Link>
                      <div className="flex shrink-0 items-center gap-1">
                        <StatusBadge status={item.status} />
                        {canWrite && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`ลบ ${item.name}`}
                            onClick={() => setDeleting(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="workflows">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>เวอร์ชัน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell>{item.currentVersion}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="requirements">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirements.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.requirementCode}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>สร้างกอง / สำนัก</DialogTitle></DialogHeader>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await api(`/api/organizations/${organizationId}/departments`, {
                  method: "POST",
                  body: JSON.stringify(values),
                });
                toast.success("สร้างกอง / สำนักเรียบร้อยแล้ว");
                setOpen(false);
                form.reset();
                await load();
              } catch (error) {
                toast.error(error instanceof ClientApiError ? error.message : "บันทึกไม่สำเร็จ");
              }
            })}
          >
            <div className="space-y-1.5"><Label>ชื่อ</Label><Input {...form.register("name")} /></div>
            <div className="space-y-1.5"><Label>รหัส</Label><Input {...form.register("code")} /></div>
            <div className="space-y-1.5">
              <Label>ประเภท</Label>
              <Select value={form.watch("type")} onValueChange={(value) => form.setValue("type", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>คำอธิบาย</Label><Textarea {...form.register("description")} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button type="submit">สร้าง</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(next) => !next && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบกอง / สำนัก</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบ {deleting?.name} หรือไม่ ข้อมูลนี้จะไม่แสดงในรายการอีกต่อไป
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBusy}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deletingBusy}
              onClick={async (event) => {
                event.preventDefault();
                if (!deleting) return;
                setDeletingBusy(true);
                try {
                  await api(`/api/departments/${deleting.id}`, { method: "DELETE" });
                  toast.success("ลบกอง / สำนักแล้ว");
                  setDeleting(null);
                  await load();
                } catch (error) {
                  toast.error(error instanceof ClientApiError ? error.message : "ลบไม่สำเร็จ");
                } finally {
                  setDeletingBusy(false);
                }
              }}
            >
              {deletingBusy ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader><DialogTitle>แก้ไขข้อมูลหน่วยงาน</DialogTitle></DialogHeader>
          <form
            className="space-y-3"
            onSubmit={orgForm.handleSubmit(async (values) => {
              try {
                await api(`/api/organizations/${organizationId}`, {
                  method: "PATCH",
                  body: JSON.stringify(values),
                });
                toast.success("บันทึกข้อมูลหน่วยงานแล้ว");
                setEditing(false);
                await load();
              } catch (error) {
                toast.error(error instanceof ClientApiError ? error.message : "บันทึกไม่สำเร็จ");
              }
            })}
          >
            <div className="space-y-1.5"><Label>ชื่อหน่วยงาน</Label><Input {...orgForm.register("name")} /></div>
            <div className="space-y-1.5">
              <Label>ประเภท</Label>
              <Select value={orgForm.watch("type")} onValueChange={(value) => orgForm.setValue("type", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5"><Label>จังหวัด</Label><Input {...orgForm.register("province")} /></div>
              <div className="space-y-1.5"><Label>อำเภอ</Label><Input {...orgForm.register("district")} /></div>
              <div className="space-y-1.5"><Label>ตำบล</Label><Input {...orgForm.register("subdistrict")} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>ยกเลิก</Button>
              <Button type="submit">บันทึก</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
