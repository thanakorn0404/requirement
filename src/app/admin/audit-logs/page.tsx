"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { AuditLogDTO, PaginatedResult } from "@/types";

export default function AuditLogsPage() {
  const [data, setData] = useState<PaginatedResult<AuditLogDTO> | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      api<PaginatedResult<AuditLogDTO>>(`/api/audit-logs?search=${encodeURIComponent(search)}&pageSize=50`)
        .then(setData)
        .catch((error) => toast.error(error.message));
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <PageHeader
        title="ประวัติการใช้งาน"
        crumbs={[{ href: "/admin", label: "แดชบอร์ด" }, { label: "ประวัติการใช้งาน" }]}
      />
      <Input className="mb-4 max-w-md" placeholder="ค้นหา Action" value={search} onChange={(event) => setSearch(event.target.value)} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>วันที่</TableHead>
            <TableHead>ผู้ใช้งาน</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>ข้อมูล</TableHead>
            <TableHead>รายละเอียด</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{formatDate(item.createdAt)}</TableCell>
              <TableCell>{item.actorName || "-"}</TableCell>
              <TableCell>{item.action}</TableCell>
              <TableCell>{item.entityType}</TableCell>
              <TableCell className="max-w-sm truncate text-xs text-muted-foreground">
                {JSON.stringify(item.newData || item.oldData || {})}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
