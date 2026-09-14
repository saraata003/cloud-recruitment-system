import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "drinkat.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

declare global {
  var __drinkatSqlite__: Database.Database | undefined;
  var __drinkatDb__: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const sqlite = globalThis.__drinkatSqlite__ ?? new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = globalThis.__drinkatDb__ ?? drizzle(sqlite, { schema });

if (process.env.NODE_ENV !== "production") {
  globalThis.__drinkatSqlite__ = sqlite;
  globalThis.__drinkatDb__ = db;
}

export { schema };
