"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

export function PageHeader({ title, back = true, end }: { title: string; back?: boolean; end?: React.ReactNode }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-line">
      <div className="h-14 px-4 flex items-center gap-2">
        {back && (
          <button onClick={() => router.back()} aria-label="رجوع" className="w-10 h-10 -ms-2 flex items-center justify-center rounded-full hover:bg-surface">
            <ChevronRight size={24} />
          </button>
        )}
        <h1 className="text-lg font-extrabold flex-1">{title}</h1>
        {end}
      </div>
    </header>
  );
}
