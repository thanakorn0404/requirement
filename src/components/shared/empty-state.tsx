import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-white/70 px-6 py-16 text-center shadow-[0_18px_40px_-28px_rgba(63,13,18,0.35)]">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sts-soft text-primary">
        <Inbox className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-sts-deep">{title}</h3>
      {description && <p className="mt-1 max-w-md text-base text-muted-foreground">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
