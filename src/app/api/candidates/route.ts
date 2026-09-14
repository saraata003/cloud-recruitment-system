import { and, desc, eq, gt, isNull, like, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidateTags, candidates, tags } from "@/db/schema";
import { handleApiError } from "@/lib/api-helpers";
import { candidateSearchSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = candidateSearchSchema.parse(Object.fromEntries(searchParams));

    const conditions = [];
    if (parsed.stage) conditions.push(eq(candidates.stage, parsed.stage));
    if (parsed.position) conditions.push(eq(candidates.position, parsed.position));
    if (parsed.branch) conditions.push(eq(candidates.preferredBranch, parsed.branch));
    if (parsed.employmentType) conditions.push(eq(candidates.employmentType, parsed.employmentType));
    if (parsed.experience === "EXPERIENCED") conditions.push(gt(candidates.yearsOfExperience, 0));
    if (parsed.experience === "NO_EXPERIENCE") {
      conditions.push(or(isNull(candidates.yearsOfExperience), eq(candidates.yearsOfExperience, 0)));
    }
    if (parsed.q) {
      const term = `%${parsed.q.toLowerCase()}%`;
      conditions.push(
        or(like(sql`lower(${candidates.fullName})`, term), like(candidates.phone, `%${parsed.q}%`))
      );
    }

    let rows = await db
      .select()
      .from(candidates)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(candidates.createdAt));

    if (parsed.tag) {
      const tagLinks = await db
        .select({ candidateId: candidateTags.candidateId })
        .from(candidateTags)
        .innerJoin(tags, eq(candidateTags.tagId, tags.id))
        .where(eq(tags.name, parsed.tag));
      const idSet = new Set(tagLinks.map((r) => r.candidateId));
      rows = rows.filter((r) => idSet.has(r.id));
    }

    const allTagLinks = await db
      .select({ candidateId: candidateTags.candidateId, id: tags.id, name: tags.name })
      .from(candidateTags)
      .innerJoin(tags, eq(candidateTags.tagId, tags.id));

    const tagsByCandidate = new Map<string, { id: string; name: string }[]>();
    for (const link of allTagLinks) {
      const arr = tagsByCandidate.get(link.candidateId) ?? [];
      arr.push({ id: link.id, name: link.name });
      tagsByCandidate.set(link.candidateId, arr);
    }

    const result = rows.map((r) => ({ ...r, tags: tagsByCandidate.get(r.id) ?? [] }));

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
