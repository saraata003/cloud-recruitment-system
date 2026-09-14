import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidateTags, candidates, tags } from "@/db/schema";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { getCandidateTags } from "@/lib/candidates-repo";
import { tagAddSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const candidate = await db.query.candidates.findFirst({ where: eq(candidates.id, id) });
    if (!candidate) return jsonError("Candidate not found", 404);

    const body = await request.json();
    const { name } = tagAddSchema.parse(body);

    let tag = await db.query.tags.findFirst({ where: eq(tags.name, name) });
    if (!tag) {
      [tag] = await db.insert(tags).values({ name }).returning();
    }

    const existingLink = await db.query.candidateTags.findFirst({
      where: and(eq(candidateTags.candidateId, id), eq(candidateTags.tagId, tag.id)),
    });
    if (!existingLink) {
      await db.insert(candidateTags).values({ candidateId: id, tagId: tag.id });
    }

    const allTags = await getCandidateTags(id);
    return NextResponse.json(allTags, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("tagId");
    if (!tagId) return jsonError("tagId is required", 400);

    await db.delete(candidateTags).where(and(eq(candidateTags.candidateId, id), eq(candidateTags.tagId, tagId)));

    const allTags = await getCandidateTags(id);
    return NextResponse.json(allTags);
  } catch (err) {
    return handleApiError(err);
  }
}
