"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { api, buildQuery, ClientApiError } from "@/lib/client-api";
import { ORGANIZATION_TYPES } from "@/types";
import { organizationSchema } from "@/lib/validations/organization";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { OrganizationDTO, PaginatedResult } from "@/types";

export function OrganizationList() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<PaginatedResult<OrganizationDTO> | null>(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [type, setType] = useState("");
  const [province, setProvince] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const load = async () => {
    const result = await api<PaginatedResult<OrganizationDTO>>(
      `/api/organizations${buildQuery({ search: debounced, type, province, status, page, pageSize: 24, sortBy: "name", sortOrder: "asc" })}`,
    );
    setData(result);
  };

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
    // โหลดตามตัวกรองและหน้าปัจจุบัน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, type, province, status, page]);

  const form = useForm({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      type: "อบต." as const,
      province: "",
      district: "",
      subdistrict: "",
      address: "",
      phone: "",
      email: "",
      description: "",
      logoUrl: "",
      status: "active" as const,
    },
  });

  const provinces = data?.provinces || [];

  return (
    <div>
      <PageHeader
        title="หน่วยงานท้องถิ่น"
        description="ค้นหาและจัดการหน่วยงานที่เก็บกระบวนการเดินหนังสือ"
        crumbs={[{ href: "/admin", label: "แดชบอร์ด" }, { label: "หน่วยงาน" }]}
        actions={
          isAdmin ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              เพิ่มหน่วยงาน
            </Button>
          ) : null
        }
      />
      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="ค้นหาหน่วยงาน จังหวัด อำเภอ ตำบล" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={type || "all"} onValueChange={(value) => { setType(value === "all" ? "" : value); setPage(1); }}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="ประเภท" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            {ORGANIZATION_TYPES.filter((item) => item !== "อื่นๆ").map((item) => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={province || "all"} onValueChange={(value) => { setProvince(value === "all" ? "" : value); setPage(1); }}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="จังหวัด" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกจังหวัด</SelectItem>
            {provinces.map((item) => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status || "all"} onValueChange={(value) => setStatus(value === "all" ? "" : value)}>
          <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="สถานะ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="active">เปิดใช้งาน</SelectItem>
            <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {!data?.items.length ? (
        <EmptyState
          title="ยังไม่มีข้อมูล"
          description="เริ่มต้นด้วยการเพิ่มหน่วยงานท้องถิ่น"
          actionLabel={isAdmin ? "+ เพิ่มข้อมูล" : undefined}
          onAction={isAdmin ? () => setOpen(true) : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.items.map((item) => (
            <Card key={item.id} className="card-hover overflow-hidden">
              <div className="sts-accent-bar h-1" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-primary">{item.type}</p>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">จังหวัด{item.province}{item.district ? ` · อำเภอ${item.district}` : ""}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  {item.departmentCount || 0} กอง | {item.personCount || 0} บุคลากร
                </p>
                <div className="mt-4 flex justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/organizations/${item.id}`}>ดูรายละเอียด</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {data && data.total > data.pageSize && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span>ทั้งหมด {data.total} รายการ</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>ก่อนหน้า</Button>
            <Button variant="outline" size="sm" disabled={page * data.pageSize >= data.total} onClick={() => setPage((value) => value + 1)}>ถัดไป</Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>เพิ่มหน่วยงาน</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await api("/api/organizations", { method: "POST", body: JSON.stringify(values) });
                toast.success("สร้างหน่วยงานเรียบร้อยแล้ว");
                setOpen(false);
                form.reset();
                await load();
              } catch (error) {
                toast.error(error instanceof ClientApiError ? error.message : "บันทึกไม่สำเร็จ");
              }
            })}
          >
            <div className="space-y-1.5">
              <Label>ชื่อหน่วยงาน</Label>
              <Input {...form.register("name")} />
            </div>
            <div className="space-y-1.5">
              <Label>ประเภทหน่วยงาน</Label>
              <Select value={form.watch("type")} onValueChange={(value) => form.setValue("type", value as never)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_TYPES.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5"><Label>จังหวัด</Label><Input {...form.register("province")} /></div>
              <div className="space-y-1.5"><Label>อำเภอ</Label><Input {...form.register("district")} /></div>
              <div className="space-y-1.5"><Label>ตำบล</Label><Input {...form.register("subdistrict")} /></div>
            </div>
            <div className="space-y-1.5"><Label>ที่อยู่</Label><Input {...form.register("address")} /></div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5"><Label>เบอร์โทร</Label><Input {...form.register("phone")} /></div>
              <div className="space-y-1.5"><Label>อีเมล</Label><Input {...form.register("email")} /></div>
            </div>
            <div className="space-y-1.5"><Label>คำอธิบาย</Label><Textarea {...form.register("description")} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button type="submit">สร้าง</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
