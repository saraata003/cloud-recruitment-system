import "server-only";
import type { Order, OrderStatus } from "../types";

/**
 * Customer notifications.
 *
 * In-app: the tracking page polls the order and shows a banner/sound/browser
 * notification itself, so nothing is needed here for it.
 *
 * SMS / WhatsApp: implement a `Channel` and add it to `channels()`.
 */

export interface Channel {
  name: string;
  send(phone: string, text: string): Promise<void>;
}

const consoleChannel: Channel = {
  name: "log",
  async send(phone, text) {
    console.log(`[notify → ${phone}] ${text}`);
  },
};

function channels(): Channel[] {
  const list: Channel[] = [consoleChannel];
  // if (process.env.SMS_PROVIDER) list.push(smsChannel);
  // if (process.env.WHATSAPP_PROVIDER) list.push(whatsappChannel);
  return list;
}

export function messageFor(order: Order, status: OrderStatus): string | null {
  const n = order.pickup_number;
  switch (status) {
    case "preparing":
      return `تم قبول طلبك من DRINKAT وجاري التحضير. رقم الطلب ${n}`;
    case "ready":
      return `طلبك من DRINKAT جاهز للاستلام. رقم الطلب ${n}`;
    case "rejected":
      return `نعتذر، لم نتمكن من قبول طلبك رقم ${n} من DRINKAT.`;
    default:
      return null;
  }
}

export const NotificationService = {
  async orderStatusChanged(order: Order) {
    const text = messageFor(order, order.status);
    if (!text) return;
    await Promise.allSettled(channels().map((c) => c.send(order.customer_phone, text)));
  },
};
