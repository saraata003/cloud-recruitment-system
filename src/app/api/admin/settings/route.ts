import { getSettings, setSetting, UserError } from "@/lib/repo";
import { handler, json } from "@/lib/http";

/** Small store settings editable from /admin (CliQ details). */
export const POST = handler(
  async (req: Request) => {
    const b = await req.json();
    const alias = String(b.cliq_alias ?? "").trim();
    const name = String(b.cliq_name ?? "").trim();
    if (!alias) throw new UserError("اكتب CliQ Alias");
    setSetting("cliq_alias", alias.slice(0, 40));
    setSetting("cliq_name", name.slice(0, 60));
    return json({ settings: getSettings() });
  },
  { staff: true },
);
