import "server-only";
import crypto from "node:crypto";
import {
  busyExtraMinutes, getOrder, getSettings, insertOrder, priceCart, setFoodicsId, setOrderStatus, UserError,
} from "./repo";
import { PaymentService } from "./services/payments";
import { FoodicsService } from "./services/foodics";
import { NotificationService } from "./services/notifications";
import type { NewOrderInput, Order } from "./types";

/** Order flow in one place: create → accept(+minutes) → preparing → ready → picked_up. */

export async function placeOrder(input: NewOrderInput): Promise<Order> {
  const settings = getSettings();
  if (settings.store_status === "paused") throw new UserError("الطلبات متوقفة مؤقتاً، جرب بعد قليل.");

  const name = String(input.customer_name || "").trim().slice(0, 60);
  const phone = String(input.customer_phone || "").replace(/[^\d+]/g, "");
  if (name.length < 2) throw new UserError("اكتب اسمك");
  if (!/^\+?\d{9,14}$/.test(phone)) throw new UserError("رقم الهاتف غير صحيح");
  if (!PaymentService.methods.includes(input.payment_method)) throw new UserError("اختر طريقة الدفع");

  const priced = priceCart(input.items);
  const id = crypto.randomUUID();
  const payment = await PaymentService.charge({
    orderId: id,
    amount: priced.total,
    method: input.payment_method,
    customerName: name,
    customerPhone: phone,
  });
  if (payment.status === "failed") throw new UserError(payment.error || "فشل الدفع، حاول مرة أخرى");

  return insertOrder({
    id,
    input: { ...input, customer_name: name, customer_phone: phone },
    priced,
    payment_status: payment.status,
    payment_ref: payment.reference,
  });
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
  return setOrderStatus(id, "picked_up");
}
