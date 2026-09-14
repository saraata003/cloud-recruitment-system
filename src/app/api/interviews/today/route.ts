import { inArray, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, interviews } from "@/db/schema";
import { handleApiError } from "@/lib/api-helpers";
import { isToday } from "@/lib/utils";
import type { TodayInterview } from "@/types";

export async function GET() {
  try {
    const openInterviews = await db.select().from(interviews).where(isNull(interviews.outcome));
    const todaysInterviews = openInterviews.filter((i) => isToday(i.scheduledAt));

    const candidateIds = [...new Set(todaysInterviews.map((i) => i.candidateId))];
    const candidateRows = candidateIds.length
      ? await db.select().from(candidates).where(inArray(candidates.id, candidateIds))
      : [];
    const candidateById = new Map(candidateRows.map((c) => [c.id, c]));

    const result: TodayInterview[] = todaysInterviews
      .map((i) => ({ ...i, candidate: candidateById.get(i.candidateId)! }))
      .filter((i) => Boolean(i.candidate))
      .sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
