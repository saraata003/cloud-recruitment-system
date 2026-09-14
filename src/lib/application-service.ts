import { eq } from "drizzle-orm";
import { db } from "@/db";
import { candidates, statusHistory } from "@/db/schema";
import type { Candidate } from "@/db/schema";
import { generateCvSummary } from "./ai";
import { extractCvText } from "./cv-parse";
import { normalizePhone, safeJsonParse } from "./utils";
import { saveCv, savePhoto } from "./uploads";
import type { ApplicationFields } from "./validation";

export interface PreviousSnapshot {
  submittedAt: string;
  fullName: string;
  position: string;
  otherPositionText: string | null;
  preferredBranch: string;
  employmentType: string;
  location: string;
  lastJob: string | null;
  yearsOfExperience: number | null;
  availableFrom: string | null;
  previousExperience: string | null;
  cvUrl: string | null;
  cvFileName: string | null;
  photoUrl: string | null;
}

export interface SubmitApplicationResult {
  candidate: Candidate;
  isDuplicate: boolean;
}

function snapshotOf(c: Candidate): PreviousSnapshot {
  return {
    submittedAt: c.updatedAt,
    fullName: c.fullName,
    position: c.position,
    otherPositionText: c.otherPositionText,
    preferredBranch: c.preferredBranch,
    employmentType: c.employmentType,
    location: c.location,
    lastJob: c.lastJob,
    yearsOfExperience: c.yearsOfExperience,
    availableFrom: c.availableFrom,
    previousExperience: c.previousExperience,
    cvUrl: c.cvUrl,
    cvFileName: c.cvFileName,
    photoUrl: c.photoUrl,
  };
}

/**
 * Handles a public application submission. If the phone number (normalized)
 * matches an existing candidate, the SAME row is updated in place — rather
 * than creating a second person — so all past interviews/notes/status
 * history stay attached and visible. The pre-update field values are pushed
 * onto `previousSnapshots` so the recruiter can still see what changed.
 */
export async function submitApplication(
  fields: ApplicationFields,
  photo: File | null,
  cv: File | null
): Promise<SubmitApplicationResult> {
  const phoneNormalized = normalizePhone(fields.phone);

  const [photoResult, cvResult, existing] = await Promise.all([
    photo ? savePhoto(photo) : Promise.resolve(null),
    cv ? saveCv(cv) : Promise.resolve(null),
    db.query.candidates.findFirst({ where: eq(candidates.phoneNormalized, phoneNormalized) }),
  ]);

  const photoUrl = photoResult?.url ?? existing?.photoUrl ?? null;
  const cvUrl = cvResult?.url ?? existing?.cvUrl ?? null;
  const cvFileName = cvResult?.fileName ?? existing?.cvFileName ?? null;

  const cvText = await extractCvText(cvUrl);

  const aiInput = {
    fullName: fields.fullName,
    position: fields.position,
    otherPositionText: fields.otherPositionText ?? null,
    preferredBranch: fields.preferredBranch,
    employmentType: fields.employmentType,
    age: fields.age ?? null,
    dateOfBirth: fields.dateOfBirth ?? null,
    location: fields.location,
    university: fields.university ?? null,
    major: fields.major ?? null,
    yearsOfExperience: fields.yearsOfExperience ?? null,
    lastJob: fields.lastJob ?? null,
    previousExperience: fields.previousExperience ?? null,
    availableFrom: fields.availableFrom ?? null,
    hasTransportation: fields.hasTransportation ?? false,
    applicantNotes: fields.applicantNotes ?? null,
  };

  const ai = await generateCvSummary(aiInput, cvText);
  const now = new Date().toISOString();

  const sharedFields = {
    fullName: fields.fullName,
    phone: fields.phone,
    phoneNormalized,
    location: fields.location,
    dateOfBirth: fields.dateOfBirth ?? null,
    age: fields.age ?? null,
    position: fields.position,
    otherPositionText: fields.otherPositionText ?? null,
    preferredBranch: fields.preferredBranch,
    employmentType: fields.employmentType,
    university: fields.university ?? null,
    major: fields.major ?? null,
    previousExperience: fields.previousExperience ?? null,
    lastJob: fields.lastJob ?? null,
    yearsOfExperience: fields.yearsOfExperience ?? null,
    availableFrom: fields.availableFrom ?? null,
    hasTransportation: fields.hasTransportation ?? false,
    applicantNotes: fields.applicantNotes ?? null,
    photoUrl,
    cvUrl,
    cvFileName,
    aiSummary: ai.summary,
    aiKeyPoints: JSON.stringify(ai.keyPoints),
    aiGeneratedAt: now,
    aiProvider: ai.provider,
    updatedAt: now,
  };

  if (existing) {
    const prevSnapshots = safeJsonParse<PreviousSnapshot[]>(existing.previousSnapshots, []);
    prevSnapshots.push(snapshotOf(existing));

    const [updated] = await db
      .update(candidates)
      .set({
        ...sharedFields,
        stage: "NEW",
        isDuplicate: true,
        duplicateAlertSeen: false,
        reapplicationCount: existing.reapplicationCount + 1,
        previousSnapshots: JSON.stringify(prevSnapshots),
      })
      .where(eq(candidates.id, existing.id))
      .returning();

    await db.insert(statusHistory).values({
      candidateId: existing.id,
      fromStage: existing.stage,
      toStage: "NEW",
      note: `Re-applied via public form (submission #${existing.reapplicationCount + 2})`,
    });

    return { candidate: updated, isDuplicate: true };
  }

  const [created] = await db
    .insert(candidates)
    .values({
      ...sharedFields,
      stage: "NEW",
      isDuplicate: false,
      duplicateAlertSeen: true,
      reapplicationCount: 0,
      previousSnapshots: null,
      source: "PUBLIC_FORM",
      createdAt: now,
    })
    .returning();

  await db.insert(statusHistory).values({
    candidateId: created.id,
    fromStage: null,
    toStage: "NEW",
    note: "Applied via public form",
  });

  return { candidate: created, isDuplicate: false };
}
