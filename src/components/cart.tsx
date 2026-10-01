"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CartAddon { id: string; name: string; price: number }
export interface CartLine {
  key: string;
  product_id: string;
  name: string;
  image: string;
  emoji: string;
  unit_price: number; // product + addons
  addons: CartAddon[];
  quantity: number;
  notes: string;
}

interface CartCtx {
  lines: CartLine[];
  count: number;
  total: number;
  add: (line: Omit<CartLine, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  ready: boolean;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "drinkat_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setLines(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, "key">) => {
    // Same product + same addons + same notes → just increase quantity.
    const key = `${line.product_id}|${line.addons.map((a) => a.id).sort().join(",")}|${line.notes}`;
    setLines((ls) => {
      const found = ls.find((l) => l.key === key);
      if (found) return ls.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, l.quantity + line.quantity) } : l));
      return [...ls, { ...line, key }];
    });
  }, []);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      ready,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      total: Math.round(lines.reduce((s, l) => s + l.unit_price * l.quantity, 0) * 1000) / 1000,
      add,
      setQty: (key, qty) =>
        setLines((ls) => (qty <= 0 ? ls.filter((l) => l.key !== key) : ls.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, qty) } : l)))),
      remove: (key) => setLines((ls) => ls.filter((l) => l.key !== key)),
      clear: () => setLines([]),
    }),
    [lines, ready, add],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

/* "طلباتي" – order ids saved on this device (no login). */
const ORDERS_KEY = "drinkat_orders";
export function getMyOrderIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  } catch {
    return [];
  }
}
export function rememberOrder(id: string) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify([id, ...getMyOrderIds().filter((x) => x !== id)].slice(0, 30)));
  } catch {}
}
