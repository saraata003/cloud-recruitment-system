"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Banknote, CreditCard, Lock, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { rememberOrder, useCart } from "@/components/cart";
import { jd, PAUSED_MESSAGE } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

const METHODS: { id: PaymentMethod; label: string; hint: string; Icon: typeof CreditCard }[] = [
  { id: "card", label: "Visa / Mastercard", hint: "بطاقة ائتمانية", Icon: CreditCard },
  { id: "cliq", label: "CliQ", hint: "تحويل فوري", Icon: Smartphone },
  { id: "cash", label: "الدفع عند الاستلام", hint: "كاش في الفرع", Icon: Banknote },
];
const CUSTOMER_KEY = "drinkat_customer";

export function CheckoutClient({ paused }: { paused: boolean }) {
  const router = useRouter();
  const cart = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(false);

  // Remember name + phone on this device so the next order is one tap.
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "{}");
      if (c.name) setName(c.name);
      if (c.phone) setPhone(c.phone);
    } catch {}
  }, []);

  useEffect(() => {
    if (cart.ready && cart.lines.length === 0 && !placed) router.replace("/cart");
  }, [cart.ready, cart.lines.length, placed, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          payment_method: method,
          items: cart.lines.map((l) => ({
            product_id: l.product_id, quantity: l.quantity, addon_ids: l.addons.map((a) => a.id), notes: l.notes,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name, phone }));
      } catch {}
      rememberOrder(data.id);
      setPlaced(true);
      cart.clear();
      router.replace(`/order/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <main className="pb-36">
      <PageHeader title="الدفع" />
      <form id="checkout" onSubmit={submit} className="p-4 space-y-6">
        <section className="space-y-3">
          <h2 className="font-extrabold">بياناتك</h2>
          <div>
            <label className="label" htmlFor="name">الاسم</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="phone">رقم الهاتف</label>
            <input
              id="phone" className="input text-start" dir="ltr" inputMode="tel" placeholder="07XXXXXXXX"
              value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel"
            />
          </div>
        </section>

        <section>
          <h2 className="font-extrabold mb-3">طريقة الدفع</h2>
          <div className="space-y-2.5">
            {METHODS.map(({ id, label, hint, Icon }) => (
              <label
                key={id}
                className={`flex items-center gap-3 rounded-2xl border-2 p-4 cursor-pointer transition ${
                  method === id ? "border-brand bg-brand-light" : "border-line"
                }`}
              >
                <input type="radio" name="method" checked={method === id} onChange={() => setMethod(id)} className="w-5 h-5 accent-[var(--color-brand)]" />
                <Icon size={22} className="text-brand" />
                <span className="flex-1">
                  <span className="block font-bold">{label}</span>
                  <span className="block text-xs text-muted">{hint}</span>
                </span>
              </label>
            ))}
          </div>
          {method !== "cash" && (
            <p className="mt-2 text-xs text-muted flex items-center gap-1"><Lock size={12} /> دفع تجريبي حالياً – سيتم ربط بوابة الدفع لاحقاً</p>
          )}
        </section>

        <section className="rounded-2xl bg-surface p-4 space-y-1.5 text-sm">
          {cart.lines.map((l) => (
            <div key={l.key} className="flex justify-between gap-2">
              <span>{l.quantity}× {l.name}</span>
              <span dir="ltr">{jd(l.unit_price * l.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-2 border-t border-line text-base font-extrabold">
            <span>المجموع</span>
            <span dir="ltr">{jd(cart.total)}</span>
          </div>
        </section>
      </form>

      <div className="fixed bottom-16 inset-x-0 z-20 bg-white border-t border-line p-4">
        <div className="mx-auto max-w-md">
          {(error || paused) && <p className="text-center text-sm font-bold text-accent-dark mb-2">{error || PAUSED_MESSAGE}</p>}
          <button form="checkout" disabled={busy || paused || cart.lines.length === 0} className="btn-primary w-full justify-between">
            <span className="flex items-center gap-2"><Lock size={18} /> {busy ? "جاري الإرسال…" : "تأكيد الطلب"}</span>
            <span dir="ltr">{jd(cart.total)}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
