"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/components/cart";
import { jd, PAUSED_MESSAGE } from "@/lib/format";
import { categoryEmoji } from "@/lib/category-emoji";
import type { Category, Product } from "@/lib/types";

export function MenuClient({
  categories, products, initialCategory, paused,
}: { categories: Category[]; products: Product[]; initialCategory: string; paused: boolean }) {
  const [cat, setCat] = useState(initialCategory);
  const [q, setQ] = useState("");
  const [added, setAdded] = useState<string | null>(null);
  const cart = useCart();

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        (cat === "all" || p.category === cat) &&
        (!term || p.name_ar.toLowerCase().includes(term) || p.name_en.toLowerCase().includes(term)),
    );
  }, [products, cat, q]);

  const quickAdd = (p: Product) => {
    cart.add({
      product_id: p.id, name: p.name_ar, image: p.image, emoji: categoryEmoji(categories, p.category),
      unit_price: p.price, addons: [], quantity: 1, notes: "",
    });
    setAdded(p.id);
    setTimeout(() => setAdded((x) => (x === p.id ? null : x)), 900);
  };

  return (
    <main>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur px-4 pt-4 pb-3 border-b border-line">
        <h1 className="text-xl font-extrabold mb-3">المنيو</h1>
        <label className="relative block">
          <Search size={18} className="absolute top-1/2 -translate-y-1/2 start-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن منتج…"
            className="input ps-11 bg-surface border-transparent"
          />
        </label>
        <div className="no-scrollbar flex gap-2 overflow-x-auto mt-3 -mx-4 px-4">
          {[{ id: "all", name: "الكل" }, ...categories].map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`shrink-0 h-10 px-4 rounded-full font-bold text-sm transition ${
                cat === c.id ? "bg-brand text-white" : "bg-surface text-ink"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </header>

      {paused && <div className="m-4 rounded-2xl bg-accent-light text-accent-dark p-4 font-bold">{PAUSED_MESSAGE}</div>}

      <div className="grid grid-cols-2 gap-3 p-4">
        {shown.map((p) => (
          <div key={p.id} className="card overflow-hidden flex flex-col">
            <Link href={`/product/${p.id}`} className="block">
              <ProductImage src={p.image} emoji={categoryEmoji(categories, p.category)} alt={p.name_ar} className="w-full aspect-square" />
            </Link>
            <div className="p-3 flex flex-col flex-1">
              <Link href={`/product/${p.id}`} className="font-bold leading-snug line-clamp-2 flex-1">
                {p.name_ar}
              </Link>
              <div className="mt-2 flex items-center justify-between">
                <span dir="ltr" className="font-extrabold text-sm">{jd(p.price)}</span>
                <button
                  onClick={() => quickAdd(p)}
                  disabled={paused}
                  aria-label={`أضف ${p.name_ar}`}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition active:scale-90 disabled:opacity-40 ${
                    added === p.id ? "bg-brand-dark" : "bg-brand"
                  }`}
                >
                  {added === p.id ? <Check size={18} /> : <Plus size={20} />}
                </button>
              </div>
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className="col-span-2 text-center text-muted py-16">لا توجد منتجات</p>}
      </div>

      {cart.count > 0 && (
        <Link
          href="/cart"
          className="fixed bottom-20 inset-x-4 mx-auto max-w-[calc(28rem-2rem)] z-20 btn-primary justify-between"
        >
          <span>عرض السلة ({cart.count})</span>
          <span dir="ltr">{jd(cart.total)}</span>
        </Link>
      )}
    </main>
  );
}
