import "server-only";
import { NextResponse } from "next/server";
import { isStaff } from "./auth";
import { UserError } from "./repo";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

/** Wraps a route handler: turns UserError into 400 and optionally requires the staff PIN. */
export function handler<A extends unknown[]>(
  fn: (...args: A) => Promise<Response>,
  opts: { staff?: boolean } = {},
) {
  return async (...args: A) => {
    try {
      if (opts.staff && !(await isStaff())) return json({ error: "غير مصرح" }, 401);
      return await fn(...args);
    } catch (e) {
      if (e instanceof UserError) return json({ error: e.message }, 400);
      console.error(e);
      return json({ error: "حدث خطأ، حاول مرة أخرى" }, 500);
    }
  };
}
