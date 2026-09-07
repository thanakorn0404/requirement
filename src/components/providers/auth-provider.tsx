"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import type { SessionUser } from "@/types";

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  canWrite: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = async () => {
    try {
      const data = await api<SessionUser>("/api/auth/me");
      setUser(data);
    } catch {
      setUser(null);
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    if (pathname.startsWith("/share") || pathname.startsWith("/login")) {
      setLoading(false);
      return;
    }
    refresh();
  }, [pathname]);

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      logout,
      canWrite: user?.role === "ADMIN" || user?.role === "EDITOR",
      isAdmin: user?.role === "ADMIN",
    }),
    [user, loading, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
