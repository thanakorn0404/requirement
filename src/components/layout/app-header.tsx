"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { ROLE_LABEL } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { GlobalSearch } from "@/components/layout/global-search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/75 backdrop-blur-xl">
      <div className="sts-accent-bar h-1 w-full" />
      <div className="flex h-[80px] items-center justify-between px-6">
        <div>
          <p className="text-lg font-semibold tracking-wide text-sts-deep">ระบบจัดเก็บ Requirement สารบรรณ</p>
          <p className="text-sm text-muted-foreground">STS System & Development · หน่วยงานท้องถิ่น</p>
        </div>
        <div className="flex items-center gap-3">
          <GlobalSearch />
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="การแจ้งเตือน" title="การแจ้งเตือน">
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-2xl border border-primary/8 bg-white/90 px-3 py-1.5 text-left shadow-sm transition hover:bg-sts-soft">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white shadow-md shadow-primary/25">
                  {user?.name?.slice(0, 1) || "U"}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABEL[user?.role || ""]}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>{user?.email}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(user?.role === "ADMIN" ? "/admin/settings" : "/dashboard/settings")}>
                ตั้งค่า / เปลี่ยน PIN
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout()}>ออกจากระบบ</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
