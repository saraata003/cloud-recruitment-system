"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Store, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/components/cart";
import { jd } from "@/lib/format";

export default function CartPage() {
  const cart = useCart();

  if (cart.ready && cart.lines.length === 0) {
    return (
      <main>
        <PageHeader title="السلة" back={false} />
        <div className="flex flex-col items-center text-center px-6 py-20">
          <div className="w-24 h-24 rounded-full bg-brand-light flex items-center justify-center text-brand">
            <ShoppingBag size={44} />
          </div>
          <p className="mt-5 text-lg font-bold">سلتك فارغة</p>
          <Link href="/menu" className="btn-brand mt-6 px-8">تصفح المنيو</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-32">
      <PageHeader title="السلة" back={false} />
      <ul className="divide-y divide-line px-4">
        {cart.lines.map((l) => (
          <li key={l.key} className="flex gap-3 py-4">
            <ProductImage src={l.image} emoji={l.emoji} emojiSize="text-3xl" alt={l.name} className="w-20 h-20 rounded-2xl shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <p className="font-bold flex-1">{l.name}</p>
                <button onClick={() => cart.remove(l.key)} aria-label="حذف" className="text-muted hover:text-accent p-1 -m-1">
                  <Trash2 size={18} />
                </button>
              </div>
              {l.addons.length > 0 && <p className="text-xs text-muted mt-0.5">{l.addons.map((a) => a.name).join("، ")}</p>}
              {l.notes && <p className="text-xs text-muted mt-0.5">📝 {l.notes}</p>}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => cart.setQty(l.key, l.quantity - 1)} aria-label="أقل" className="w-8 h-8 rounded-full border border-line flex items-center justify-center">
                    <Minus size={16} />
                  </button>
                  <span className="font-bold w-4 text-center">{l.quantity}</span>
                  <button onClick={() => cart.setQty(l.key, l.quantity + 1)} aria-label="أكثر" className="w-8 h-8 rounded-full border border-line flex items-center justify-center">
                    <Plus size={16} />
                  </button>
                </div>
                <span dir="ltr" className="font-extrabold">{jd(l.unit_price * l.quantity)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <section className="mx-4 mt-2 rounded-2xl bg-surface p-4">
        <p className="text-sm font-bold text-muted mb-2">فرع الاستلام</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center"><Store size={20} /></div>
          <div>
            <p className="font-bold">DRINKAT Cloud Kitchen</p>
            <p className="text-xs text-muted">استلام من الفرع – بدون توصيل</p>
          </div>
        </div>
      </section>

      <div className="mx-4 mt-4 flex items-center justify-between text-lg font-extrabold">
        <span>المجموع</span>
        <span dir="ltr">{jd(cart.total)}</span>
      </div>

      <div className="fixed bottom-16 inset-x-0 z-20 bg-white border-t border-line p-4">
        <div className="mx-auto max-w-md">
          <Link href="/checkout" className="btn-primary w-full justify-between">
            <span>متابعة للدفع</span>
            <span dir="ltr">{jd(cart.total)}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
