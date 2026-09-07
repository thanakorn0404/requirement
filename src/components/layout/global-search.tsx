"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { api } from "@/lib/client-api";
import { Input } from "@/components/ui/input";
import type { OrganizationDTO, RequirementDTO, WorkflowDTO } from "@/types";

type SearchResult = {
  organizations: OrganizationDTO[];
  workflows: WorkflowDTO[];
  requirements: RequirementDTO[];
};

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResult(null);
      return;
    }
    const timer = window.setTimeout(() => {
      api<SearchResult>(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then(setResult)
        .catch(() => setResult(null));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const hasItems =
    (result?.organizations.length || 0) +
      (result?.workflows.length || 0) +
      (result?.requirements.length || 0) >
    0;

  return (
    <div ref={boxRef} className="relative hidden md:block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="w-72 border-primary/15 bg-sts-soft/40 pl-9 focus-visible:ring-primary"
        placeholder="ค้นหาหน่วยงาน การเดินหนังสือ..."
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border bg-white shadow-lg">
          {!hasItems ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">ไม่พบผลลัพธ์</p>
          ) : (
            <div className="max-h-80 overflow-auto py-1">
              {result?.organizations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-sts-soft"
                  onClick={() => go(`/admin/organizations/${item.id}`)}
                >
                  <p className="text-[11px] text-muted-foreground">หน่วยงาน</p>
                  <p className="font-medium">{item.name}</p>
                </button>
              ))}
              {result?.workflows.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-sts-soft"
                  onClick={() =>
                    go(`/admin/organizations/${item.organizationId}/departments/${item.departmentId}/workflow/${item.id}`)
                  }
                >
                  <p className="text-[11px] text-muted-foreground">การเดินหนังสือ</p>
                  <p className="font-medium">{item.name}</p>
                </button>
              ))}
              {result?.requirements.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-sts-soft"
                  onClick={() =>
                    go(`/admin/organizations/${item.organizationId}/departments/${item.departmentId}`)
                  }
                >
                  <p className="text-[11px] text-muted-foreground">{item.requirementCode}</p>
                  <p className="font-medium">{item.title}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
