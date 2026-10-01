import { deleteAddon, saveAddon, UserError } from "@/lib/repo";
import { handler, json } from "@/lib/http";

export const POST = handler(
  async (req: Request) => {
    const b = await req.json();
    const price = Number(b.price);
    if (!String(b.name || "").trim()) throw new UserError("اكتب اسم الإضافة");
    if (!(price >= 0)) throw new UserError("السعر غير صحيح");
    return json({ addon: saveAddon({ id: b.id, name: String(b.name).trim(), price, category_id: b.category_id || null }) });
  },
  { staff: true },
);

export const DELETE = handler(
  async (req: Request) => {
    const id = new URL(req.url).searchParams.get("id");
    if (id) deleteAddon(id);
    return json({ ok: true });
  },
  { staff: true },
);
