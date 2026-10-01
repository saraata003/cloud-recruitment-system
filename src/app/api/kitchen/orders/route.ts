import { listOrders } from "@/lib/repo";
import { handler, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = handler(
  async () => json({ orders: listOrders(["pending", "accepted", "preparing", "ready"]) }),
  { staff: true },
);
