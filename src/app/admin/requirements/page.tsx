"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { PageHeader } from "@/components/layout/page-header";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { PaginatedResult, RequirementDTO } from "@/types";

export default function RequirementsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResult<RequirementDTO> | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      api<PaginatedResult<RequirementDTO>>(`/api/requirements?search=${encodeURIComponent(search)}&pageSize=50`)
        .then(setData)
        .catch((error) => toast.error(error.message));
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <PageHeader
        title="ความต้องการของระบบทั้งหมด"
        crumbs={[{ href: "/admin", label: "แดชบอร์ด" }, { label: "ความต้องการของระบบ" }]}
      />
      <Input className="mb-4 max-w-md" placeholder="ค้นหารหัสหรือชื่อ" value={search} onChange={(event) => setSearch(event.target.value)} />
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
          {data?.items.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer"
              onClick={() => {
                router.push(`/admin/organizations/${item.organizationId}/departments/${item.departmentId}`);
              }}
            >
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
    </div>
  );
}
