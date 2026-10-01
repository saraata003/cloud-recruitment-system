"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Receipt } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getMyOrderIds } from "@/components/cart";
import { jd, time } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const LABEL: Record<OrderStatus, { text: string; cls: string }> = {
  pending: { text: "بانتظار التأكيد", cls: "bg-accent-light text-accent-dark" },
  accepted: { text: "تم القبول", cls: "bg-brand-light text-brand-dark" },
  preparing: { text: "جاري التحضير", cls: "bg-accent-light text-accent-dark" },
  ready: { text: "جاهز للاستلام", cls: "bg-green-100 text-green-700" },
  picked_up: { text: "تم الاستلام", cls: "bg-surface text-muted" },
  rejected: { text: "مرفوض", cls: "bg-red-50 text-red-600" },
};

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    const load = () => {
      const ids = getMyOrderIds();
      if (ids.length === 0) return setOrders([]);
      fetch(`/api/orders?ids=${ids.join(",")}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setOrders(d.orders ?? []))
        .catch(() => setOrders((o) => o ?? []));
    };
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <main>
      <PageHeader title="طلباتي" back={false} />
      {orders === null ? (
        <div className="p-4 space-y-3">{[0, 1].map((i) => <div key={i} className="h-20 rounded-2xl bg-surface animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center text-center px-6 py-20">
          <div className="w-24 h-24 rounded-full bg-brand-light flex items-center justify-center text-brand"><Receipt size={44} /></div>
          <p className="mt-5 text-lg font-bold">لا توجد طلبات بعد</p>
          <Link href="/menu" className="btn-brand mt-6 px-8">ابدأ الطلب</Link>
        </div>
      ) : (
        <ul className="p-4 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/order/${o.id}`} className="card p-4 flex items-center gap-3 active:scale-[0.99] transition">
                <div className="w-14 h-14 rounded-2xl bg-brand-light text-brand-dark flex items-center justify-center font-extrabold" dir="ltr">
                  #{o.pickup_number}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${LABEL[o.status].cls}`}>{LABEL[o.status].text}</span>
                  <p className="text-sm text-muted mt-1 truncate">{o.items.map((i) => `${i.quantity}× ${i.name}`).join("، ")}</p>
                  <p className="text-xs text-muted mt-0.5">{time(o.created_at)} · <span dir="ltr">{jd(o.total)}</span></p>
                </div>
                <ChevronLeft size={20} className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
