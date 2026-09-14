"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Kanban,
  CalendarClock,
  Star,
  UserCheck,
  Settings,
  Menu,
  X,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/interviews", label: "Interviews", icon: CalendarClock },
  { href: "/future-talent", label: "Future Talent", icon: Star },
  { href: "/hired", label: "Hired", icon: UserCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm shadow-orange-600/20">
        <Coffee size={18} strokeWidth={2.25} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-bold tracking-tight text-stone-900">DRINKAT</span>
        <span className="text-[11px] font-medium text-stone-500">Recruitment</span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-orange-50 text-orange-700" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            )}
          >
            <Icon size={18} strokeWidth={2.25} className={active ? "text-orange-600" : "text-stone-400"} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close the mobile drawer on navigation — adjusted during render (rather
  // than in an effect) per https://react.dev/learn/you-might-not-need-an-effect
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:gap-6 md:border-r md:border-stone-200 md:bg-white md:px-4 md:py-6">
        <Logo />
        <NavLinks />
        <a
          href="/apply"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-dashed border-stone-300 px-3 py-3 text-xs text-stone-500 hover:border-orange-300 hover:text-orange-700"
        >
          <span className="font-semibold text-stone-700">Public application link</span>
          <br />
          Share /apply with candidates
        </a>
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:hidden">
        <Logo />
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-6 bg-white px-4 py-6 shadow-xl">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
