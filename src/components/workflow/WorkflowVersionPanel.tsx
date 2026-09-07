"use client";

import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { WorkflowVersionDTO } from "@/types";

export function WorkflowVersionPanel({
  versions,
  canRestore,
  onRestore,
  onView,
}: {
  versions: WorkflowVersionDTO[];
  canRestore: boolean;
  onRestore: (version: number) => void;
  onView: (version: number) => void;
}) {
  return (
    <div className="space-y-2">
      {versions.map((item) => (
        <div key={item.id} className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Version {item.version}</p>
            <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
          </div>
          {item.note && <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>}
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onView(item.version)}>ดู</Button>
            {canRestore && (
              <Button size="sm" onClick={() => onRestore(item.version)}>Restore</Button>
            )}
          </div>
        </div>
      ))}
      {!versions.length && <p className="text-sm text-muted-foreground">ยังไม่มีเวอร์ชันที่บันทึก</p>}
    </div>
  );
}
