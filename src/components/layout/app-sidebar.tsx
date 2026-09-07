"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileText,
  GitBranch,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

const items = [
  { href: "/admin", label: "แดชบอร์ด", icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/organizations", label: "หน่วยงาน", icon: Building2 },
  { href: "/admin/workflows", label: "การเดินหนังสือ", icon: GitBranch },
  { href: "/admin/requirements", label: "ความต้องการของระบบ", icon: FileText },
  { href: "/admin/users", label: "ผู้ใช้งาน", icon: Users, adminOnly: true },
  { href: "/admin/audit-logs", label: "ประวัติการใช้งาน", icon: ScrollText, adminOnly: true },
  { href: "/admin/settings", label: "ตั้งค่า", icon: Settings, adminOnly: false },
];

export function AppSidebar({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const { isAdmin, logout } = useAuth();

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col overflow-hidden text-white",
        collapsed ? "w-16" : "w-[272px]",
      )}
    >
      <div className="absolute inset-0 sts-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.16),transparent_42%)]" />
      <div className="relative flex h-[88px] items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-base font-bold text-sts-navy shadow-lg shadow-black/10">
          STS
        </div>
        {!collapsed && (
          <div>
            <p className="text-base font-semibold tracking-[0.12em]">STS BBS</p>
            <p className="text-sm text-white/80">ระบบสารบรรณดิจิทัล</p>
          </div>
        )}
      </div>
      <nav className="relative flex-1 space-y-2 overflow-y-auto p-4">
        {items
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const href =
              item.label === "แดชบอร์ด"
                ? isAdmin
                  ? "/admin"
                  : "/dashboard"
                : item.label === "ตั้งค่า"
                  ? isAdmin
                    ? "/admin/settings"
                    : "/dashboard/settings"
                  : item.href;
            const active =
              href === "/admin" || href === "/dashboard"
                ? pathname === href
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base transition-all duration-200",
                  active
                    ? "bg-white text-sts-navy shadow-[0_12px_24px_-16px_rgba(0,0,0,0.45)]"
                    : "text-white/85 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
      </nav>
      <div className="relative border-t border-white/10 p-4">
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-base text-white/85 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && "ออกจากระบบ"}
        </button>
      </div>
    </aside>
  );
}
