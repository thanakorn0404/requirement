"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAuth } from "@/components/providers/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Skeleton className="h-screen w-64" />
        <div className="flex-1 p-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="mt-6 h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        กำลังไปหน้าเข้าสู่ระบบ...
      </div>
    );
  }

  const hideChrome = pathname.includes("/workflow/");

  return (
    <div className="flex min-h-screen">
      {!hideChrome && (
        <div className="sticky top-0 hidden h-screen lg:block">
          <AppSidebar />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {!hideChrome && <AppHeader />}
        <main className={hideChrome ? "flex-1" : "flex-1 p-6 lg:p-8"}>{children}</main>
      </div>
    </div>
  );
}
