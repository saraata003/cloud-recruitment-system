import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-orange-600 text-white hover:bg-orange-700 shadow-sm shadow-orange-600/10",
  secondary: "bg-stone-900 text-white hover:bg-stone-800",
  outline: "border border-stone-300 text-stone-700 bg-white hover:bg-stone-50",
  subtle: "bg-stone-100 text-stone-700 hover:bg-stone-200",
  danger: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  ghost: "text-stone-600 hover:bg-stone-100",
  whatsapp: "bg-[#25D366] text-white hover:bg-[#1fb959]",
} as const;

const SIZES = {
  sm: "text-xs px-2.5 py-1.5 gap-1 rounded-lg",
  md: "text-sm px-3.5 py-2 gap-1.5 rounded-xl",
  lg: "text-[0.95rem] px-5 py-2.5 gap-2 rounded-xl",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export function buttonClasses(opts: { variant?: ButtonVariant; size?: ButtonSize; full?: boolean; className?: string } = {}) {
  const { variant = "primary", size = "md", full = false, className } = opts;
  return cn(
    "inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
    VARIANTS[variant],
    SIZES[size],
    full && "w-full",
    className
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}

export function Button({ variant, size, full, className, ...props }: ButtonProps) {
  return <button className={buttonClasses({ variant, size, full, className })} {...props} />;
}

export function LinkButton({
  href,
  variant,
  size,
  full,
  className,
  children,
  ...props
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, full, className })} {...props}>
      {children}
    </Link>
  );
}
