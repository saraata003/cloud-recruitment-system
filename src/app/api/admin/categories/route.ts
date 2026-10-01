import { deleteCategory, saveCategory, UserError } from "@/lib/repo";
import { handler, json } from "@/lib/http";

export const POST = handler(
  async (req: Request) => {
    const b = await req.json();
    if (!String(b.name || "").trim()) throw new UserError("اكتب اسم القسم");
    return json({
      category: saveCategory({ id: b.id, name: String(b.name).trim(), image: b.image, sort_order: Number(b.sort_order) || 99 }),
    });
  },
  { staff: true },
);

export const DELETE = handler(
  async (req: Request) => {
    const id = new URL(req.url).searchParams.get("id");
    if (id) deleteCategory(id);
    return json({ ok: true });
  },
  { staff: true },
);
