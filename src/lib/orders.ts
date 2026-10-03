import "server-only";
import crypto from "node:crypto";
import {
  busyExtraMinutes, findOrderByIdempotencyKey, getOrder, getSettings, insertOrder, priceCart, setFoodicsId,
  setOrderStatus, setPaymentStatus, UserError,
} from "./repo";
import { PaymentService } from "./services/payments";
import { FoodicsService } from "./services/foodics";
import { NotificationService } from "./services/notifications";
import type { NewOrderInput, Order } from "./types";

/** Order flow in one place: create → accept(+minutes) → preparing → ready → picked_up. */

/** Jordan mobile → 07XXXXXXXX. Accepts 7…, 07…, 9627…, +9627…, 009627… */
export function normalizePhone(raw: string): string | null {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("962")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return /^7[789]\d{7}$/.test(d) ? `0${d}` : null;
}

export async function placeOrder(input: NewOrderInput): Promise<Order> {
  // Same checkout attempt sent twice (double tap, flaky network) → same order, never a second charge.
  const key = input.idempotency_key ? String(input.idempotency_key).slice(0, 64) : null;
  if (key) {
    const existing = findOrderByIdempotencyKey(key);
    if (existing) return existing;
  }

  const settings = getSettings();
  if (settings.store_status === "paused") throw new UserError("الطلبات متوقفة مؤقتاً، جرب بعد قليل.", "paused");

  const name = String(input.customer_name || "").trim().slice(0, 60);
  const phone = normalizePhone(input.customer_phone);
  if (name.length < 2) throw new UserError("اكتب اسمك", "invalid_name");
  if (!phone) throw new UserError("رقم الموبايل غير صحيح، مثال: 79 123 4567", "invalid_phone");
  if (!PaymentService.methods.includes(input.payment_method)) throw new UserError("اختر طريقة الدفع");
  if (input.payment_method === "card" && !input.payment_token) throw new UserError("أدخل بيانات البطاقة", "invalid_card");

  const priced = priceCart(input.items);
  const id = crypto.randomUUID();
  const payment = await PaymentService.charge({
    orderId: id,
    idempotencyKey: key || id,
    amount: priced.total,
    method: input.payment_method,
    token: input.payment_token,
    customerName: name,
    customerPhone: phone,
  });
  if (payment.status === "failed") {
    throw new UserError(payment.error || "ما قدرنا نكمل الدفع، جرّب مرة ثانية", "payment_failed");
  }

  try {
    return insertOrder({
      id,
      input: { ...input, customer_name: name, customer_phone: phone },
      priced,
      payment_status: payment.status,
      payment_ref: payment.reference,
      idempotency_key: key,
    });
  } catch (e) {
    // Two identical requests raced past the check above: return the one that won.
    const existing = key ? findOrderByIdempotencyKey(key) : null;
    if (existing) return existing;
    throw e;
  }
}

/** Staff confirm a CliQ transfer arrived. */
export async function confirmPayment(id: string): Promise<Order> {
  const order = getOrder(id);
  if (!order) throw new UserError("الطلب غير موجود");
  if (order.payment_status === "paid") return order;
  setPaymentStatus(id, "paid");
  return getOrder(id)!;
}

export async function acceptOrder(id: string, minutes: number): Promise<Order> {
  if (![5, 10, 15, 20, 30].includes(minutes)) throw new UserError("وقت غير صحيح");
  const total = minutes + busyExtraMinutes(getSettings().store_status);
  const eta = new Date(Date.now() + total * 60_000).toISOString();
  setOrderStatus(id, "accepted", { prep_minutes: total, ready_eta: eta });
  const order = setOrderStatus(id, "preparing");

  // Send to the POS. A Foodics failure must not block the kitchen.
  try {
    setFoodicsId(id, await FoodicsService.sendOrder(order));
  } catch (e) {
    console.error("[Foodics] sendOrder failed", e);
  }
  await NotificationService.orderStatusChanged(order);
  return getOrder(id)!;
}

export async function rejectOrder(id: string, reason?: string): Promise<Order> {
  const order = setOrderStatus(id, "rejected", { reject_reason: reason?.slice(0, 200) || undefined });
  await NotificationService.orderStatusChanged(order);
  return order;
}

export async function markReady(id: string): Promise<Order> {
  const order = setOrderStatus(id, "ready");
  await NotificationService.orderStatusChanged(order);
  return order;
}

export async function markPickedUp(id: string): Promise<Order> {
  const order = setOrderStatus(id, "picked_up");
  // Cash (or a CliQ transfer checked at the counter) is settled when the customer collects.
  if (order.payment_status !== "paid") setPaymentStatus(id, "paid");
  return getOrder(id)!;
}
