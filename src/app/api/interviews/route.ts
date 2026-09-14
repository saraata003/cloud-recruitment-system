import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, interviews } from "@/db/schema";
import { handleApiError } from "@/lib/api-helpers";
import type { InterviewWithCandidate } from "@/types";

export async function GET() {
  try {
    const allInterviews = await db.select().from(interviews).orderBy(desc(interviews.createdAt));
    const candidateRows = await db.select().from(candidates);
    const candidateById = new Map(candidateRows.map((c) => [c.id, c]));

    const result: InterviewWithCandidate[] = allInterviews
      .map((iv) => ({ ...iv, candidate: candidateById.get(iv.candidateId)! }))
      .filter((iv) => Boolean(iv.candidate));

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
