import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

/** Kitchen + admin are protected by one shared PIN (STAFF_PIN). No customer login. */

export const STAFF_COOKIE = "drinkat_staff";
const pin = () => process.env.STAFF_PIN || "1234";
export const staffToken = () => crypto.createHash("sha256").update(`drinkat:${pin()}`).digest("hex");

export function checkPin(input: string) {
  const a = Buffer.from(String(input));
  const b = Buffer.from(pin());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function isStaff() {
  return (await cookies()).get(STAFF_COOKIE)?.value === staffToken();
}
