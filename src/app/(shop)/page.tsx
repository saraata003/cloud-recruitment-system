import Link from "next/link";
import { ArrowLeft, Clock, Store } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ProductImage } from "@/components/ProductImage";
import { busyExtraMinutes, getSettings, listCategories } from "@/lib/repo";
import { PAUSED_MESSAGE } from "@/lib/format";
import { isImageUrl } from "@/lib/category-emoji";

export const dynamic = "force-dynamic";

export default function Home() {
  const settings = getSettings();
  const categories = listCategories();
  const paused = settings.store_status === "paused";
  const extra = busyExtraMinutes(settings.store_status);

  return (
    <main className="px-5 pt-6">
      <Logo size="lg" />

      <section className="mt-8">
        <h1 className="text-3xl font-extrabold leading-snug">
          اطلب قبل ما توصل
          <br />
          <span className="text-brand">واستلم بسرعة</span>
        </h1>
        <p className="mt-3 text-muted">مشروبات ومأكولات لذيذة جاهزة لك في مطبخ DRINKAT السحابي</p>
      </section>

      {paused ? (
        <div className="mt-6 rounded-2xl bg-accent-light text-accent-dark p-4 font-bold">{PAUSED_MESSAGE}</div>
      ) : (
        <Link href="/menu" className="btn-primary w-full mt-8">
          ابدأ الطلب
          <ArrowLeft size={22} />
        </Link>
      )}

      <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <Store size={16} className="text-brand" />
          استلام من {settings.pickup_location}
        </span>
        {extra > 0 && !paused && (
          <span className="flex items-center gap-1.5 text-accent">
            <Clock size={16} />
            ضغط طلبات +{extra} د
          </span>
        )}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-extrabold mb-3">الأقسام</h2>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((c) => (
            <Link key={c.id} href={`/menu?c=${c.id}`} className="card overflow-hidden active:scale-[0.98] transition">
              <ProductImage
                src={isImageUrl(c.image) ? c.image : ""}
                emoji={c.image}
                alt={c.name}
                className="w-full h-24"
              />
              <div className="px-3 py-2.5 font-bold">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
