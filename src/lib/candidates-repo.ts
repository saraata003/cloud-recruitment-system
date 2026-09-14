import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { candidateTags, candidates, interviews, notes, statusHistory, tags } from "@/db/schema";
import type { CandidateProfile } from "@/types";

export async function getCandidateProfile(id: string): Promise<CandidateProfile | null> {
  const candidate = await db.query.candidates.findFirst({ where: eq(candidates.id, id) });
  if (!candidate) return null;

  const [tagRows, interviewRows, noteRows, historyRows] = await Promise.all([
    db
      .select({ id: tags.id, name: tags.name })
      .from(candidateTags)
      .innerJoin(tags, eq(candidateTags.tagId, tags.id))
      .where(eq(candidateTags.candidateId, id)),
    db.select().from(interviews).where(eq(interviews.candidateId, id)).orderBy(desc(interviews.createdAt)),
    db.select().from(notes).where(eq(notes.candidateId, id)).orderBy(desc(notes.createdAt)),
    db.select().from(statusHistory).where(eq(statusHistory.candidateId, id)).orderBy(desc(statusHistory.createdAt)),
  ]);

  return {
    ...candidate,
    tags: tagRows,
    interviews: interviewRows,
    notes: noteRows,
    statusHistory: historyRows,
  };
}

export async function getCandidateTags(candidateId: string) {
  return db
    .select({ id: tags.id, name: tags.name })
    .from(candidateTags)
    .innerJoin(tags, eq(candidateTags.tagId, tags.id))
    .where(eq(candidateTags.candidateId, candidateId));
}

export async function addStatusHistory(candidateId: string, fromStage: string | null, toStage: string, note?: string | null) {
  await db.insert(statusHistory).values({ candidateId, fromStage, toStage, note: note ?? null });
}
