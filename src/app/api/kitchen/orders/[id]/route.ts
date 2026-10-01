import { acceptOrder, markPickedUp, markReady, rejectOrder } from "@/lib/orders";
import { UserError } from "@/lib/repo";
import { handler, json } from "@/lib/http";

/** body: { action: "accept", minutes } | { action: "reject" } | { action: "ready" } | { action: "picked_up" } */
export const POST = handler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const body = await req.json();
    switch (body.action) {
      case "accept":
        return json({ order: await acceptOrder(id, Number(body.minutes)) });
      case "reject":
        return json({ order: await rejectOrder(id, body.reason) });
      case "ready":
        return json({ order: await markReady(id) });
      case "picked_up":
        return json({ order: await markPickedUp(id) });
      default:
        throw new UserError("إجراء غير معروف");
    }
  },
  { staff: true },
);
