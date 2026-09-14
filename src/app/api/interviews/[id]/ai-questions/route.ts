import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, interviews } from "@/db/schema";
import { generateInterviewQuestions } from "@/lib/ai";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { extractCvText } from "@/lib/cv-parse";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const interview = await db.query.interviews.findFirst({ where: eq(interviews.id, id) });
    if (!interview) return jsonError("Interview not found", 404);
    const candidate = await db.query.candidates.findFirst({ where: eq(candidates.id, interview.candidateId) });
    if (!candidate) return jsonError("Candidate not found", 404);

    const cvText = await extractCvText(candidate.cvUrl);
    const result = await generateInterviewQuestions(candidate, cvText);

    const [updated] = await db
      .update(interviews)
      .set({ aiQuestions: JSON.stringify(result.questions), updatedAt: new Date().toISOString() })
      .where(eq(interviews.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
