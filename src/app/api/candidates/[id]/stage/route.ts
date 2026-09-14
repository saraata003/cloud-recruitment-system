import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { addStatusHistory } from "@/lib/candidates-repo";
import { stageChangeSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await db.query.candidates.findFirst({ where: eq(candidates.id, id) });
    if (!existing) return jsonError("Candidate not found", 404);

    const body = await request.json();
    const { stage, note } = stageChangeSchema.parse(body);

    const updatePayload: Record<string, unknown> = { stage, updatedAt: new Date().toISOString() };
    if (stage === "HIRED" && !existing.hiredAt) {
      updatePayload.hiredAt = new Date().toISOString();
    }

    const [updated] = await db.update(candidates).set(updatePayload).where(eq(candidates.id, id)).returning();
    await addStatusHistory(id, existing.stage, stage, note);

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
