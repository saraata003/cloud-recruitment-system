import "server-only";
import type { Order, OrderStatus, Product } from "../types";

/**
 * Foodics integration layer – Foodics stays the POS, we only talk to it.
 *
 * Right now everything is mocked (no credentials). When credentials arrive:
 *   1. set FOODICS_API_TOKEN / FOODICS_BRANCH_ID in .env
 *   2. fill in the `real` functions below (API docs: https://developers.foodics.com)
 * Nothing else in the app has to change.
 */

const API_URL = process.env.FOODICS_API_URL || "https://api.foodics.com/v5";
const TOKEN = process.env.FOODICS_API_TOKEN;
const BRANCH_ID = process.env.FOODICS_BRANCH_ID;

export const isFoodicsConfigured = () => Boolean(TOKEN && BRANCH_ID);

async function foodicsFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`Foodics ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export const FoodicsService = {
  /** Send a confirmed order to the Foodics POS. Returns the Foodics order id. */
  async sendOrder(order: Order): Promise<string> {
    if (!isFoodicsConfigured()) {
      console.log(`[Foodics mock] order #${order.pickup_number} (${order.items.length} lines) sent`);
      return `FOODICS-MOCK-${order.pickup_number}`;
    }
    // TODO: map our product ids to Foodics product ids (store foodics_id on products when syncing).
    const body = {
      branch_id: BRANCH_ID,
      type: 2, // pickup
      reference: String(order.pickup_number),
      customer_notes: `${order.customer_name} ${order.customer_phone}`,
      products: order.items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        kitchen_notes: i.notes,
      })),
    };
    const json = await foodicsFetch("/orders", { method: "POST", body: JSON.stringify(body) });
    return json?.data?.id as string;
  },

  /** Read an order status from Foodics (only if we ever need it). */
  async getOrderStatus(foodicsOrderId: string): Promise<OrderStatus | null> {
    if (!isFoodicsConfigured()) return null;
    const json = await foodicsFetch(`/orders/${foodicsOrderId}`);
    // TODO: map Foodics status codes to ours.
    console.log("[Foodics] status", json?.data?.status);
    return null;
  },

  /** Pull products from Foodics. Mock returns an empty list (we keep local data). */
  async syncProducts(): Promise<Partial<Product>[]> {
    if (!isFoodicsConfigured()) {
      console.log("[Foodics mock] syncProducts – nothing to sync");
      return [];
    }
    const json = await foodicsFetch("/products?include=category");
    return (json?.data ?? []).map((p: { id: string; name: string; name_localized?: string; price: number; description?: string }) => ({
      id: p.id,
      name_ar: p.name_localized || p.name,
      name_en: p.name,
      price: p.price,
      description: p.description ?? "",
    }));
  },

  /** Pull prices only. Mock returns an empty map. */
  async syncPrices(): Promise<Record<string, number>> {
    const products = await this.syncProducts();
    return Object.fromEntries(products.filter((p) => p.id).map((p) => [p.id!, p.price ?? 0]));
  },
};
