"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, FileText, GitBranch, Users } from "lucide-react";
import { api } from "@/lib/client-api";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/types";

const cards = [
  { key: "organizationCount", label: "หน่วยงาน", icon: Building2, tone: "bg-sts-soft text-sts-deep", href: "/admin/organizations" },
  { key: "departmentCount", label: "กอง / สำนัก", icon: Building2, tone: "bg-sts-soft text-sts-dark", href: "/admin/organizations" },
  { key: "personCount", label: "บุคลากร", icon: Users, tone: "bg-sts-red-soft text-sts-red", href: "/admin/organizations" },
  { key: "requirementCount", label: "ความต้องการของระบบ", icon: FileText, tone: "bg-sts-red-soft text-sts-red", href: "/admin/requirements" },
] as const;

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api<DashboardStats>("/api/dashboard").then(setStats).catch(() => setStats(null));
  }, []);

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="แดชบอร์ด" description="สรุปข้อมูลหน่วยงาน การเดินหนังสือ และความต้องการของระบบ" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.key} href={card.href}>
              <Card className="card-hover overflow-hidden">
                <div className="sts-accent-bar h-1" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                  <div className={`rounded-lg p-2 ${card.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-sts-deep">{stats[card.key].toLocaleString("th-TH")}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sts-deep">หน่วยงานล่าสุด</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentOrganizations.map((item) => (
              <Link key={item.id} href={`/admin/organizations/${item.id}`} className="block rounded-2xl border border-primary/8 bg-white/70 p-3 transition hover:bg-sts-soft">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">จังหวัด{item.province}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sts-deep">การเดินหนังสือล่าสุด</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentWorkflows.map((item) => (
              <Link
                key={item.id}
                href={`/admin/organizations/${item.organizationId}/departments/${item.departmentId}/workflow/${item.id}`}
                className="block rounded-2xl border border-primary/8 bg-white/70 p-3 transition hover:bg-sts-soft"
              >
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">เวอร์ชัน {item.currentVersion}</p>
              </Link>
            ))}
            {stats.recentWorkflows.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีการเดินหนังสือ</p>}
          </CardContent>
        </Card>
        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sts-deep">ความต้องการของระบบล่าสุด</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentRequirements.map((item) => (
              <Link
                key={item.id}
                href={`/admin/organizations/${item.organizationId}/departments/${item.departmentId}`}
                className="block rounded-2xl border border-primary/8 bg-white/70 p-3 transition hover:bg-sts-soft"
              >
                <p className="text-xs font-medium text-primary">{item.requirementCode}</p>
                <p className="font-medium">{item.title}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sts-deep">กิจกรรมล่าสุด</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentActivities.map((item) => (
              <div key={item.id} className="rounded-2xl border border-primary/8 bg-white/70 p-3">
                <p className="text-sm font-medium">{item.action}</p>
                <p className="text-xs text-muted-foreground">
                  {item.actorName || "ผู้ใช้"} · {formatDate(item.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4 border-primary/10">
        <CardContent className="flex items-center gap-3 pt-6">
          <GitBranch className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            การเดินหนังสือทั้งหมด {stats.workflowCount.toLocaleString("th-TH")} รายการ
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
