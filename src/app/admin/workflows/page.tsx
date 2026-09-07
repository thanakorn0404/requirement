"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WorkflowDTO } from "@/types";

export default function WorkflowsPage() {
  const [items, setItems] = useState<WorkflowDTO[]>([]);

  useEffect(() => {
    api<WorkflowDTO[]>("/api/workflows")
      .then(setItems)
      .catch((error) => toast.error(error.message));
  }, []);

  return (
    <div>
      <PageHeader
        title="การเดินหนังสือทั้งหมด"
        crumbs={[{ href: "/admin", label: "แดชบอร์ด" }, { label: "การเดินหนังสือ" }]}
      />
      {!items.length ? (
        <EmptyState title="ยังไม่มีการเดินหนังสือ" description="เริ่มสร้าง Workflow เพื่อกำหนดขั้นตอนการทำงาน" />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">เวอร์ชัน {item.currentVersion}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/organizations/${item.organizationId}/departments/${item.departmentId}/workflow/${item.id}`}>
                      เปิด
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
