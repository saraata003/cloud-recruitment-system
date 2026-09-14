import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  accent = "stone",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  accent?: "stone" | "orange" | "violet" | "teal" | "emerald" | "sky" | "fuchsia";
}) {
  const accentClasses: Record<string, string> = {
    stone: "bg-stone-100 text-stone-600",
    orange: "bg-orange-50 text-orange-600",
    violet: "bg-violet-50 text-violet-600",
    teal: "bg-teal-50 text-teal-600",
    emerald: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
    fuchsia: "bg-fuchsia-50 text-fuchsia-600",
  };

  const content = (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", accentClasses[accent])}>
        <Icon size={19} strokeWidth={2.25} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight text-stone-900">{value}</p>
        <p className="truncate text-xs font-medium text-stone-500">{label}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
