import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, interviews } from "@/db/schema";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { addStatusHistory } from "@/lib/candidates-repo";
import { OUTCOME_TO_STAGE, INTERVIEW_OUTCOME_LABELS, type InterviewOutcome } from "@/lib/constants";
import { interviewUpdateSchema } from "@/lib/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const interview = await db.query.interviews.findFirst({ where: eq(interviews.id, id) });
    if (!interview) return jsonError("Interview not found", 404);
    const candidate = await db.query.candidates.findFirst({ where: eq(candidates.id, interview.candidateId) });
    if (!candidate) return jsonError("Candidate not found", 404);
    return NextResponse.json({ ...interview, candidate });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await db.query.interviews.findFirst({ where: eq(interviews.id, id) });
    if (!existing) return jsonError("Interview not found", 404);

    const body = await request.json();
    const data = interviewUpdateSchema.parse(body);

    const updatePayload: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() };
    if (data.outcome) updatePayload.completedAt = new Date().toISOString();

    const [updated] = await db.update(interviews).set(updatePayload).where(eq(interviews.id, id)).returning();

    let candidate = await db.query.candidates.findFirst({ where: eq(candidates.id, existing.candidateId) });

    if (data.outcome && candidate) {
      const previousStage = candidate.stage;
      const outcome = data.outcome as InterviewOutcome;
      const newStage = OUTCOME_TO_STAGE[outcome];
      const candidateUpdate: Record<string, unknown> = { stage: newStage, updatedAt: new Date().toISOString() };
      if (outcome === "HIRE" && !candidate.hiredAt) {
        candidateUpdate.hiredAt = new Date().toISOString();
      }
      [candidate] = await db.update(candidates).set(candidateUpdate).where(eq(candidates.id, candidate.id)).returning();
      await addStatusHistory(candidate.id, previousStage, newStage, `Interview outcome: ${INTERVIEW_OUTCOME_LABELS[outcome]}`);
    }

    return NextResponse.json({ ...updated, candidate });
  } catch (err) {
    return handleApiError(err);
  }
}
