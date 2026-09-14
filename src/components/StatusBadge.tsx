import { STAGE_COLORS, STAGE_LABELS, type Stage } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ stage, className }: { stage: string; className?: string }) {
  const colors = STAGE_COLORS[stage as Stage] ?? STAGE_COLORS.NEW;
  const label = STAGE_LABELS[stage as Stage] ?? stage;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        colors.bg,
        colors.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {label}
    </span>
  );
}
