"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { Bell, Check, Clock, Copy, Flame, Zap } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { jd, minutesLeft, time } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const POLL_MS = 4000;
const RANK: Record<OrderStatus, number> = { pending: 0, accepted: 1, preparing: 2, ready: 3, picked_up: 4, rejected: -1 };

/** In-app notification: vibrate + system notification if the customer allowed it. */
function notify(text: string) {
  try {
    navigator.vibrate?.([200, 100, 200]);
    if ("Notification" in window && Notification.permission === "granted") new Notification("DRINKAT Pickup", { body: text });
  } catch {}
}

export default function TrackOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);
  const [toast, setToast] = useState("");
  const [canAsk, setCanAsk] = useState(false);
  const [cliq, setCliq] = useState<{ alias: string; name: string } | null>(null);
  const [, tick] = useState(0);
  const last = useRef<OrderStatus | null>(null);
  const lastPay = useRef<string | null>(null);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
        if (res.status === 404) return setMissing(true);
        const data = (await res.json()) as { order: Order; cliq?: { alias: string; name: string } };
        const order = data.order;
        if (stop) return;
        if (data.cliq) setCliq(data.cliq);
        if (lastPay.current === "pending" && order.payment_status === "paid") setToast("وصل التحويل، شكراً!");
        lastPay.current = order.payment_status;
        if (last.current && last.current !== order.status) {
          const msg =
            order.status === "preparing" ? "تم قبول طلبك وجاري التحضير" :
            order.status === "ready" ? `طلبك جاهز! رقم الطلب ${order.pickup_number}` :
            order.status === "rejected" ? "نعتذر، لم يتم قبول طلبك" : "";
          if (msg) {
            setToast(msg);
            notify(msg);
          }
        }
        last.current = order.status;
        setOrder(order);
      } catch {}
    };
    load();
    const t = setInterval(() => {
      if (!document.hidden) load();
      tick((x) => x + 1); // refresh the ETA countdown
    }, POLL_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", load);
    };
  }, [id]);

  useEffect(() => {
    setCanAsk("Notification" in window && Notification.permission === "default");
  }, []);

  if (missing) {
    return (
      <main>
        <PageHeader title="تفاصيل الطلب" />
        <p className="text-center text-muted py-20">الطلب غير موجود</p>
      </main>
    );
  }
  if (!order) return <main><PageHeader title="تفاصيل الطلب" /><div className="h-64 m-4 rounded-3xl bg-surface animate-pulse" /></main>;

  const s = order.status;
  const r = RANK[s];
  const left = minutesLeft(order.ready_eta);

  return (
    <main className="pb-8">
      <PageHeader title="تفاصيل الطلب" />

      {toast && (
        <button onClick={() => setToast("")} className="fixed top-3 inset-x-4 mx-auto max-w-sm z-40 rounded-2xl bg-ink text-white p-4 font-bold shadow-xl flex items-center gap-2">
          <Bell size={18} className="text-accent" /> {toast}
        </button>
      )}

      <section className="px-5 pt-6 text-center">
        {s === "pending" && (
          <>
            <div className="text-6xl">📝</div>
            <h1 className="mt-3 text-2xl font-extrabold">تم إرسال طلبك</h1>
            <p className="mt-1 font-bold text-accent">بانتظار تأكيد الفرع</p>
            <p className="mt-2 text-muted">خليك مرتاح، بنخبرك أول ما يبدأ تجهيز طلبك.</p>
          </>
        )}
        {(s === "accepted" || s === "preparing") && (
          <>
            <div className="text-6xl">👨‍🍳</div>
            <h1 className="mt-3 text-2xl font-extrabold">تم قبول طلبك</h1>
            <p className="mt-1 font-bold text-accent">جاري التحضير</p>
            {left !== null && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-light text-brand-dark px-4 py-2 font-bold">
                <Clock size={18} />
                {left > 0 ? `الوقت المتوقع: ${left} دقيقة` : "قريباً جداً"}
              </p>
            )}
          </>
        )}
        {s === "ready" && (
          <>
            <div className="text-6xl">🛍️</div>
            <h1 className="mt-3 text-3xl font-extrabold text-accent">طلبك جاهز</h1>
            <p className="mt-1 text-lg font-bold">جاهز، انزل واستلم طلبك الآن</p>
          </>
        )}
        {s === "picked_up" && (
          <>
            <div className="text-6xl">✅</div>
            <h1 className="mt-3 text-2xl font-extrabold">تم استلام طلبك</h1>
            <p className="mt-1 text-muted">بالعافية! نشوفك قريباً 🧡</p>
          </>
        )}
        {s === "rejected" && (
          <>
            <div className="text-6xl">😔</div>
            <h1 className="mt-3 text-2xl font-extrabold">نعتذر، لم يتم قبول طلبك</h1>
            <p className="mt-1 text-muted">{order.reject_reason || "الفرع غير قادر على تجهيز الطلب حالياً."}</p>
            {order.payment_status === "paid" && <p className="mt-1 text-sm text-muted">سيتم استرجاع المبلغ المدفوع.</p>}
          </>
        )}
      </section>

      {s !== "rejected" && (
        <section className={`mx-5 mt-6 rounded-3xl text-center py-5 ${s === "ready" ? "bg-brand text-white shadow-lg shadow-brand/30" : "bg-surface"}`}>
          <p className={`font-bold ${s === "ready" ? "text-white/90" : "text-muted"}`}>رقم الاستلام</p>
          <p dir="ltr" className={`font-extrabold leading-none mt-1 ${s === "ready" ? "text-8xl" : "text-5xl"}`}>#{order.pickup_number}</p>
          {s === "ready" && <p className="mt-3 text-sm text-white/90">قل هذا الرقم عند الاستلام</p>}
        </section>
      )}

      {order.payment_method === "cliq" && order.payment_status === "pending" && s !== "rejected" && s !== "picked_up" && cliq && (
        <CliqCard alias={cliq.alias} name={cliq.name} amount={order.total} reference={order.pickup_number} />
      )}

      {s !== "rejected" && (
        <ol className="mx-5 mt-6 space-y-0">
          <Step done label="تم إرسال الطلب" at={order.created_at} />
          <Step done={r >= 1} label="تم قبول الطلب" />
          <Step done={r >= 3} active={r === 1 || r === 2} label={r >= 3 ? "تم التحضير" : "جاري التحضير"} activeIcon={<Flame size={16} />} />
          <Step done={r >= 4} active={r === 3} ready label="جاهز للاستلام" last />
        </ol>
      )}

      {canAsk && (s === "pending" || s === "accepted" || s === "preparing") && (
        <div className="mx-5 mt-6">
          <button
            onClick={() => Notification.requestPermission().then(() => setCanAsk(false))}
            className="btn-outline w-full"
          >
            <Bell size={18} /> نبهني لما يجهز الطلب
          </button>
        </div>
      )}

      <details className="mx-5 mt-6 rounded-2xl bg-surface p-4">
        <summary className="font-bold cursor-pointer">ملخص الطلب · <span dir="ltr">{jd(order.total)}</span></summary>
        <ul className="mt-3 space-y-1 text-sm">
          {order.items.map((i) => (
            <li key={i.id}>
              {i.quantity}× {i.name}
              {i.addons.length > 0 && <span className="text-muted"> ({i.addons.map((a) => a.name).join("، ")})</span>}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          {order.payment_status === "paid"
            ? "مدفوع ✓"
            : order.payment_method === "cash"
              ? "الدفع عند الاستلام"
              : order.payment_method === "cliq"
                ? "CliQ – بانتظار وصول التحويل"
                : "غير مدفوع"}{" "}
          · {time(order.created_at)}
        </p>
      </details>

      {(s === "picked_up" || s === "rejected") && (
        <div className="mx-5 mt-6"><Link href="/menu" className="btn-brand w-full">اطلب مرة ثانية</Link></div>
      )}
    </main>
  );
}

function Step({
  label, done, active, ready, last, at, activeIcon,
}: { label: string; done?: boolean; active?: boolean; ready?: boolean; last?: boolean; at?: string; activeIcon?: React.ReactNode }) {
  const dot = done
    ? "bg-brand text-white"
    : active
      ? ready ? "bg-green-500 text-white ring-4 ring-green-100" : "bg-accent text-white ring-4 ring-accent-light"
      : "bg-line text-transparent";
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center ${dot}`}>
          {done ? <Check size={16} strokeWidth={3} /> : active ? (activeIcon ?? <Check size={16} strokeWidth={3} />) : null}
        </span>
        {!last && <span className={`w-0.5 flex-1 min-h-6 ${done ? "bg-brand" : "bg-line"}`} />}
      </div>
      <div className="pb-5 pt-1">
        <p className={`font-bold ${done || active ? "" : "text-muted"} ${active && ready ? "text-green-600" : active ? "text-accent" : ""}`}>{label}</p>
        {at && <p className="text-xs text-muted">{time(at)}</p>}
      </div>
    </li>
  );
}

/** CliQ transfer instructions: everything the customer needs, one tap to copy each. */
function CliqCard({ alias, name, amount, reference }: { alias: string; name: string; amount: number; reference: number }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  };
  const rows = [
    { key: "alias", label: "CliQ Alias", value: alias, copyText: alias },
    { key: "amount", label: "المبلغ", value: jd(amount), copyText: amount.toFixed(3) },
    { key: "ref", label: "اكتب بالملاحظات", value: String(reference), copyText: String(reference) },
  ];
  return (
    <section className="mx-5 mt-6 rounded-3xl border-2 border-brand bg-brand-light/60 p-4">
      <div className="flex items-center gap-2">
        <span className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center"><Zap size={18} /></span>
        <div className="flex-1">
          <p className="font-extrabold">حوّل المبلغ بـ CliQ</p>
          <p className="text-xs text-muted">باسم {name}. افتح تطبيق بنكك والصق</p>
        </div>
        <span className="flex items-center gap-1 text-xs font-bold text-accent-dark">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" /> بانتظار التحويل
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.key}>
            <button
              onClick={() => copy(r.key, r.copyText)}
              className="w-full flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-start active:scale-[0.99] transition"
            >
              <span className="flex-1">
                <span className="block text-xs text-muted">{r.label}</span>
                <span className="block font-extrabold text-lg" dir="ltr" style={{ textAlign: "right" }}>{r.value}</span>
              </span>
              <span className={`text-sm font-bold flex items-center gap-1 ${copied === r.key ? "text-green-600" : "text-brand"}`}>
                {copied === r.key ? <><Check size={16} /> تم النسخ</> : <><Copy size={16} /> نسخ</>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">الفرع بيبدأ التحضير فوراً، وبيتأكد من وصول التحويل قبل التسليم.</p>
    </section>
  );
}
