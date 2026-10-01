"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Minus, Plus, ShoppingCart } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/components/cart";
import { jd, PAUSED_MESSAGE } from "@/lib/format";
import type { Addon, Product } from "@/lib/types";

export function ProductClient({
  product, addons, emoji, paused,
}: { product: Product; addons: Addon[]; emoji: string; paused: boolean }) {
  const router = useRouter();
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const chosen = addons.filter((a) => picked.includes(a.id));
  const unit = product.price + chosen.reduce((s, a) => s + a.price, 0);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const addToCart = () => {
    cart.add({
      product_id: product.id, name: product.name_ar, image: product.image, emoji,
      unit_price: Math.round(unit * 1000) / 1000,
      addons: chosen.map(({ id, name, price }) => ({ id, name, price })),
      quantity: qty, notes: notes.trim(),
    });
    router.push("/menu");
  };

  return (
    <main className="pb-28">
      <div className="relative">
        <ProductImage src={product.image} emoji={emoji} emojiSize="text-8xl" alt={product.name_ar} className="w-full aspect-[4/3]" />
        <button
          onClick={() => router.back()}
          aria-label="رجوع"
          className="absolute top-4 start-4 w-11 h-11 rounded-full bg-white/90 shadow flex items-center justify-center"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="-mt-6 relative rounded-t-3xl bg-white px-5 pt-6">
        <h1 className="text-2xl font-extrabold">{product.name_ar}</h1>
        <p dir="ltr" className="text-end text-2xl font-extrabold text-brand mt-1">{jd(product.price)}</p>
        {product.description && <p className="mt-3 text-muted leading-relaxed">{product.description}</p>}
        {!product.is_available && <p className="mt-3 font-bold text-accent">غير متوفر حالياً</p>}

        {addons.length > 0 && (
          <section className="mt-6">
            <h2 className="font-extrabold mb-2">الإضافات <span className="text-muted font-normal text-sm">(اختياري)</span></h2>
            <div className="divide-y divide-line">
              {addons.map((a) => (
                <label key={a.id} className="flex items-center gap-3 py-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={picked.includes(a.id)}
                    onChange={() => toggle(a.id)}
                    className="w-5 h-5 accent-[var(--color-brand)]"
                  />
                  <span className="flex-1 font-bold">{a.name}</span>
                  <span dir="ltr" className="text-sm text-muted">+ {jd(a.price)}</span>
                </label>
              ))}
            </div>
          </section>
        )}

        <section className="mt-5">
          <h2 className="font-extrabold mb-2">ملاحظات <span className="text-muted font-normal text-sm">(اختياري)</span></h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="مثلاً: بدون بصل"
            className="input h-auto py-3 resize-none"
          />
        </section>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="أقل" className="w-12 h-12 rounded-full border-2 border-line flex items-center justify-center">
            <Minus size={20} />
          </button>
          <span className="text-2xl font-extrabold w-8 text-center">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(50, q + 1))} aria-label="أكثر" className="w-12 h-12 rounded-full bg-ink text-white flex items-center justify-center">
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="fixed bottom-16 inset-x-0 z-20 bg-white border-t border-line p-4">
        <div className="mx-auto max-w-md">
          {paused && <p className="text-center text-sm font-bold text-accent-dark mb-2">{PAUSED_MESSAGE}</p>}
          <button onClick={addToCart} disabled={paused || !product.is_available} className="btn-primary w-full justify-between">
            <span className="flex items-center gap-2"><ShoppingCart size={20} /> إضافة إلى السلة</span>
            <span dir="ltr">{jd(unit * qty)}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
