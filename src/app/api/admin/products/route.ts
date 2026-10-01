import { deleteProduct, getProduct, listProducts, saveProduct, UserError } from "@/lib/repo";
import { handler, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = handler(async () => json({ products: listProducts() }), { staff: true });

/** Create or update (send `id` to update). */
export const POST = handler(
  async (req: Request) => {
    const b = await req.json();
    const price = Number(b.price);
    if (!String(b.name_ar || "").trim()) throw new UserError("اكتب اسم المنتج");
    if (!b.category) throw new UserError("اختر القسم");
    if (!(price >= 0)) throw new UserError("السعر غير صحيح");
    const existing = b.id ? getProduct(b.id) : null;
    return json({
      product: saveProduct({ ...existing, ...b, name_ar: String(b.name_ar).trim(), price }),
    });
  },
  { staff: true },
);

export const DELETE = handler(
  async (req: Request) => {
    const id = new URL(req.url).searchParams.get("id");
    if (id) deleteProduct(id);
    return json({ ok: true });
  },
  { staff: true },
);
