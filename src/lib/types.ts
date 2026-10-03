export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "picked_up"
  | "rejected";

export type StoreStatus = "open" | "busy" | "very_busy" | "paused";

export type PaymentMethod = "card" | "cliq" | "cash";
/**
 * unpaid  – cash, paid at the counter
 * pending – waiting for a CliQ transfer to be confirmed by staff
 * paid    – card charged / CliQ confirmed / cash collected
 */
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed";

export interface Category {
  id: string;
  name: string;
  image: string; // URL or emoji
  sort_order: number;
}

export interface Product {
  id: string;
  name_ar: string;
  name_en: string;
  description: string;
  category: string; // category id
  price: number; // JD
  image: string; // URL ("" = use category emoji)
  is_available: boolean;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  category_id: string | null; // null = available for every product
}

export interface Settings {
  store_status: StoreStatus;
  store_name: string;
  pickup_location: string;
  default_prep_minutes: number;
  cliq_alias: string; // shown to the customer for CliQ transfers
  cliq_name: string; // account name the customer should see in their bank app
}

export interface OrderItemAddon {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: number;
  order_id: string;
  product_id: string;
  name: string;
  unit_price: number; // product price + addons
  quantity: number;
  addons: OrderItemAddon[];
  notes: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  created_at: string;
}

export interface Order {
  id: string; // internal id (random, used in tracking URL)
  pickup_number: number; // shown to the customer
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_ref: string | null;
  prep_minutes: number | null;
  ready_eta: string | null; // ISO time the order should be ready
  foodics_order_id: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  history: StatusHistoryEntry[];
}

/** What the browser sends when placing an order. Prices are recomputed on the server. */
export interface NewOrderInput {
  customer_name: string;
  customer_phone: string;
  payment_method: PaymentMethod;
  /** Card token from the payment form (card data itself never reaches our server). */
  payment_token?: string;
  /** Random id per checkout attempt – a retry or double tap never creates a second order. */
  idempotency_key?: string;
  items: {
    product_id: string;
    quantity: number;
    addon_ids: string[];
    notes?: string;
  }[];
}
