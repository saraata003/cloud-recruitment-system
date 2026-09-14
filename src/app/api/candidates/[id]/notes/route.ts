import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, notes } from "@/db/schema";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { noteCreateSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await db.query.candidates.findFirst({ where: eq(candidates.id, id) });
    if (!existing) return jsonError("Candidate not found", 404);

    const body = await request.json();
    const { body: text } = noteCreateSchema.parse(body);

    const [created] = await db.insert(notes).values({ candidateId: id, body: text }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
