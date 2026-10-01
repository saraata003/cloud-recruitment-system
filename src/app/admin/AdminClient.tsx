"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChefHat, ImagePlus, LogOut, Pencil, Plus, Trash2, X } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { StoreStatusControl } from "@/components/StoreStatusControl";
import { categoryEmoji, isImageUrl } from "@/lib/category-emoji";
import { jd } from "@/lib/format";
import type { Addon, Category, Product, StoreStatus } from "@/lib/types";

type Tab = "products" | "categories" | "addons";

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "حدث خطأ");
  return data;
}

export function AdminClient({
  products, categories, addons, storeStatus,
}: { products: Product[]; categories: Category[]; addons: Addon[]; storeStatus: StoreStatus }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("products");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const refresh = () => router.refresh();
  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const logout = async () => {
    await fetch("/api/staff/logout", { method: "POST" });
    refresh();
  };

  return (
    <div className="min-h-dvh bg-surface pb-16">
      <header className="sticky top-0 z-20 bg-brand text-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-extrabold">إدارة المنيو</h1>
          <div className="flex-1 min-w-0"><StoreStatusControl initial={storeStatus} /></div>
          <Link href="/kitchen" aria-label="المطبخ" className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"><ChefHat size={18} /></Link>
          <button onClick={logout} aria-label="خروج" className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"><LogOut size={18} /></button>
        </div>
        <nav className="max-w-3xl mx-auto grid grid-cols-3">
          {([["products", "المنتجات"], ["categories", "الأقسام"], ["addons", "الإضافات"]] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`py-3 font-bold border-b-4 ${tab === id ? "border-accent" : "border-transparent text-white/75"}`}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {tab === "products" && (
          <>
            <div className="flex gap-2 items-center mb-4">
              <select className="input flex-1" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">كل الأقسام</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button
                onClick={() => setEditing({ category: filter !== "all" ? filter : categories[0]?.id, is_available: true, price: 0 })}
                className="btn-primary h-12 text-base"
              >
                <Plus size={18} /> منتج
              </button>
            </div>
            <ul className="space-y-2">
              {products.filter((p) => filter === "all" || p.category === filter).map((p) => (
                <li key={p.id} className={`card p-3 flex items-center gap-3 ${p.is_available ? "" : "opacity-60"}`}>
                  <ProductImage src={p.image} emoji={categoryEmoji(categories, p.category)} emojiSize="text-2xl" alt={p.name_ar} className="w-14 h-14 rounded-xl shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{p.name_ar}</p>
                    <p className="text-sm text-muted" dir="ltr" style={{ textAlign: "right" }}>{jd(p.price)}</p>
                  </div>
                  <label className="flex flex-col items-center text-[11px] font-bold gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-[var(--color-brand)]"
                      checked={p.is_available}
                      onChange={(e) => run(() => api("/api/admin/products", "POST", { ...p, is_available: e.target.checked }))}
                    />
                    {p.is_available ? "متوفر" : "غير متوفر"}
                  </label>
                  <button onClick={() => setEditing(p)} aria-label="تعديل" className="w-10 h-10 rounded-full bg-surface flex items-center justify-center"><Pencil size={16} /></button>
                  <button
                    onClick={() => confirm(`حذف ${p.name_ar}؟`) && run(() => api(`/api/admin/products?id=${p.id}`, "DELETE"))}
                    aria-label="حذف"
                    className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === "categories" && <CategoriesTab categories={categories} run={run} />}
        {tab === "addons" && <AddonsTab addons={addons} categories={categories} run={run} />}
      </main>

      {editing && (
        <ProductForm
          initial={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function ProductForm({
  initial, categories, onClose, onSaved,
}: { initial: Partial<Product>; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [p, setP] = useState<Partial<Product>>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (patch: Partial<Product>) => setP((x) => ({ ...x, ...patch }));

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ image: data.url });
    } catch (e) {
      alert((e as Error).message || "فشل رفع الصورة");
    }
    setUploading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/products", "POST", p);
      onSaved();
    } catch (err) {
      alert((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="bg-white w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{p.id ? "تعديل منتج" : "منتج جديد"}</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="w-9 h-9 rounded-full bg-surface flex items-center justify-center"><X size={18} /></button>
        </div>

        <label className="block cursor-pointer">
          <div className="relative">
            <ProductImage src={p.image} emoji={categoryEmoji(categories, p.category || "")} alt="" className="w-full h-44 rounded-2xl" />
            <span className="absolute bottom-3 start-3 btn bg-white/90 h-10 px-4 text-sm shadow">
              <ImagePlus size={16} /> {uploading ? "جاري الرفع…" : p.image ? "تغيير الصورة" : "رفع صورة"}
            </span>
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="label">الاسم (عربي)</label>
            <input className="input" required value={p.name_ar ?? ""} onChange={(e) => set({ name_ar: e.target.value })} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Name (English)</label>
            <input className="input" dir="ltr" value={p.name_en ?? ""} onChange={(e) => set({ name_en: e.target.value })} />
          </div>
          <div>
            <label className="label">القسم</label>
            <select className="input" required value={p.category ?? ""} onChange={(e) => set({ category: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">السعر (JD)</label>
            <input className="input" dir="ltr" type="number" step="0.001" min="0" required value={p.price ?? ""} onChange={(e) => set({ price: e.target.value === "" ? undefined : Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className="label">الوصف</label>
          <textarea className="input h-auto py-3" rows={3} value={p.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
        </div>
        <label className="flex items-center gap-3 font-bold">
          <input type="checkbox" className="w-5 h-5 accent-[var(--color-brand)]" checked={p.is_available !== false} onChange={(e) => set({ is_available: e.target.checked })} />
          متوفر للطلب
        </label>
        <button disabled={saving || uploading} className="btn-primary w-full">{saving ? "جاري الحفظ…" : "حفظ"}</button>
      </form>
    </div>
  );
}

function CategoriesTab({ categories, run }: { categories: Category[]; run: (fn: () => Promise<unknown>) => void }) {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await api("/api/admin/categories", "POST", { name, image, sort_order: categories.length + 1 });
            setName("");
            setImage("");
          });
        }}
        className="card p-3 flex gap-2 mb-4"
      >
        <input className="input w-20 text-center text-xl" placeholder="🍔" value={image} onChange={(e) => setImage(e.target.value)} aria-label="أيقونة" />
        <input className="input flex-1" placeholder="اسم القسم" required value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-brand"><Plus size={18} /> قسم</button>
      </form>
      <ul className="space-y-2">
        {categories.map((c) => (
          <li key={c.id} className="card p-3 flex items-center gap-3">
            <span className="w-10 text-2xl text-center">{isImageUrl(c.image) ? "🖼️" : c.image}</span>
            <input
              className="input flex-1"
              defaultValue={c.name}
              onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && run(() => api("/api/admin/categories", "POST", { ...c, name: e.target.value }))}
            />
            <input
              className="input w-16 text-center" type="number" dir="ltr" defaultValue={c.sort_order} aria-label="الترتيب"
              onBlur={(e) => Number(e.target.value) !== c.sort_order && run(() => api("/api/admin/categories", "POST", { ...c, sort_order: Number(e.target.value) }))}
            />
            <button
              onClick={() => confirm(`حذف ${c.name}؟`) && run(() => api(`/api/admin/categories?id=${c.id}`, "DELETE"))}
              aria-label="حذف" className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function AddonsTab({ addons, categories, run }: { addons: Addon[]; categories: Category[]; run: (fn: () => Promise<unknown>) => void }) {
  const [form, setForm] = useState({ name: "", price: "", category_id: "" });
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await api("/api/admin/addons", "POST", form);
            setForm({ name: "", price: "", category_id: form.category_id });
          });
        }}
        className="card p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4"
      >
        <input className="input col-span-2 sm:col-span-1" placeholder="اسم الإضافة" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="السعر" type="number" step="0.001" min="0" dir="ltr" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
          <option value="">كل الأقسام</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn-brand col-span-2 sm:col-span-1"><Plus size={18} /> إضافة</button>
      </form>
      <ul className="space-y-2">
        {addons.map((a) => (
          <li key={a.id} className="card p-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="font-bold">{a.name}</p>
              <p className="text-xs text-muted">{categories.find((c) => c.id === a.category_id)?.name ?? "كل الأقسام"}</p>
            </div>
            <input
              className="input w-28 text-center" type="number" step="0.001" min="0" dir="ltr" defaultValue={a.price} aria-label="السعر"
              onBlur={(e) => Number(e.target.value) !== a.price && run(() => api("/api/admin/addons", "POST", { ...a, price: e.target.value }))}
            />
            <button
              onClick={() => confirm(`حذف ${a.name}؟`) && run(() => api(`/api/admin/addons?id=${a.id}`, "DELETE"))}
              aria-label="حذف" className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
