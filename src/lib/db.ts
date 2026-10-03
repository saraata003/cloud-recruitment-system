import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seed } from "./seed";

/**
 * One small SQLite file (Node's built-in driver, no native packages).
 * Tables match the plan: products, categories, addons, orders, order_items,
 * order_status_history, settings. All queries live in repo.ts, so moving to
 * Postgres/Supabase later only touches that file.
 */

export const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || path.join(process.cwd(), "data"));
export const UPLOADS_DIR = path.join(/*turbopackIgnore: true*/ DATA_DIR, "uploads");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL REFERENCES categories(id),
  price REAL NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  is_available INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS addons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  pickup_number INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total REAL NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_ref TEXT,
  prep_minutes INTEGER,
  ready_eta TEXT,
  foodics_order_id TEXT,
  reject_reason TEXT,
  idempotency_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  addons TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS order_status_history_order_idx ON order_status_history(order_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

const g = globalThis as unknown as { __drinkatDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (g.__drinkatDb) return g.__drinkatDb;
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const conn = new DatabaseSync(path.join(/*turbopackIgnore: true*/ DATA_DIR, "drinkat.db"));
  conn.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  conn.exec(SCHEMA);
  migrate(conn);
  const count = conn.prepare("SELECT COUNT(*) AS n FROM categories").get() as { n: number };
  if (count.n === 0) seed(conn);
  g.__drinkatDb = conn;
  return conn;
}

/** Small additive migrations for databases created by older versions. */
function migrate(conn: DatabaseSync) {
  const cols = (conn.prepare("PRAGMA table_info(orders)").all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes("idempotency_key")) conn.exec("ALTER TABLE orders ADD COLUMN idempotency_key TEXT");
  conn.exec("CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_idx ON orders(idempotency_key)");
}

/** Run several statements atomically. */
export function tx<T>(fn: () => T): T {
  const conn = db();
  conn.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    conn.exec("COMMIT");
    return result;
  } catch (e) {
    conn.exec("ROLLBACK");
    throw e;
  }
}
