import { placeOrder } from "@/lib/orders";
import { listOrdersByIds } from "@/lib/repo";
import { handler, json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Place an order (no login – name + phone only). */
export const POST = handler(async (req: Request) => {
  const order = await placeOrder(await req.json());
  return json({ id: order.id, pickup_number: order.pickup_number }, 201);
});

/** "طلباتي": the browser keeps its order ids in localStorage and asks for them here. */
export const GET = handler(async (req: Request) => {
  const ids = (new URL(req.url).searchParams.get("ids") || "").split(",").filter(Boolean).slice(0, 30);
  return json({ orders: listOrdersByIds(ids) });
});
