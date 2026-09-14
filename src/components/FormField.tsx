export function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-stone-800">
        {label} {required && <span className="text-orange-600">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-[0.95rem] text-stone-900 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15 disabled:bg-stone-50 disabled:text-stone-400";

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  5: "grid-cols-5",
};

export function PillOptions<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (v: T) => void;
  columns?: 2 | 3 | 5;
}) {
  return (
    <div className={`grid gap-2 ${GRID_COLS[columns]}`}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              active
                ? "rounded-xl border-2 border-orange-600 bg-orange-50 px-3 py-2.5 text-sm font-semibold text-orange-700 transition-colors"
                : "rounded-xl border-2 border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-stone-300"
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ToggleYesNo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={
          value
            ? "rounded-xl border-2 border-orange-600 bg-orange-50 px-3 py-2.5 text-sm font-semibold text-orange-700"
            : "rounded-xl border-2 border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-stone-600 hover:border-stone-300"
        }
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={
          !value
            ? "rounded-xl border-2 border-orange-600 bg-orange-50 px-3 py-2.5 text-sm font-semibold text-orange-700"
            : "rounded-xl border-2 border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-stone-600 hover:border-stone-300"
        }
      >
        No
      </button>
    </div>
  );
}
