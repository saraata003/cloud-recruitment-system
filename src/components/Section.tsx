import type { LucideIcon } from "lucide-react";

export function Section({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
          {Icon && <Icon size={16} className="text-stone-400" />}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  const isEmpty = value === null || value === undefined || value === "";
  return (
    <div>
      <dt className="text-xs text-stone-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-stone-800">{isEmpty ? "—" : value}</dd>
    </div>
  );
}
