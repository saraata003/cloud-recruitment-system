"use client";

import { useState } from "react";
import type { StoreStatus } from "@/lib/types";

const OPTIONS: { id: StoreStatus; label: string; cls: string }[] = [
  { id: "open", label: "OPEN", cls: "bg-green-500" },
  { id: "busy", label: "BUSY +10", cls: "bg-amber-500" },
  { id: "very_busy", label: "VERY BUSY +20", cls: "bg-accent" },
  { id: "paused", label: "PAUSED", cls: "bg-red-600" },
];

/** Store status switch for the manager. BUSY / VERY BUSY add time, PAUSED blocks new orders. */
export function StoreStatusControl({ initial }: { initial: StoreStatus }) {
  const [status, setStatus] = useState(initial);
  const change = async (s: StoreStatus) => {
    if (s === "paused" && !confirm("إيقاف استقبال الطلبات الجديدة؟")) return;
    const res = await fetch("/api/kitchen/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_status: s }),
    });
    if (res.ok) setStatus(s);
  };
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar" dir="ltr">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          onClick={() => change(o.id)}
          className={`shrink-0 h-9 px-3 rounded-full text-xs font-extrabold transition ${
            status === o.id ? `${o.cls} text-white` : "bg-white/15 text-white/80 hover:bg-white/25"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
