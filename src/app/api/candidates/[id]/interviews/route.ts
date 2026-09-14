import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, interviews } from "@/db/schema";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { addStatusHistory } from "@/lib/candidates-repo";
import { interviewCreateSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const candidate = await db.query.candidates.findFirst({ where: eq(candidates.id, id) });
    if (!candidate) return jsonError("Candidate not found", 404);

    const body = await request.json().catch(() => ({}));
    const { scheduledAt } = interviewCreateSchema.parse(body);

    const existingInterviews = await db.select({ id: interviews.id }).from(interviews).where(eq(interviews.candidateId, id));
    const round = existingInterviews.length + 1;

    const [created] = await db
      .insert(interviews)
      .values({ candidateId: id, round, scheduledAt: scheduledAt ?? null })
      .returning();

    if (candidate.stage !== "INTERVIEW") {
      await db
        .update(candidates)
        .set({ stage: "INTERVIEW", updatedAt: new Date().toISOString() })
        .where(eq(candidates.id, id));
      await addStatusHistory(id, candidate.stage, "INTERVIEW", `Interview #${round} scheduled`);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
