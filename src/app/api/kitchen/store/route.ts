import { getSettings, setSetting, UserError } from "@/lib/repo";
import { handler, json } from "@/lib/http";

const STATUSES = ["open", "busy", "very_busy", "paused"];

export const POST = handler(
  async (req: Request) => {
    const { store_status } = await req.json();
    if (!STATUSES.includes(store_status)) throw new UserError("حالة غير صحيحة");
    setSetting("store_status", store_status);
    return json({ settings: getSettings() });
  },
  { staff: true },
);
