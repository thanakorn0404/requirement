"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import { api, ClientApiError } from "@/lib/client-api";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  DepartmentDTO,
  OrganizationDTO,
  PersonDTO,
  PositionDTO,
  RequirementDTO,
  WorkflowDTO,
} from "@/types";

export function DepartmentWorkspace({
  organizationId,
  departmentId,
}: {
  organizationId: string;
  departmentId: string;
}) {
  const { canWrite } = useAuth();
  const [organization, setOrganization] = useState<OrganizationDTO | null>(null);
  const [department, setDepartment] = useState<DepartmentDTO | null>(null);
  const [positions, setPositions] = useState<PositionDTO[]>([]);
  const [persons, setPersons] = useState<PersonDTO[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDTO[]>([]);
  const [requirements, setRequirements] = useState<RequirementDTO[]>([]);
  const [positionOpen, setPositionOpen] = useState(false);
  const [personOpen, setPersonOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const positionForm = useForm({ defaultValues: { name: "", code: "", level: 0, description: "" } });
  const personForm = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      displayName: "",
      positionId: "",
      phone: "",
      email: "",
      description: "",
    },
  });
  const workflowForm = useForm({ defaultValues: { name: "", description: "" } });

  const load = async () => {
    const [org, dept, pos, people, flows, reqs] = await Promise.all([
      api<OrganizationDTO>(`/api/organizations/${organizationId}`),
      api<DepartmentDTO>(`/api/departments/${departmentId}`),
      api<PositionDTO[]>(`/api/departments/${departmentId}/positions`),
      api<PersonDTO[]>(`/api/departments/${departmentId}/persons`),
      api<WorkflowDTO[]>(`/api/departments/${departmentId}/workflows`),
      api<{ items: RequirementDTO[] }>(`/api/departments/${departmentId}/requirements?pageSize=50`),
    ]);
    setOrganization(org);
    setDepartment(dept);
    setPositions(pos);
    setPersons(people);
    setWorkflows(flows);
    setRequirements(reqs.items);
  };

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
    // โหลดครั้งแรกเมื่อเข้าหน้ากอง / สำนัก
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  if (!department || !organization) return <p className="text-sm text-muted-foreground">กำลังโหลด...</p>;

  return (
    <div>
      <Button asChild variant="ghost" className="mb-3 px-0">
        <Link href={`/admin/organizations/${organizationId}`}><ArrowLeft className="h-4 w-4" /> กลับ</Link>
      </Button>
      <PageHeader
        title={department.name}
        description={organization.name}
        crumbs={[
          { href: "/admin", label: "แดชบอร์ด" },
          { href: "/admin/organizations", label: "หน่วยงาน" },
          { href: `/admin/organizations/${organizationId}`, label: organization.name },
          { label: department.name },
        ]}
        actions={
          canWrite ? (
            <>
              <Button variant="outline" onClick={() => setPositionOpen(true)}><Plus className="h-4 w-4" /> สร้างตำแหน่ง</Button>
              <Button variant="outline" onClick={() => setPersonOpen(true)}><Plus className="h-4 w-4" /> สร้างบุคลากร</Button>
              <Button onClick={() => setWorkflowOpen(true)}><Plus className="h-4 w-4" /> สร้างการเดินหนังสือ</Button>
            </>
          ) : null
        }
      />
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="positions">ตำแหน่ง</TabsTrigger>
          <TabsTrigger value="persons">บุคลากร</TabsTrigger>
          <TabsTrigger value="workflows">การเดินหนังสือ</TabsTrigger>
          <TabsTrigger value="requirements">ความต้องการของระบบ</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["ตำแหน่ง", positions.length],
              ["บุคลากร", persons.length],
              ["การเดินหนังสือ", workflows.length],
              ["ความต้องการของระบบ", requirements.length],
            ].map(([label, value]) => (
              <Card key={String(label)}>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="positions">
          {!positions.length ? (
            <EmptyState title="ยังไม่มีตำแหน่ง" actionLabel={canWrite ? "+ สร้างตำแหน่ง" : undefined} onAction={() => setPositionOpen(true)} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อตำแหน่ง</TableHead>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ระดับ</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.code || "-"}</TableCell>
                    <TableCell>{item.level}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        <TabsContent value="persons">
          {!persons.length ? (
            <EmptyState title="ยังไม่มีบุคลากร" actionLabel={canWrite ? "+ สร้างบุคลากร" : undefined} onAction={() => setPersonOpen(true)} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อแสดงผล</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead>เบอร์โทร</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {persons.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.displayName}</TableCell>
                    <TableCell>{item.positionName || "-"}</TableCell>
                    <TableCell>{item.phone || "-"}</TableCell>
                    <TableCell>{item.email || "-"}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        <TabsContent value="workflows">
          {!workflows.length ? (
            <EmptyState
              title="ยังไม่มีการเดินหนังสือ"
              description="เริ่มสร้าง Workflow เพื่อกำหนดขั้นตอนการทำงาน"
              actionLabel={canWrite ? "+ สร้างการเดินหนังสือ" : undefined}
              onAction={() => setWorkflowOpen(true)}
            />
          ) : (
            <div className="grid gap-3">
              {workflows.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">เวอร์ชัน {item.currentVersion}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} />
                      <Button asChild size="sm">
                        <Link href={`/admin/organizations/${organizationId}/departments/${departmentId}/workflow/${item.id}`}>
                          เปิดตัวสร้าง
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="requirements">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ความต้องการของระบบ</TableHead>
                <TableHead>งาน / ตำแหน่ง</TableHead>
                <TableHead>ผู้รับผิดชอบ</TableHead>
                <TableHead>ความสำคัญ</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirements.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.requirementCode}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.blockTitle || "-"}</TableCell>
                  <TableCell>{item.personName || "-"}</TableCell>
                  <TableCell><PriorityBadge priority={item.priority} /></TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Dialog open={positionOpen} onOpenChange={setPositionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>สร้างตำแหน่ง</DialogTitle></DialogHeader>
          <form
            className="space-y-3"
            onSubmit={positionForm.handleSubmit(async (values) => {
              try {
                await api(`/api/departments/${departmentId}/positions`, {
                  method: "POST",
                  body: JSON.stringify({ ...values, level: Number(values.level || 0) }),
                });
                toast.success("สร้างตำแหน่งแล้ว");
                setPositionOpen(false);
                positionForm.reset();
                await load();
              } catch (error) {
                toast.error(error instanceof ClientApiError ? error.message : "บันทึกไม่สำเร็จ");
              }
            })}
          >
            <div className="space-y-1.5"><Label>ชื่อ</Label><Input {...positionForm.register("name")} /></div>
            <div className="space-y-1.5"><Label>รหัส</Label><Input {...positionForm.register("code")} /></div>
            <div className="space-y-1.5"><Label>ระดับ</Label><Input type="number" {...positionForm.register("level", { valueAsNumber: true })} /></div>
            <div className="space-y-1.5"><Label>รายละเอียด</Label><Textarea {...positionForm.register("description")} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPositionOpen(false)}>ยกเลิก</Button>
              <Button type="submit">สร้าง</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={personOpen} onOpenChange={setPersonOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>สร้างบุคลากร</DialogTitle></DialogHeader>
          <form
            className="space-y-3"
            onSubmit={personForm.handleSubmit(async (values) => {
              try {
                await api(`/api/departments/${departmentId}/persons`, {
                  method: "POST",
                  body: JSON.stringify(values),
                });
                toast.success("สร้างบุคลากรแล้ว");
                setPersonOpen(false);
                personForm.reset();
                await load();
              } catch (error) {
                toast.error(error instanceof ClientApiError ? error.message : "บันทึกไม่สำเร็จ");
              }
            })}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5"><Label>ชื่อ</Label><Input {...personForm.register("firstName")} /></div>
              <div className="space-y-1.5"><Label>นามสกุล</Label><Input {...personForm.register("lastName")} /></div>
            </div>
            <div className="space-y-1.5"><Label>ชื่อแสดงผล</Label><Input {...personForm.register("displayName")} /></div>
            <div className="space-y-1.5">
              <Label>ตำแหน่ง</Label>
              <Select value={personForm.watch("positionId") || "none"} onValueChange={(value) => personForm.setValue("positionId", value === "none" ? "" : value)}>
                <SelectTrigger><SelectValue placeholder="เลือกตำแหน่ง" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ไม่ระบุ</SelectItem>
                  {positions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5"><Label>เบอร์โทร</Label><Input {...personForm.register("phone")} /></div>
              <div className="space-y-1.5"><Label>อีเมล</Label><Input {...personForm.register("email")} /></div>
            </div>
            <div className="space-y-1.5"><Label>รายละเอียด</Label><Textarea {...personForm.register("description")} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPersonOpen(false)}>ยกเลิก</Button>
              <Button type="submit">สร้าง</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={workflowOpen} onOpenChange={setWorkflowOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>สร้างการเดินหนังสือ</DialogTitle></DialogHeader>
          <form
            className="space-y-3"
            onSubmit={workflowForm.handleSubmit(async (values) => {
              try {
                const created = await api<WorkflowDTO>(`/api/departments/${departmentId}/workflows`, {
                  method: "POST",
                  body: JSON.stringify(values),
                });
                toast.success("สร้างการเดินหนังสือแล้ว");
                setWorkflowOpen(false);
                workflowForm.reset();
                window.location.href = `/admin/organizations/${organizationId}/departments/${departmentId}/workflow/${created.id}`;
              } catch (error) {
                toast.error(error instanceof ClientApiError ? error.message : "บันทึกไม่สำเร็จ");
              }
            })}
          >
            <div className="space-y-1.5"><Label>ชื่อ</Label><Input {...workflowForm.register("name")} /></div>
            <div className="space-y-1.5"><Label>รายละเอียด</Label><Textarea {...workflowForm.register("description")} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWorkflowOpen(false)}>ยกเลิก</Button>
              <Button type="submit">สร้าง</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
