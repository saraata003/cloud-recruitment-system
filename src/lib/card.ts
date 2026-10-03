/**
 * Card helpers for the checkout form (runs in the browser only).
 *
 * `tokenizeCard` is the single place that touches raw card data. Today it is a
 * mock; when a gateway is connected replace it with the gateway's hosted
 * fields / JS SDK, which returns the same kind of one-time token. The server
 * only ever receives the token.
 */

export type CardBrand = "visa" | "mastercard" | null;

export const digits = (s: string) => s.replace(/\D/g, "");

export function cardBrand(num: string): CardBrand {
  const d = digits(num);
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return "mastercard";
  return null;
}

export const formatCardNumber = (s: string) => digits(s).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");

export function formatExpiry(s: string) {
  const d = digits(s).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function luhn(num: string) {
  const d = digits(num);
  if (d.length < 13) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export function expiryValid(exp: string) {
  const d = digits(exp);
  if (d.length !== 4) return false;
  const m = Number(d.slice(0, 2));
  const y = 2000 + Number(d.slice(2));
  if (m < 1 || m > 12) return false;
  const now = new Date();
  return y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth() + 1);
}

export interface CardInput {
  number: string;
  expiry: string;
  cvc: string;
}

/** Field-level errors (Arabic), empty object = valid. */
export function validateCard(c: CardInput): Partial<Record<keyof CardInput, string>> {
  const e: Partial<Record<keyof CardInput, string>> = {};
  if (!luhn(c.number) || !cardBrand(c.number)) e.number = "رقم البطاقة غير صحيح";
  if (!expiryValid(c.expiry)) e.expiry = "تاريخ غير صحيح";
  if (!/^\d{3,4}$/.test(c.cvc)) e.cvc = "CVV غير صحيح";
  return e;
}

/** Test card that the mock gateway declines, to try the failure flow. */
export const MOCK_DECLINE_CARD = "4000000000000002";

export async function tokenizeCard(c: CardInput): Promise<string> {
  const d = digits(c.number);
  if (d === MOCK_DECLINE_CARD) return "tok_mock_decline";
  return `tok_mock_${d.slice(-4)}`;
}
