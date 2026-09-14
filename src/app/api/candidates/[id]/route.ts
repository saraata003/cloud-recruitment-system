import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { getCandidateProfile } from "@/lib/candidates-repo";
import { normalizePhone } from "@/lib/utils";
import { updateCandidateSchema } from "@/lib/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const profile = await getCandidateProfile(id);
    if (!profile) return jsonError("Candidate not found", 404);
    return NextResponse.json(profile);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await db.query.candidates.findFirst({ where: eq(candidates.id, id) });
    if (!existing) return jsonError("Candidate not found", 404);

    const body = await request.json();
    const data = updateCandidateSchema.parse(body);

    const updatePayload: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() };
    if (data.phone) updatePayload.phoneNormalized = normalizePhone(data.phone);

    const [updated] = await db.update(candidates).set(updatePayload).where(eq(candidates.id, id)).returning();
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
