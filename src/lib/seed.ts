import type { DatabaseSync } from "node:sqlite";

/**
 * Starter menu so the app works out of the box.
 * Edit / replace everything from the Admin page (/admin) – no code changes needed.
 */
const categories = [
  { id: "smash", name: "سماش برغر", image: "🍔", sort_order: 1 },
  { id: "coffee", name: "قهوة", image: "☕", sort_order: 2 },
  { id: "fresh", name: "فريش", image: "🥤", sort_order: 3 },
  { id: "extras", name: "إضافات", image: "🍟", sort_order: 4 },
];

const products = [
  { id: "smash-classic", name_ar: "سماش برغر كلاسيك", name_en: "Classic Smash Burger", category: "smash", price: 4.25,
    description: "قطعتان من اللحم البقري الطازج، جبنة أمريكية، مخلل، بصل وصوص DRINKAT الخاص في خبز طري ومحمص." },
  { id: "smash-double", name_ar: "دبل سماش برغر", name_en: "Double Smash Burger", category: "smash", price: 5.5,
    description: "أربع قطع لحم سماش مع دبل جبنة وصوص DRINKAT الخاص." },
  { id: "smash-spicy", name_ar: "سماش سبايسي", name_en: "Spicy Smash Burger", category: "smash", price: 4.75,
    description: "سماش برغر مع هالبينو وصوص حار وجبنة شيدر." },
  { id: "iced-latte", name_ar: "آيس لاتيه", name_en: "Iced Latte", category: "coffee", price: 3.0,
    description: "إسبريسو مع حليب بارد وثلج." },
  { id: "spanish-latte", name_ar: "سبانش لاتيه", name_en: "Spanish Latte", category: "coffee", price: 3.25,
    description: "إسبريسو مع حليب محلّى بطعم كريمي." },
  { id: "americano", name_ar: "أمريكانو", name_en: "Americano", category: "coffee", price: 2.25,
    description: "إسبريسو مع ماء ساخن أو بارد." },
  { id: "mango-fresh", name_ar: "مانجو فريش", name_en: "Mango Fresh", category: "fresh", price: 3.25,
    description: "عصير مانجو طبيعي طازج." },
  { id: "strawberry-fresh", name_ar: "فراولة فريش", name_en: "Strawberry Fresh", category: "fresh", price: 3.25,
    description: "عصير فراولة طبيعي طازج." },
  { id: "lemon-mint", name_ar: "ليمون ونعنع", name_en: "Lemon Mint", category: "fresh", price: 2.75,
    description: "ليمون طازج مع نعنع وثلج." },
  { id: "fries", name_ar: "بطاطا مقلية", name_en: "Fries", category: "extras", price: 2.0,
    description: "بطاطا مقلية مقرمشة." },
  { id: "cheese-fries", name_ar: "بطاطا بالجبنة", name_en: "Cheese Fries", category: "extras", price: 2.75,
    description: "بطاطا مقلية مع صوص الجبنة." },
];

const addons = [
  { id: "add-cheese", name: "إضافة جبنة", price: 0.5, category_id: "smash" },
  { id: "add-patty", name: "إضافة لحم", price: 1.5, category_id: "smash" },
  { id: "add-sauce", name: "صوص خاص", price: 0.25, category_id: "smash" },
  { id: "add-shot", name: "شوت إسبريسو إضافي", price: 0.5, category_id: "coffee" },
  { id: "add-oat", name: "حليب شوفان", price: 0.5, category_id: "coffee" },
  { id: "add-vanilla", name: "سيروب فانيلا", price: 0.35, category_id: "coffee" },
  { id: "add-cheese-sauce", name: "صوص جبنة", price: 0.5, category_id: "extras" },
];

export const DEFAULT_SETTINGS: Record<string, string> = {
  store_status: "open",
  store_name: "DRINKAT Cloud Kitchen",
  pickup_location: "DRINKAT Cloud Kitchen",
  default_prep_minutes: "15",
  next_pickup_number: "101",
  cliq_alias: "DRINKAT",
  cliq_name: "DRINKAT Cloud Kitchen",
};

export function seed(conn: DatabaseSync) {
  const c = conn.prepare("INSERT INTO categories (id, name, image, sort_order) VALUES (?, ?, ?, ?)");
  for (const x of categories) c.run(x.id, x.name, x.image, x.sort_order);

  const p = conn.prepare(
    "INSERT INTO products (id, name_ar, name_en, description, category, price, image, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?, '', 1, ?)",
  );
  products.forEach((x, i) => p.run(x.id, x.name_ar, x.name_en, x.description, x.category, x.price, i));

  const a = conn.prepare("INSERT INTO addons (id, name, price, category_id) VALUES (?, ?, ?, ?)");
  for (const x of addons) a.run(x.id, x.name, x.price, x.category_id);

  const s = conn.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) s.run(k, v);
}
