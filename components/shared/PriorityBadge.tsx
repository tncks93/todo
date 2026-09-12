import { cn } from "@/lib/utils";
import type { Priority } from "@/types";

const STYLES: Record<Priority, string> = {
  high: "bg-primary-disabled text-primary-active",
  medium: "bg-surface-strong text-ink",
  low: "bg-surface-soft text-muted",
};

const LABELS: Record<Priority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[priority]
      )}
    >
      {LABELS[priority]}
    </span>
  );
}
