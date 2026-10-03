import "server-only";
import crypto from "node:crypto";
import { db, tx } from "./db";
import { DEFAULT_SETTINGS } from "./seed";
import type {
  Addon, Category, NewOrderInput, Order, OrderItem, OrderStatus, Product, Settings, StoreStatus,
} from "./types";

// node:sqlite returns null-prototype rows; always spread them into plain objects
// before they reach React (Server → Client props must be plain objects).
type Row = Record<string, unknown>;
const now = () => new Date().toISOString();
const money = (n: number) => Math.round(n * 1000) / 1000;

/* ---------------- settings ---------------- */

export function getSettings(): Settings {
  const rows = db().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const m: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) m[r.key] = r.value;
  return {
    store_status: m.store_status as StoreStatus,
    store_name: m.store_name,
    pickup_location: m.pickup_location,
    default_prep_minutes: Number(m.default_prep_minutes),
    cliq_alias: m.cliq_alias,
    cliq_name: m.cliq_name,
  };
}

export function setSetting(key: keyof Settings, value: string) {
  db().prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, value);
}

/** BUSY adds ~10 minutes, VERY BUSY ~20 minutes to the time we promise the customer. */
export function busyExtraMinutes(status: StoreStatus): number {
  return status === "busy" ? 10 : status === "very_busy" ? 20 : 0;
}

/* ---------------- menu ---------------- */

const toProduct = (r: Row): Product => ({
  id: r.id as string,
  name_ar: r.name_ar as string,
  name_en: r.name_en as string,
  description: r.description as string,
  category: r.category as string,
  price: r.price as number,
  image: r.image as string,
  is_available: r.is_available === 1,
});

export function listCategories(): Category[] {
  return db().prepare("SELECT * FROM categories ORDER BY sort_order, name").all().map((r) => ({ ...r }) as unknown as Category);
}

export function listProducts(opts: { onlyAvailable?: boolean } = {}): Product[] {
  const where = opts.onlyAvailable ? "WHERE is_available = 1" : "";
  return (db().prepare(`SELECT * FROM products ${where} ORDER BY sort_order, name_ar`).all() as Row[]).map(toProduct);
}

export function getProduct(id: string): Product | null {
  const r = db().prepare("SELECT * FROM products WHERE id = ?").get(id) as Row | undefined;
  return r ? toProduct(r) : null;
}

export function listAddons(): Addon[] {
  return db().prepare("SELECT * FROM addons ORDER BY category_id, name").all().map((r) => ({ ...r }) as unknown as Addon);
}

export function addonsForProduct(p: Product): Addon[] {
  return listAddons().filter((a) => a.category_id === null || a.category_id === p.category);
}

const slug = (prefix: string) => `${prefix}-${crypto.randomBytes(4).toString("hex")}`;

export function saveProduct(p: Partial<Product> & { name_ar: string; category: string; price: number }): Product {
  const id = p.id || slug("p");
  db().prepare(`
    INSERT INTO products (id, name_ar, name_en, description, category, price, image, is_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name_ar = excluded.name_ar, name_en = excluded.name_en,
      description = excluded.description, category = excluded.category, price = excluded.price,
      image = excluded.image, is_available = excluded.is_available
  `).run(id, p.name_ar, p.name_en ?? "", p.description ?? "", p.category, money(p.price), p.image ?? "",
    p.is_available === false ? 0 : 1);
  return getProduct(id)!;
}

export function deleteProduct(id: string) {
  db().prepare("DELETE FROM products WHERE id = ?").run(id);
}

export function saveCategory(c: Partial<Category> & { name: string }): Category {
  const id = c.id || slug("c");
  db().prepare(`
    INSERT INTO categories (id, name, image, sort_order) VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, image = excluded.image, sort_order = excluded.sort_order
  `).run(id, c.name, c.image ?? "", c.sort_order ?? 99);
  return { id, name: c.name, image: c.image ?? "", sort_order: c.sort_order ?? 99 };
}

export function deleteCategory(id: string) {
  const used = db().prepare("SELECT COUNT(*) AS n FROM products WHERE category = ?").get(id) as { n: number };
  if (used.n > 0) throw new UserError("لا يمكن حذف قسم فيه منتجات");
  db().prepare("DELETE FROM categories WHERE id = ?").run(id);
}

export function saveAddon(a: Partial<Addon> & { name: string; price: number }): Addon {
  const id = a.id || slug("a");
  db().prepare(`
    INSERT INTO addons (id, name, price, category_id) VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, price = excluded.price, category_id = excluded.category_id
  `).run(id, a.name, money(a.price), a.category_id || null);
  return { id, name: a.name, price: money(a.price), category_id: a.category_id || null };
}

export function deleteAddon(id: string) {
  db().prepare("DELETE FROM addons WHERE id = ?").run(id);
}

/* ---------------- orders ---------------- */

/**
 * Errors whose message is safe to show to the user.
 * `code` lets the UI react (e.g. show the "out of stock" sheet), `data` carries details.
 */
export class UserError extends Error {
  constructor(message: string, public code?: string, public data?: unknown) {
    super(message);
  }
}

export function getOrder(id: string): Order | null {
  const r = db().prepare("SELECT * FROM orders WHERE id = ?").get(id) as Row | undefined;
  if (!r) return null;
  return hydrate([r])[0];
}

export function listOrders(statuses: OrderStatus[], limit = 100): Order[] {
  const marks = statuses.map(() => "?").join(",");
  const rows = db()
    .prepare(`SELECT * FROM orders WHERE status IN (${marks}) ORDER BY created_at ASC LIMIT ?`)
    .all(...statuses, limit) as Row[];
  return hydrate(rows);
}

export function listOrdersByIds(ids: string[]): Order[] {
  if (ids.length === 0) return [];
  const marks = ids.map(() => "?").join(",");
  const rows = db().prepare(`SELECT * FROM orders WHERE id IN (${marks}) ORDER BY created_at DESC`).all(...ids) as Row[];
  return hydrate(rows);
}

function hydrate(rows: Row[]): Order[] {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id as string);
  const marks = ids.map(() => "?").join(",");
  const items = db().prepare(`SELECT * FROM order_items WHERE order_id IN (${marks}) ORDER BY id`).all(...ids) as Row[];
  const hist = db()
    .prepare(`SELECT order_id, status, created_at FROM order_status_history WHERE order_id IN (${marks}) ORDER BY id`)
    .all(...ids) as Row[];
  return rows.map((r) => ({
    ...(r as unknown as Order),
    items: items
      .filter((i) => i.order_id === r.id)
      .map((i) => ({ ...(i as unknown as OrderItem), addons: JSON.parse(i.addons as string) })),
    history: hist
      .filter((h) => h.order_id === r.id)
      .map((h) => ({ status: h.status as OrderStatus, created_at: h.created_at as string })),
  }));
}

/**
 * Validates the cart against the database (prices are never trusted from the browser)
 * and returns the priced lines + total.
 */
export function priceCart(input: NewOrderInput["items"]) {
  if (!Array.isArray(input) || input.length === 0) throw new UserError("السلة فارغة");
  const allAddons = new Map(listAddons().map((a) => [a.id, a]));

  // Report every sold-out product at once so the customer can drop them in one tap.
  const unavailable = [...new Set(input.map((l) => l.product_id))].filter((id) => {
    const p = getProduct(id);
    return !p || !p.is_available;
  });
  if (unavailable.length > 0) {
    throw new UserError("في منتج خلص هلأ", "unavailable", { product_ids: unavailable });
  }

  const lines = input.map((line) => {
    const p = getProduct(line.product_id)!;
    const qty = Math.floor(Number(line.quantity));
    if (!(qty >= 1 && qty <= 50)) throw new UserError("الكمية غير صحيحة");
    const addons = (line.addon_ids || []).map((id) => {
      const a = allAddons.get(id);
      if (!a || (a.category_id && a.category_id !== p.category)) throw new UserError("إضافة غير صحيحة");
      return { id: a.id, name: a.name, price: a.price };
    });
    const unit = money(p.price + addons.reduce((s, a) => s + a.price, 0));
    return { product: p, quantity: qty, addons, unit_price: unit, notes: String(line.notes || "").slice(0, 200) };
  });
  const total = money(lines.reduce((s, l) => s + l.unit_price * l.quantity, 0));
  return { lines, total };
}

export function insertOrder(args: {
  id: string;
  input: NewOrderInput;
  priced: ReturnType<typeof priceCart>;
  payment_status: string;
  payment_ref: string | null;
  idempotency_key: string | null;
}): Order {
  const { id, input, priced } = args;
  tx(() => {
    const conn = db();
    const n = conn.prepare("SELECT value FROM settings WHERE key = 'next_pickup_number'").get() as { value: string } | undefined;
    const pickup = Number(n?.value ?? DEFAULT_SETTINGS.next_pickup_number);
    conn.prepare("INSERT INTO settings (key, value) VALUES ('next_pickup_number', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .run(String(pickup >= 999 ? 101 : pickup + 1));
    const t = now();
    conn.prepare(`
      INSERT INTO orders (id, pickup_number, customer_name, customer_phone, status, total, payment_method,
        payment_status, payment_ref, idempotency_key, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)
    `).run(id, pickup, input.customer_name, input.customer_phone, priced.total, input.payment_method,
      args.payment_status, args.payment_ref, args.idempotency_key, t, t);
    const ins = conn.prepare(
      "INSERT INTO order_items (order_id, product_id, name, unit_price, quantity, addons, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    for (const l of priced.lines) {
      ins.run(id, l.product.id, l.product.name_ar, l.unit_price, l.quantity, JSON.stringify(l.addons), l.notes);
    }
    conn.prepare("INSERT INTO order_status_history (order_id, status, created_at) VALUES (?, 'pending', ?)").run(id, t);
  });
  return getOrder(id)!;
}

/** Allowed moves for the kitchen. accepted is immediately followed by preparing. */
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "rejected"],
  accepted: ["preparing", "ready"],
  preparing: ["ready"],
  ready: ["picked_up"],
  picked_up: [],
  rejected: [],
};

export function setOrderStatus(
  id: string,
  status: OrderStatus,
  extra: { prep_minutes?: number; ready_eta?: string; reject_reason?: string; foodics_order_id?: string } = {},
): Order {
  tx(() => {
    const conn = db();
    const cur = conn.prepare("SELECT status FROM orders WHERE id = ?").get(id) as { status: OrderStatus } | undefined;
    if (!cur) throw new UserError("الطلب غير موجود");
    if (!NEXT[cur.status].includes(status)) throw new UserError(`لا يمكن تغيير الحالة من ${cur.status} إلى ${status}`);
    const t = now();
    conn.prepare(`
      UPDATE orders SET status = ?, updated_at = ?,
        prep_minutes = COALESCE(?, prep_minutes), ready_eta = COALESCE(?, ready_eta),
        reject_reason = COALESCE(?, reject_reason), foodics_order_id = COALESCE(?, foodics_order_id)
      WHERE id = ?
    `).run(status, t, extra.prep_minutes ?? null, extra.ready_eta ?? null, extra.reject_reason ?? null,
      extra.foodics_order_id ?? null, id);
    conn.prepare("INSERT INTO order_status_history (order_id, status, created_at) VALUES (?, ?, ?)").run(id, status, t);
  });
  return getOrder(id)!;
}

export function findOrderByIdempotencyKey(key: string): Order | null {
  const r = db().prepare("SELECT id FROM orders WHERE idempotency_key = ?").get(key) as { id: string } | undefined;
  return r ? getOrder(r.id) : null;
}

export function setPaymentStatus(id: string, status: "paid" | "pending" | "unpaid", ref?: string) {
  db().prepare("UPDATE orders SET payment_status = ?, payment_ref = COALESCE(?, payment_ref), updated_at = ? WHERE id = ?")
    .run(status, ref ?? null, now(), id);
}

export function setFoodicsId(id: string, foodicsId: string) {
  db().prepare("UPDATE orders SET foodics_order_id = ? WHERE id = ?").run(foodicsId, id);
}
