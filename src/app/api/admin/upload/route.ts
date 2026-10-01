import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/db";
import { UserError } from "@/lib/repo";
import { handler, json } from "@/lib/http";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Product image upload → stored in DATA_DIR/uploads, served by /api/uploads/[name]. */
export const POST = handler(
  async (req: Request) => {
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) throw new UserError("اختر صورة");
    const ext = TYPES[file.type];
    if (!ext) throw new UserError("الصورة يجب أن تكون JPG أو PNG أو WEBP");
    if (file.size > 5 * 1024 * 1024) throw new UserError("حجم الصورة أكبر من 5MB");
    const name = `${crypto.randomUUID()}.${ext}`;
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.writeFile(path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, name), Buffer.from(await file.arrayBuffer()));
    return json({ url: `/api/uploads/${name}` });
  },
  { staff: true },
);
