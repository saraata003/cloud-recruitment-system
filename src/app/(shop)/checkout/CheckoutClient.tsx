"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Banknote, ChevronDown, CreditCard, Loader2, Lock, Pencil, ShieldCheck, Zap } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { PageHeader } from "@/components/PageHeader";
import { ProductImage } from "@/components/ProductImage";
import { rememberOrder, useCart, type CartLine } from "@/components/cart";
import {
  cardBrand, digits, formatCardNumber, formatExpiry, MOCK_DECLINE_CARD, tokenizeCard, validateCard, type CardInput,
} from "@/lib/card";
import { jd, PAUSED_MESSAGE } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

const METHODS: { id: PaymentMethod; label: string; hint: string; Icon: typeof CreditCard }[] = [
  { id: "card", label: "Visa / Mastercard", hint: "ادفع بالبطاقة بأمان", Icon: CreditCard },
  { id: "cliq", label: "CliQ", hint: "تحويل فوري من تطبيق بنكك", Icon: Zap },
  { id: "cash", label: "الدفع عند الاستلام", hint: "كاش عند الكاونتر", Icon: Banknote },
];
const CUSTOMER_KEY = "drinkat_customer";
const IS_MOCK = true; // flip to false once a real gateway is connected (hides the test-card hint)

/** crypto.randomUUID needs HTTPS; this works on plain-HTTP LAN tablets too. */
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

/** "0791234567" / "+962791234567" → "791234567" (what the user sees after the +962 prefix). */
const localPart = (p: string) => {
  let d = digits(p);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("962")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 9);
};
const formatLocal = (d: string) => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 9)].filter(Boolean).join(" ");
const phoneValid = (d: string) => /^7[789]\d{7}$/.test(d);

type Sheet =
  | { kind: "failed"; message: string }
  | { kind: "unavailable"; lines: CartLine[] }
  | null;

export function CheckoutClient({ paused }: { paused: boolean }) {
  const router = useRouter();
  const cart = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(""); // local digits, without +962
  const [editingDetails, setEditingDetails] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [card, setCard] = useState<CardInput>({ number: "", expiry: "", cvc: "" });
  const [cardErrors, setCardErrors] = useState<Partial<Record<keyof CardInput, string>>>({});
  const [detailErrors, setDetailErrors] = useState<{ name?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [showSummary, setShowSummary] = useState(false);
  const placed = useRef(false);
  const attemptKey = useRef<string | null>(null);

  // Returning customer: name, phone and last payment method are remembered on this device.
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "{}");
      if (c.name) setName(c.name);
      if (c.phone) setPhone(localPart(c.phone));
      if (c.method && METHODS.some((m) => m.id === c.method)) setMethod(c.method);
      if (c.name && c.phone) setEditingDetails(false);
    } catch {}
  }, []);

  useEffect(() => {
    if (cart.ready && cart.lines.length === 0 && !placed.current) router.replace("/cart");
  }, [cart.ready, cart.lines.length, router]);

  // Any change to what is being paid for = a new checkout attempt.
  useEffect(() => {
    attemptKey.current = null;
  }, [cart.total, method]);

  const submit = async (lines: CartLine[] = cart.lines) => {
    setError("");
    const dErr: typeof detailErrors = {};
    if (name.trim().length < 2) dErr.name = "اكتب اسمك";
    if (!phoneValid(phone)) dErr.phone = "رقم موبايل أردني، مثال: 79 123 4567";
    setDetailErrors(dErr);
    if (Object.keys(dErr).length) return setEditingDetails(true);

    let token: string | undefined;
    if (method === "card") {
      const cErr = validateCard(card);
      setCardErrors(cErr);
      if (Object.keys(cErr).length) return;
    }

    setBusy(true);
    try {
      if (method === "card") token = await tokenizeCard(card);
      attemptKey.current ??= uid();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotency_key: attemptKey.current,
          customer_name: name.trim(),
          customer_phone: `0${phone}`,
          payment_method: method,
          payment_token: token,
          items: lines.map((l) => ({
            product_id: l.product_id, quantity: l.quantity, addon_ids: l.addons.map((a) => a.id), notes: l.notes,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        attemptKey.current = null; // nothing was charged, the next try is a fresh attempt
        if (data.code === "payment_failed") setSheet({ kind: "failed", message: data.error });
        else if (data.code === "unavailable") {
          const ids: string[] = data.data?.product_ids ?? [];
          setSheet({ kind: "unavailable", lines: lines.filter((l) => ids.includes(l.product_id)) });
        } else if (data.code === "invalid_phone") {
          setDetailErrors({ phone: data.error });
          setEditingDetails(true);
        } else setError(data.error || "حدث خطأ، جرّب مرة ثانية");
        setBusy(false);
        return;
      }
      try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: name.trim(), phone: `0${phone}`, method }));
      } catch {}
      placed.current = true;
      rememberOrder(data.id);
      cart.clear();
      router.replace(`/order/${data.id}`);
    } catch {
      // Network dropped: keep the same attempt key so retrying can never create a second order.
      setError("انقطع الاتصال. جرّب مرة ثانية، ما رح ينحسب الطلب مرتين.");
      setBusy(false);
    }
  };

  const removeUnavailableAndContinue = (gone: CartLine[]) => {
    const keys = new Set(gone.map((l) => l.key));
    const rest = cart.lines.filter((l) => !keys.has(l.key));
    gone.forEach((l) => cart.remove(l.key));
    setSheet(null);
    if (rest.length > 0) submit(rest);
  };

  const count = cart.lines.reduce((s, l) => s + l.quantity, 0);
  const brand = cardBrand(card.number);
  const cta =
    method === "card" ? <>ادفع <span dir="ltr">{jd(cart.total)}</span></> : method === "cliq" ? "أكّد الطلب وادفع بـ CliQ" : "أكّد الطلب";

  return (
    <main className="pb-44 bg-surface min-h-dvh">
      <PageHeader title="الدفع" />

      <div className="p-4 space-y-5">
        {/* ---------- customer ---------- */}
        <section>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="font-extrabold text-lg">بياناتك</h2>
            <span className="text-xs text-muted">بدون حساب أو تسجيل دخول</span>
          </div>
          {editingDetails ? (
            <div className="card p-4 space-y-3">
              <div>
                <label className="label" htmlFor="name">الاسم</label>
                <input id="name" className="input" value={name} onChange={(e) => { setName(e.target.value); setDetailErrors((d) => ({ ...d, name: undefined })); }} autoComplete="name" />
                {detailErrors.name && <p className="mt-1 text-sm font-bold text-red-600">{detailErrors.name}</p>}
              </div>
              <div>
                <label className="label" htmlFor="phone">رقم الموبايل</label>
                <div className="flex gap-2" dir="ltr">
                  <span className="h-12 px-3 rounded-xl bg-surface border border-line flex items-center font-bold text-muted">+962</span>
                  <input
                    id="phone" className="input flex-1" inputMode="numeric" autoComplete="tel-national" placeholder="79 123 4567"
                    value={formatLocal(phone)}
                    onChange={(e) => { setPhone(localPart(e.target.value)); setDetailErrors((d) => ({ ...d, phone: undefined })); }}
                  />
                </div>
                {detailErrors.phone ? (
                  <p className="mt-1 text-sm font-bold text-red-600">{detailErrors.phone}</p>
                ) : (
                  <p className="mt-1 text-xs text-muted">بنستخدم رقمك بس لنبلغك عن حالة طلبك.</p>
                )}
              </div>
            </div>
          ) : (
            <button onClick={() => setEditingDetails(true)} className="card w-full p-4 flex items-center gap-3 text-start">
              <span className="w-10 h-10 rounded-full bg-brand-light text-brand-dark font-extrabold flex items-center justify-center">
                {name.trim().charAt(0)}
              </span>
              <span className="flex-1">
                <span className="block font-bold">{name}</span>
                <span className="block text-sm text-muted" dir="ltr" style={{ textAlign: "right" }}>+962 {formatLocal(phone)}</span>
              </span>
              <span className="text-brand text-sm font-bold flex items-center gap-1"><Pencil size={14} /> تعديل</span>
            </button>
          )}
        </section>

        {/* ---------- payment method ---------- */}
        <section>
          <h2 className="font-extrabold text-lg mb-2">طريقة الدفع</h2>
          <div className="space-y-2.5" role="radiogroup">
            {METHODS.map(({ id, label, hint, Icon }) => {
              const on = method === id;
              return (
                <div key={id} className={`rounded-2xl border-2 bg-white transition ${on ? "border-brand" : "border-transparent"}`}>
                  <button
                    role="radio"
                    aria-checked={on}
                    onClick={() => setMethod(id)}
                    className="w-full flex items-center gap-3 p-4 text-start"
                  >
                    <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${on ? "bg-brand text-white" : "bg-surface text-ink"}`}>
                      <Icon size={22} />
                    </span>
                    <span className="flex-1">
                      <span className="block font-bold">{label}</span>
                      <span className="block text-xs text-muted">{hint}</span>
                    </span>
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${on ? "border-brand" : "border-line"}`}>
                      {on && <span className="w-3 h-3 rounded-full bg-brand" />}
                    </span>
                  </button>

                  {on && id === "card" && (
                    <CardForm card={card} setCard={setCard} errors={cardErrors} setErrors={setCardErrors} brand={brand} />
                  )}
                  {on && id === "cliq" && (
                    <ol className="px-4 pb-4 space-y-2 text-sm animate-[pop_200ms_ease-out]">
                      {["أكّد الطلب من هون", "بنعطيك الـ Alias والمبلغ ورقم الطلب، كلهم بضغطة نسخ", "حوّل من تطبيق بنكك، والفرع بيأكّد وصول التحويل"].map((t, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <span className="w-6 h-6 shrink-0 rounded-full bg-brand-light text-brand-dark font-extrabold text-xs flex items-center justify-center">{i + 1}</span>
                          <span className="pt-0.5">{t}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {on && id === "cash" && (
                    <p className="px-4 pb-4 text-sm text-muted animate-[pop_200ms_ease-out]">
                      ادفع كاش عند الكاونتر لما تستلم طلبك. جهّز المبلغ: <b className="text-ink" dir="ltr">{jd(cart.total)}</b>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------- summary ---------- */}
        <section className="card overflow-hidden">
          <button onClick={() => setShowSummary((s) => !s)} className="w-full flex items-center gap-2 p-4" aria-expanded={showSummary}>
            <span className="font-bold whitespace-nowrap">ملخص الطلب</span>
            <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold whitespace-nowrap">{count} منتجات</span>
            <span className="flex-1" />
            <span className="font-extrabold whitespace-nowrap" dir="ltr">{jd(cart.total)}</span>
            <ChevronDown size={18} className={`transition ${showSummary ? "rotate-180" : ""}`} />
          </button>
          {showSummary && (
            <ul className="px-4 pb-4 space-y-1.5 text-sm border-t border-line pt-3">
              {cart.lines.map((l) => (
                <li key={l.key} className="flex justify-between gap-2">
                  <span>{l.quantity}× {l.name}{l.addons.length > 0 && <span className="text-muted"> ({l.addons.map((a) => a.name).join("، ")})</span>}</span>
                  <span dir="ltr" className="whitespace-nowrap">{jd(l.unit_price * l.quantity)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <ShieldCheck size={14} className="text-brand" /> الدفع مشفّر، وما بنحفظ بيانات بطاقتك أبداً
        </p>
      </div>

      {/* ---------- sticky CTA ---------- */}
      <div className="fixed bottom-16 inset-x-0 z-20 bg-white border-t border-line p-4">
        <div className="mx-auto max-w-md">
          {(error || paused) && <p className="text-center text-sm font-bold text-red-600 mb-2">{error || PAUSED_MESSAGE}</p>}
          <button onClick={() => submit()} disabled={busy || paused || cart.lines.length === 0} className="btn-primary w-full">
            {busy ? (
              <><Loader2 size={20} className="animate-spin" /> {method === "card" ? "جاري الدفع…" : "جاري إرسال طلبك…"}</>
            ) : (
              <><Lock size={18} /> {cta}</>
            )}
          </button>
          {busy && <p className="text-center text-xs text-muted mt-2">لحظة، لا تسكّر الصفحة.</p>}
        </div>
      </div>

      {/* ---------- sheets ---------- */}
      <BottomSheet open={sheet?.kind === "failed"} onClose={() => setSheet(null)}>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center"><CreditCard size={30} /></div>
          <h3 className="mt-3 text-xl font-extrabold">ما قدرنا نكمل الدفع</h3>
          <p className="mt-1 text-muted">{sheet?.kind === "failed" ? sheet.message : ""} جرّب مرة ثانية، أو اختار طريقة دفع ثانية.</p>
        </div>
        <div className="mt-5 space-y-2.5">
          <button className="btn-primary w-full" onClick={() => { setSheet(null); submit(); }}>جرّب مرة ثانية</button>
          <button className="btn w-full h-12 border border-line" onClick={() => { setSheet(null); setMethod(method === "card" ? "cliq" : "card"); }}>
            اختار طريقة دفع ثانية
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet?.kind === "unavailable"} onClose={() => setSheet(null)}>
        {sheet?.kind === "unavailable" && (() => {
          const gone = sheet.lines;
          const newTotal = cart.total - gone.reduce((s, l) => s + l.unit_price * l.quantity, 0);
          const nothingLeft = gone.length === cart.lines.length;
          return (
            <>
              <h3 className="text-xl font-extrabold">في منتج خلص هلأ</h3>
              <p className="mt-1 text-muted">آسفين! هالمنتج نفد قبل ما نستلم طلبك.</p>
              <ul className="mt-4 space-y-2">
                {gone.map((l) => (
                  <li key={l.key} className="flex items-center gap-3 rounded-2xl bg-red-50 p-3">
                    <ProductImage src={l.image} emoji={l.emoji} emojiSize="text-2xl" alt={l.name} className="w-12 h-12 rounded-xl" />
                    <span className="flex-1">
                      <span className="block font-bold">{l.name}</span>
                      <span className="block text-sm text-muted line-through" dir="ltr" style={{ textAlign: "right" }}>{jd(l.unit_price * l.quantity)}</span>
                    </span>
                    <span className="text-sm font-bold text-red-600">نفد</span>
                  </li>
                ))}
              </ul>
              {!nothingLeft && (
                <div className="mt-4 flex justify-between font-bold">
                  <span className="text-muted">المجموع الجديد</span>
                  <span dir="ltr">{jd(newTotal)}</span>
                </div>
              )}
              <div className="mt-5 space-y-2.5">
                {!nothingLeft && (
                  <button className="btn-primary w-full justify-between" onClick={() => removeUnavailableAndContinue(gone)}>
                    <span>احذفه وكمّل الطلب</span><span dir="ltr">{jd(newTotal)}</span>
                  </button>
                )}
                <button className="btn w-full h-12 border border-line" onClick={() => { if (nothingLeft) gone.forEach((l) => cart.remove(l.key)); router.push(nothingLeft ? "/menu" : "/cart"); }}>
                  {nothingLeft ? "رجوع للمنيو" : "رجوع للسلة"}
                </button>
              </div>
            </>
          );
        })()}
      </BottomSheet>
    </main>
  );
}

function CardForm({
  card, setCard, errors, setErrors, brand,
}: {
  card: CardInput;
  setCard: React.Dispatch<React.SetStateAction<CardInput>>;
  errors: Partial<Record<keyof CardInput, string>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof CardInput, string>>>>;
  brand: ReturnType<typeof cardBrand>;
}) {
  const expRef = useRef<HTMLInputElement>(null);
  const cvcRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof CardInput, v: string) => {
    setCard((c) => ({ ...c, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const shown = digits(card.number).padEnd(16, "•").replace(/(.{4})(?=.)/g, "$1 ");

  return (
    <div className="px-4 pb-4 space-y-3 animate-[pop_200ms_ease-out]" dir="ltr">
      {/* live card preview */}
      <div className="relative h-36 rounded-2xl p-4 text-white overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-[#3cc6c2] shadow-lg shadow-brand/20">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-6 w-44 h-44 rounded-full bg-accent/25" />
        <div className="relative flex justify-between items-start">
          <span className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-200 to-amber-400" />
          <span className="text-lg font-extrabold italic">{brand === "visa" ? "VISA" : brand === "mastercard" ? "mastercard" : ""}</span>
        </div>
        <p className="relative mt-5 text-xl tracking-[0.12em] font-bold tabular-nums" aria-hidden>{shown}</p>
        <p className="relative mt-2 text-xs text-white/80 tabular-nums" aria-hidden>{card.expiry || "MM/YY"}</p>
      </div>

      <div>
        <input
          className={`input tabular-nums tracking-wider ${errors.number ? "border-red-500" : ""}`}
          inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" aria-label="رقم البطاقة"
          value={formatCardNumber(card.number)}
          onChange={(e) => {
            const v = digits(e.target.value).slice(0, 16);
            set("number", v);
            if (v.length === 16) expRef.current?.focus();
          }}
        />
        {errors.number && <p className="mt-1 text-sm font-bold text-red-600 text-right">{errors.number}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <input
            ref={expRef}
            className={`input tabular-nums ${errors.expiry ? "border-red-500" : ""}`}
            inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" aria-label="تاريخ الانتهاء"
            value={card.expiry}
            onChange={(e) => {
              const v = formatExpiry(e.target.value);
              set("expiry", v);
              if (v.length === 5) cvcRef.current?.focus();
            }}
          />
          {errors.expiry && <p className="mt-1 text-sm font-bold text-red-600 text-right">{errors.expiry}</p>}
        </div>
        <div>
          <input
            ref={cvcRef}
            className={`input tabular-nums ${errors.cvc ? "border-red-500" : ""}`}
            inputMode="numeric" autoComplete="cc-csc" placeholder="CVV" aria-label="CVV" type="password"
            value={card.cvc}
            onChange={(e) => set("cvc", digits(e.target.value).slice(0, 4))}
          />
          {errors.cvc && <p className="mt-1 text-sm font-bold text-red-600 text-right">{errors.cvc}</p>}
        </div>
      </div>
      {IS_MOCK && (
        <p className="text-[11px] text-muted text-right" dir="rtl">
          وضع تجريبي: جرّب <span dir="ltr">4242 4242 4242 4242</span> للنجاح، أو <span dir="ltr">{formatCardNumber(MOCK_DECLINE_CARD)}</span> للرفض.
        </p>
      )}
    </div>
  );
}
