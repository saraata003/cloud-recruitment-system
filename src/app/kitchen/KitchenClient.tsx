"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Phone, Settings, X } from "lucide-react";
import { StoreStatusControl } from "@/components/StoreStatusControl";
import { jd, minutesLeft, time } from "@/lib/format";
import type { Order, StoreStatus } from "@/lib/types";

type Tab = "new" | "preparing" | "ready";
const TABS: { id: Tab; label: string }[] = [
  { id: "new", label: "NEW" },
  { id: "preparing", label: "PREPARING" },
  { id: "ready", label: "READY" },
];
const inTab = (o: Order, t: Tab) =>
  t === "new" ? o.status === "pending" : t === "preparing" ? o.status === "accepted" || o.status === "preparing" : o.status === "ready";
const MINUTES = [5, 10, 15, 20, 30];

/** Short beep for new orders (no audio files needed). */
function beep() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    o.connect(g).connect(ctx.destination);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.start();
    o.stop(ctx.currentTime + 0.6);
  } catch {}
}

export function KitchenClient({ initialStoreStatus }: { initialStoreStatus: StoreStatus }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<Tab>("new");
  const [accepting, setAccepting] = useState<Order | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, tick] = useState(0);
  const seen = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/kitchen/orders", { cache: "no-store" });
    if (res.status === 401) return location.reload();
    if (!res.ok) return;
    const { orders } = (await res.json()) as { orders: Order[] };
    const pending = orders.filter((o) => o.status === "pending").map((o) => o.id);
    if (seen.current && pending.some((id) => !seen.current!.has(id))) beep();
    seen.current = new Set(pending);
    setOrders(orders);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      load();
      tick((x) => x + 1);
    }, 4000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    const res = await fetch(`/api/kitchen/orders/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) alert((await res.json().catch(() => ({}))).error || "حدث خطأ");
    setBusyId(null);
    setAccepting(null);
    load();
  };

  const shown = orders.filter((o) => inTab(o, tab));

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-20 bg-brand text-white">
        <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-extrabold" dir="ltr">DRINKAT Kitchen</h1>
          <div className="flex-1 min-w-0"><StoreStatusControl initial={initialStoreStatus} /></div>
          <Link href="/admin" aria-label="المنتجات" className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"><Settings size={18} /></Link>
        </div>
        <nav className="grid grid-cols-3" dir="ltr">
          {TABS.map((t) => {
            const n = orders.filter((o) => inTab(o, t.id)).length;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`py-3 font-extrabold tracking-wide border-b-4 transition ${tab === t.id ? "border-accent bg-white/10" : "border-transparent text-white/75"}`}
              >
                {t.label}
                {n > 0 && <span className={`ms-2 inline-flex min-w-6 h-6 px-1.5 rounded-full items-center justify-center text-sm ${t.id === "new" ? "bg-accent" : "bg-white/25"}`}>{n}</span>}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="p-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 items-start">
        {shown.length === 0 && <p className="col-span-full text-center text-muted py-20 text-lg">لا توجد طلبات</p>}
        {shown.map((o) => {
          const left = minutesLeft(o.ready_eta);
          const disabled = busyId === o.id;
          return (
            <article key={o.id} className="card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-3xl font-extrabold" dir="ltr">#{o.pickup_number}</p>
                  <p className="font-bold mt-1">{o.customer_name}</p>
                  <a href={`tel:${o.customer_phone}`} className="text-sm text-muted flex items-center gap-1" dir="ltr"><Phone size={13} />{o.customer_phone}</a>
                </div>
                <div className="text-end text-sm">
                  <p className="font-bold flex items-center gap-1 justify-end"><Clock size={14} />{time(o.created_at)}</p>
                  <p className="text-muted mt-1">
                    {o.payment_method === "cash" ? "💵 كاش" : o.payment_status === "paid" ? "✅ مدفوع" : "غير مدفوع"}
                  </p>
                  <p className="font-bold mt-1" dir="ltr">{jd(o.total)}</p>
                </div>
              </div>

              <ul className="mt-3 pt-3 border-t border-line space-y-1.5">
                {o.items.map((i) => (
                  <li key={i.id}>
                    <span className="text-lg font-extrabold">{i.quantity}×</span> <span className="text-lg font-bold">{i.name}</span>
                    {i.addons.length > 0 && <p className="text-sm text-brand-dark">+ {i.addons.map((a) => a.name).join("، ")}</p>}
                    {i.notes && <p className="text-sm text-accent-dark">📝 {i.notes}</p>}
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                {o.status === "pending" && (
                  <div className="grid grid-cols-3 gap-2">
                    <button disabled={disabled} onClick={() => setAccepting(o)} className="btn bg-green-600 text-white h-14 text-lg col-span-2">Accept</button>
                    <button
                      disabled={disabled}
                      onClick={() => confirm(`رفض الطلب #${o.pickup_number}؟`) && act(o.id, { action: "reject" })}
                      className="btn bg-red-50 text-red-600 h-14 text-lg"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {(o.status === "accepted" || o.status === "preparing") && (
                  <>
                    {left !== null && <p className={`mb-2 text-center font-bold ${left === 0 ? "text-red-600" : "text-muted"}`}>{left > 0 ? `باقي ${left} دقيقة` : "تجاوز الوقت المتوقع"}</p>}
                    <button disabled={disabled} onClick={() => act(o.id, { action: "ready" })} className="btn-primary w-full h-16 text-xl">READY</button>
                  </>
                )}
                {o.status === "ready" && (
                  <button disabled={disabled} onClick={() => act(o.id, { action: "picked_up" })} className="btn-brand w-full h-16 text-xl">Picked Up</button>
                )}
              </div>
            </article>
          );
        })}
      </main>

      {accepting && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setAccepting(null)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold">كم يحتاج الطلب <span dir="ltr">#{accepting.pickup_number}</span>؟</h2>
              <button onClick={() => setAccepting(null)} aria-label="إغلاق" className="w-9 h-9 rounded-full bg-surface flex items-center justify-center"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  disabled={busyId === accepting.id}
                  onClick={() => act(accepting.id, { action: "accept", minutes: m })}
                  className="btn bg-brand-light text-brand-dark h-16 text-lg hover:bg-brand hover:text-white"
                >
                  {m} {m >= 11 ? "دقيقة" : "دقائق"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
