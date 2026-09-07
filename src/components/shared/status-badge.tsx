import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "active" || status === "approved" || status === "implemented"
      ? "success"
      : status === "inactive" || status === "archived"
        ? "secondary"
        : status === "rejected" || status === "deleted"
          ? "danger"
          : status === "review" || status === "draft"
            ? "warning"
            : "info";
  return <Badge variant={variant}>{STATUS_LABEL[status] || status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const variant =
    priority === "critical"
      ? "danger"
      : priority === "high"
        ? "warning"
        : priority === "medium"
          ? "info"
          : "secondary";
  return <Badge variant={variant}>{PRIORITY_LABEL[priority] || priority}</Badge>;
}
