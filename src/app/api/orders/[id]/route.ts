import { getOrder, getSettings } from "@/lib/repo";
import { handler, json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Polled by the tracking page every few seconds. */
export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const order = getOrder((await ctx.params).id);
  if (!order) return json({ error: "الطلب غير موجود" }, 404);
  const s = getSettings();
  return json({ order, store_status: s.store_status, cliq: { alias: s.cliq_alias, name: s.cliq_name } });
});
