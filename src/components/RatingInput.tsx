export function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-stone-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= (value ?? 0);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={
                active
                  ? "flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white"
                  : "flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-xs font-medium text-stone-400 hover:bg-stone-200"
              }
              aria-label={`${label}: ${n}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
