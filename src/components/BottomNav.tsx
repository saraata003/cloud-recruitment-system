"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Receipt, ShoppingCart, UtensilsCrossed } from "lucide-react";
import { useCart } from "./cart";

const items = [
  { href: "/", label: "الرئيسية", Icon: House },
  { href: "/menu", label: "المنيو", Icon: UtensilsCrossed },
  { href: "/cart", label: "السلة", Icon: ShoppingCart },
  { href: "/orders", label: "طلباتي", Icon: Receipt },
];

export function BottomNav() {
  const path = usePathname();
  const { count } = useCart();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-line bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md grid grid-cols-4">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-xs font-bold ${active ? "text-brand" : "text-muted"}`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              {label}
              {href === "/cart" && count > 0 && (
                <span className="absolute top-1.5 start-[calc(50%+6px)] min-w-5 h-5 px-1 rounded-full bg-accent text-white text-[11px] flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
