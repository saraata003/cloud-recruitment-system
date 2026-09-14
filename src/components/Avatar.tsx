import { getAvatarColors, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-28 w-28 text-3xl",
} as const;

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const sizeClass = SIZE_CLASSES[size];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn(sizeClass, "rounded-full object-cover ring-1 ring-black/5 shrink-0 bg-stone-100", className)}
      />
    );
  }

  const { bg, fg } = getAvatarColors(name);
  return (
    <div
      className={cn(sizeClass, "rounded-full flex items-center justify-center font-semibold shrink-0 ring-1 ring-black/5", className)}
      style={{ backgroundColor: bg, color: fg }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
