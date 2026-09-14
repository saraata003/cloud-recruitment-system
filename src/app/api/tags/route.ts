import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidateTags, tags } from "@/db/schema";
import { handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const rows = await db
      .select({ id: tags.id, name: tags.name, count: sql<number>`count(${candidateTags.candidateId})`.as("count") })
      .from(tags)
      .leftJoin(candidateTags, eq(candidateTags.tagId, tags.id))
      .groupBy(tags.id)
      .orderBy(desc(sql`count`));

    return NextResponse.json(rows);
  } catch (err) {
    return handleApiError(err);
  }
}
