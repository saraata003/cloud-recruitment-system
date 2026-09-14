import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { generateCvSummary } from "@/lib/ai";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { extractCvText } from "@/lib/cv-parse";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const candidate = await db.query.candidates.findFirst({ where: eq(candidates.id, id) });
    if (!candidate) return jsonError("Candidate not found", 404);

    const cvText = await extractCvText(candidate.cvUrl);
    const ai = await generateCvSummary(candidate, cvText);

    const [updated] = await db
      .update(candidates)
      .set({
        aiSummary: ai.summary,
        aiKeyPoints: JSON.stringify(ai.keyPoints),
        aiGeneratedAt: new Date().toISOString(),
        aiProvider: ai.provider,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(candidates.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
