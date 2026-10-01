import { NextResponse } from "next/server";
import { checkPin, STAFF_COOKIE, staffToken } from "@/lib/auth";

export async function POST(req: Request) {
  const { pin } = await req.json().catch(() => ({ pin: "" }));
  if (!checkPin(pin)) return NextResponse.json({ error: "الرمز غير صحيح" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STAFF_COOKIE, staffToken(), {
    httpOnly: true,
    sameSite: "lax",
    // Secure only over HTTPS so it also works on http://localhost or a LAN tablet.
    secure: (req.headers.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "")) === "https",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
