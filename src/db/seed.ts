/**
 * Seeds the local database with realistic sample candidates spanning every
 * pipeline stage, so the UI can be explored immediately. AI summaries /
 * questions are generated with the same heuristic engine the app falls back
 * to when no ANTHROPIC_API_KEY is set — deterministic, free, and fast, and
 * automatically consistent with real runtime behaviour. Photos are left
 * blank on purpose: the app already renders a colored initials avatar for
 * any candidate without a photo, which *is* the placeholder.
 */
import { eq } from "drizzle-orm";
import { db } from "./index";
import { candidateTags, candidates, interviews, notes, statusHistory, tags } from "./schema";
import { heuristicCvSummary, heuristicInterviewQuestions, heuristicInterviewSummary } from "../lib/ai";
import { normalizePhone } from "../lib/utils";
import { INTERVIEW_OUTCOME_LABELS, type Branch, type EmploymentType, type InterviewOutcome, type Position, type Stage } from "../lib/constants";
import type { Interview, NewCandidate } from "./schema";

function daysAgo(n: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysFromNow(n: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function todayAt(hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function dobForAge(age: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age, 5, 15);
  return d.toISOString().slice(0, 10);
}

interface Ratings {
  ratingCommunication: number;
  ratingExperience: number;
  ratingAvailability: number;
  ratingAttitude: number;
  ratingLocation: number;
}

interface SeedCandidate {
  fullName: string;
  phone: string;
  location: string;
  age?: number;
  useDob?: boolean;
  position: Position;
  otherPositionText?: string;
  preferredBranch: Branch;
  employmentType: EmploymentType;
  university?: string;
  major?: string;
  lastJob?: string;
  previousExperience?: string;
  yearsOfExperience?: number;
  availableFrom?: string;
  hasTransportation: boolean;
  applicantNotes?: string;
  stage: Stage;
  createdDaysAgo: number;
  tags?: string[];
  internalNote?: string;
  hiredDaysAgo?: number;
  duplicate?: { firstAppliedDaysAgo: number; oldPosition: Position; oldBranch: Branch; oldLastJob?: string };
  interview?: {
    schedule:
      | { kind: "today"; hour: number; minute?: number }
      | { kind: "future"; days: number; hour: number }
      | { kind: "past"; daysAgo: number; hour: number };
    completed?: { ratings: Ratings; notes: string; outcome: InterviewOutcome };
  };
}

const SEED: SeedCandidate[] = [
  // ---------------------------------------------------------------- NEW ---
  {
    fullName: "Sara Al-Amin",
    phone: "0791234501",
    location: "Marka, Amman",
    age: 21,
    position: "BARISTA",
    preferredBranch: "HASHEMITE",
    employmentType: "STUDENT",
    university: "Hashemite University",
    major: "Business Administration",
    lastJob: "Rumi Cafe",
    previousExperience: "Worked weekends as a barista, mainly milk-based drinks and basic latte art.",
    yearsOfExperience: 1,
    availableFrom: "Immediately",
    hasTransportation: true,
    stage: "NEW",
    createdDaysAgo: 0,
  },
  {
    fullName: "Omar Haddad",
    phone: "0781234502",
    location: "Zarqa",
    age: 26,
    position: "KITCHEN",
    preferredBranch: "CLOUD_KITCHEN",
    employmentType: "FULL_TIME",
    lastJob: "Reem Restaurant",
    previousExperience: "Line cook, mostly grill and prep station, fast-paced kitchen.",
    yearsOfExperience: 3,
    availableFrom: "Within a week",
    hasTransportation: false,
    stage: "NEW",
    createdDaysAgo: 0,
  },
  {
    fullName: "Lina Qasem",
    phone: "0771234503",
    location: "Sweileh, Amman",
    age: 19,
    position: "CASHIER",
    preferredBranch: "LUMINUS",
    employmentType: "STUDENT",
    university: "Luminus Technical University College",
    major: "Marketing",
    yearsOfExperience: 0,
    availableFrom: "Weekends only for now",
    hasTransportation: true,
    stage: "NEW",
    createdDaysAgo: 1,
  },
  {
    fullName: "Yousef Nasser",
    phone: "0791234504",
    location: "Tla al-Ali, Amman",
    age: 23,
    position: "BARISTA",
    preferredBranch: "MIDDLE_EAST_UNIVERSITY",
    employmentType: "FREELANCE",
    yearsOfExperience: 0.5,
    lastJob: "Cafe Aroma (part-time)",
    availableFrom: "Immediately",
    hasTransportation: true,
    stage: "NEW",
    createdDaysAgo: 1,
  },
  {
    fullName: "Rana Khalil",
    phone: "0781234505",
    location: "Abdoun, Amman",
    age: 29,
    position: "SUPERVISOR",
    preferredBranch: "ANY_BRANCH",
    employmentType: "FULL_TIME",
    lastJob: "Second Cup — Shift Supervisor",
    previousExperience: "5 years in specialty coffee, 2 as shift supervisor managing a team of 6.",
    yearsOfExperience: 5,
    availableFrom: "2 weeks notice",
    hasTransportation: true,
    stage: "NEW",
    createdDaysAgo: 2,
  },
  {
    fullName: "Ahmad Zoubi",
    phone: "0791234506",
    location: "Zarqa",
    age: 24,
    position: "OTHER",
    otherPositionText: "Delivery Rider",
    preferredBranch: "CLOUD_KITCHEN",
    employmentType: "FULL_TIME",
    lastJob: "Talabat",
    previousExperience: "2 years delivering for food apps, owns a motorcycle.",
    yearsOfExperience: 2,
    availableFrom: "Immediately",
    hasTransportation: true,
    stage: "NEW",
    createdDaysAgo: 2,
    duplicate: { firstAppliedDaysAgo: 20, oldPosition: "OTHER", oldBranch: "CLOUD_KITCHEN", oldLastJob: "Careem" },
  },

  // ---------------------------------------------------------- REVIEWING ---
  {
    fullName: "Dana Saleh",
    phone: "0781234507",
    location: "Zarqa",
    age: 20,
    position: "KITCHEN",
    preferredBranch: "HASHEMITE",
    employmentType: "STUDENT",
    university: "Hashemite University",
    major: "Nutrition and Food Technology",
    lastJob: "University cafeteria kitchen helper",
    yearsOfExperience: 1,
    availableFrom: "Immediately",
    hasTransportation: false,
    stage: "REVIEWING",
    createdDaysAgo: 3,
  },
  {
    fullName: "Khaled Obeidat",
    phone: "0771234508",
    location: "Jubeiha, Amman",
    age: 22,
    position: "CASHIER",
    preferredBranch: "LUMINUS",
    employmentType: "FULL_TIME",
    lastJob: "Cozmo Supermarket",
    yearsOfExperience: 1.5,
    availableFrom: "Immediately",
    hasTransportation: true,
    stage: "REVIEWING",
    createdDaysAgo: 4,
  },
  {
    fullName: "Nour Hijazi",
    phone: "0791234509",
    location: "Marka, Amman — 5 minutes from Hashemite University",
    age: 21,
    position: "BARISTA",
    preferredBranch: "HASHEMITE",
    employmentType: "STUDENT",
    university: "Hashemite University",
    major: "English Literature",
    lastJob: "Coffee Lab",
    previousExperience: "Two years of barista experience across two coffee shops (Coffee Lab and Brew House), comfortable with manual and automatic espresso machines.",
    yearsOfExperience: 2,
    availableFrom: "Immediately",
    hasTransportation: true,
    stage: "REVIEWING",
    createdDaysAgo: 6,
    duplicate: { firstAppliedDaysAgo: 15, oldPosition: "BARISTA", oldBranch: "HASHEMITE", oldLastJob: "Brew House" },
    internalNote: "Really strong fit on paper — lives right next to the branch and already has 2 years of coffee experience.",
  },

  // ----------------------------------------------------------- INTERVIEW ---
  {
    fullName: "Farah Btoush",
    phone: "0781234510",
    location: "Khalda, Amman",
    age: 24,
    position: "BARISTA",
    preferredBranch: "HASHEMITE",
    employmentType: "FULL_TIME",
    lastJob: "Costa Coffee",
    previousExperience: "2 years as a barista, comfortable with high order volume.",
    yearsOfExperience: 2,
    availableFrom: "Immediately",
    hasTransportation: true,
    stage: "INTERVIEW",
    createdDaysAgo: 4,
    interview: { schedule: { kind: "today", hour: 14, minute: 0 } },
  },
  {
    fullName: "Tariq Majali",
    phone: "0771234511",
    location: "Marka, Amman",
    age: 27,
    position: "KITCHEN",
    preferredBranch: "CLOUD_KITCHEN",
    employmentType: "FULL_TIME",
    lastJob: "Zaytouna Restaurant",
    previousExperience: "4 years across grill and prep, ran his own small station during peak hours.",
    yearsOfExperience: 4,
    availableFrom: "Immediately",
    hasTransportation: true,
    stage: "INTERVIEW",
    createdDaysAgo: 5,
    interview: { schedule: { kind: "today", hour: 16, minute: 30 } },
  },
  {
    fullName: "Hala Sarayrah",
    phone: "0791234512",
    location: "Shmeisani, Amman",
    age: 20,
    position: "CASHIER",
    preferredBranch: "MIDDLE_EAST_UNIVERSITY",
    employmentType: "STUDENT",
    university: "Middle East University",
    major: "Accounting",
    yearsOfExperience: 0,
    availableFrom: "After 3pm on weekdays",
    hasTransportation: false,
    stage: "INTERVIEW",
    createdDaysAgo: 3,
    interview: { schedule: { kind: "future", days: 1, hour: 11 } },
  },

  // --------------------------------------------------------- SHORTLISTED ---
  {
    fullName: "Zaid Kilani",
    phone: "0781234513",
    location: "Abdoun, Amman",
    age: 30,
    position: "SUPERVISOR",
    preferredBranch: "ANY_BRANCH",
    employmentType: "FULL_TIME",
    lastJob: "Starbucks — Shift Supervisor",
    previousExperience: "6 years total, 3 as supervisor. Trained new baristas and handled scheduling.",
    yearsOfExperience: 6,
    availableFrom: "2 weeks notice",
    hasTransportation: true,
    stage: "SHORTLISTED",
    createdDaysAgo: 8,
    interview: {
      schedule: { kind: "past", daysAgo: 2, hour: 13 },
      completed: {
        ratings: { ratingCommunication: 5, ratingExperience: 5, ratingAvailability: 4, ratingAttitude: 5, ratingLocation: 4 },
        notes: "Very strong leadership experience, great communication, confident answering scheduling/conflict questions. Needs 2 weeks notice from current job.",
        outcome: "SHORTLIST",
      },
    },
  },
  {
    fullName: "Reem Dabbas",
    phone: "0771234514",
    location: "Jubeiha, Amman",
    age: 22,
    position: "BARISTA",
    preferredBranch: "LUMINUS",
    employmentType: "STUDENT",
    university: "Luminus Technical University College",
    major: "Hospitality Management",
    lastJob: "Caribou Coffee",
    yearsOfExperience: 1.5,
    availableFrom: "Immediately",
    hasTransportation: true,
    stage: "SHORTLISTED",
    createdDaysAgo: 9,
    interview: {
      schedule: { kind: "past", daysAgo: 3, hour: 15 },
      completed: {
        ratings: { ratingCommunication: 4, ratingExperience: 4, ratingAvailability: 4, ratingAttitude: 5, ratingLocation: 5 },
        notes: "Friendly, studies hospitality so already understands service standards. Class schedule fits our shifts well.",
        outcome: "SHORTLIST",
      },
    },
  },

  // -------------------------------------------------------- FUTURE TALENT ---
  {
    fullName: "Mahmoud Qudah",
    phone: "0791234515",
    location: "Marka, Amman",
    age: 25,
    position: "BARISTA",
    preferredBranch: "HASHEMITE",
    employmentType: "FULL_TIME",
    lastJob: "Coffee Republic",
    previousExperience: "3 years, very strong latte art portfolio.",
    yearsOfExperience: 3,
    availableFrom: "Immediately",
    hasTransportation: true,
    stage: "FUTURE_TALENT",
    createdDaysAgo: 12,
    tags: ["Barista", "Experienced", "Full Time"],
    internalNote: "No open Barista seat at Hashemite right now — great candidate, revisit first opening.",
  },
  {
    fullName: "Lara Shishani",
    phone: "0781234516",
    location: "Sweileh, Amman",
    age: 20,
    position: "KITCHEN",
    preferredBranch: "LUMINUS",
    employmentType: "STUDENT",
    university: "Luminus Technical University College",
    major: "Culinary Arts",
    yearsOfExperience: 0.5,
    availableFrom: "Immediately",
    hasTransportation: true,
    stage: "FUTURE_TALENT",
    createdDaysAgo: 14,
    tags: ["Kitchen", "Student", "Luminus", "Fast Learner"],
  },
  {
    fullName: "Bilal Hourani",
    phone: "0771234517",
    location: "Zarqa",
    age: 28,
    position: "CASHIER",
    preferredBranch: "CLOUD_KITCHEN",
    employmentType: "FULL_TIME",
    lastJob: "Carrefour",
    yearsOfExperience: 4,
    availableFrom: "1 month notice",
    hasTransportation: true,
    stage: "FUTURE_TALENT",
    createdDaysAgo: 16,
    tags: ["Cashier", "Experienced", "Cloud Kitchen"],
  },

  // -------------------------------------------------------------- HIRED ---
  {
    fullName: "Noor Abdel Rahman",
    phone: "0791234518",
    location: "Marka, Amman",
    age: 23,
    position: "BARISTA",
    preferredBranch: "HASHEMITE",
    employmentType: "FULL_TIME",
    lastJob: "Wild Jordan Cafe",
    previousExperience: "2.5 years, previously trained junior baristas.",
    yearsOfExperience: 2.5,
    availableFrom: "Immediately",
    hasTransportation: true,
    stage: "HIRED",
    createdDaysAgo: 15,
    hiredDaysAgo: 10,
    interview: {
      schedule: { kind: "past", daysAgo: 11, hour: 10 },
      completed: {
        ratings: { ratingCommunication: 5, ratingExperience: 5, ratingAvailability: 5, ratingAttitude: 5, ratingLocation: 5 },
        notes: "Excellent interview across the board. Offered immediately.",
        outcome: "HIRE",
      },
    },
  },
  {
    fullName: "Yara Sukkar",
    phone: "0781234519",
    location: "Abdoun, Amman",
    age: 31,
    position: "SUPERVISOR",
    preferredBranch: "ANY_BRANCH",
    employmentType: "FULL_TIME",
    lastJob: "Rumi Cafe — Assistant Manager",
    previousExperience: "7 years in F&B management.",
    yearsOfExperience: 7,
    availableFrom: "Immediately",
    hasTransportation: true,
    stage: "HIRED",
    createdDaysAgo: 9,
    hiredDaysAgo: 5,
    interview: {
      schedule: { kind: "past", daysAgo: 6, hour: 12 },
      completed: {
        ratings: { ratingCommunication: 5, ratingExperience: 5, ratingAvailability: 5, ratingAttitude: 4, ratingLocation: 5 },
        notes: "Very experienced, immediately available, great references.",
        outcome: "HIRE",
      },
    },
  },

  // ------------------------------------------------------------ REJECTED ---
  {
    fullName: "Mohammad Tarawneh",
    phone: "0771234520",
    location: "Russeifa",
    age: 22,
    position: "KITCHEN",
    preferredBranch: "CLOUD_KITCHEN",
    employmentType: "FREELANCE",
    lastJob: "Multiple short-term kitchen jobs",
    previousExperience: "Several kitchen jobs, each lasting under 2 months.",
    yearsOfExperience: 1,
    availableFrom: "Immediately",
    hasTransportation: false,
    stage: "REJECTED",
    createdDaysAgo: 11,
    interview: {
      schedule: { kind: "past", daysAgo: 9, hour: 11 },
      completed: {
        ratings: { ratingCommunication: 2, ratingExperience: 2, ratingAvailability: 3, ratingAttitude: 3, ratingLocation: 2 },
        notes: "Job history very short at each place, couldn't clearly explain why he left. Also no transportation and lives far from Cloud Kitchen.",
        outcome: "REJECT",
      },
    },
  },
  {
    fullName: "Hadeel Fraij",
    phone: "0791234521",
    location: "Irbid",
    age: 19,
    position: "CASHIER",
    preferredBranch: "LUMINUS",
    employmentType: "STUDENT",
    university: "Yarmouk University",
    major: "Law",
    yearsOfExperience: 0,
    availableFrom: "Not specified",
    hasTransportation: false,
    stage: "REJECTED",
    createdDaysAgo: 13,
    internalNote: "Lives in Irbid, over an hour from the Luminus branch — not workable for regular shifts.",
  },
];

async function reset() {
  await db.delete(candidateTags);
  await db.delete(notes);
  await db.delete(statusHistory);
  await db.delete(interviews);
  await db.delete(candidates);
  await db.delete(tags);
}

async function ensureTag(name: string): Promise<string> {
  const existing = await db.query.tags.findFirst({ where: (t, { eq }) => eq(t.name, name) });
  if (existing) return existing.id;
  const [created] = await db.insert(tags).values({ name }).returning();
  return created.id;
}

async function seed() {
  console.log("Resetting database…");
  await reset();

  console.log(`Inserting ${SEED.length} sample candidates…`);

  for (const s of SEED) {
    const createdAt = daysAgo(s.createdDaysAgo, 9, 30);

    const aiInput = {
      fullName: s.fullName,
      position: s.position,
      otherPositionText: s.otherPositionText ?? null,
      preferredBranch: s.preferredBranch,
      employmentType: s.employmentType,
      age: s.age ?? null,
      dateOfBirth: s.useDob && s.age ? dobForAge(s.age) : null,
      location: s.location,
      university: s.university ?? null,
      major: s.major ?? null,
      yearsOfExperience: s.yearsOfExperience ?? null,
      lastJob: s.lastJob ?? null,
      previousExperience: s.previousExperience ?? null,
      availableFrom: s.availableFrom ?? null,
      hasTransportation: s.hasTransportation,
      applicantNotes: s.applicantNotes ?? null,
    };

    const ai = heuristicCvSummary(aiInput);

    let previousSnapshots: string | null = null;
    let reapplicationCount = 0;
    let isDuplicate = false;
    if (s.duplicate) {
      isDuplicate = true;
      reapplicationCount = 1;
      previousSnapshots = JSON.stringify([
        {
          submittedAt: daysAgo(s.duplicate.firstAppliedDaysAgo, 9, 0),
          fullName: s.fullName,
          position: s.duplicate.oldPosition,
          otherPositionText: null,
          preferredBranch: s.duplicate.oldBranch,
          employmentType: s.employmentType,
          location: s.location,
          lastJob: s.duplicate.oldLastJob ?? null,
          yearsOfExperience: (s.yearsOfExperience ?? 1) - 0.5,
          availableFrom: "Immediately",
          previousExperience: null,
          cvUrl: null,
          cvFileName: null,
          photoUrl: null,
        },
      ]);
    }

    const newCandidate: NewCandidate = {
      fullName: s.fullName,
      phone: s.phone,
      phoneNormalized: normalizePhone(s.phone),
      location: s.location,
      dateOfBirth: aiInput.dateOfBirth,
      age: s.age ?? null,
      position: s.position,
      otherPositionText: s.otherPositionText ?? null,
      preferredBranch: s.preferredBranch,
      employmentType: s.employmentType,
      university: s.university ?? null,
      major: s.major ?? null,
      previousExperience: s.previousExperience ?? null,
      lastJob: s.lastJob ?? null,
      yearsOfExperience: s.yearsOfExperience ?? null,
      availableFrom: s.availableFrom ?? null,
      hasTransportation: s.hasTransportation,
      photoUrl: null,
      cvUrl: null,
      cvFileName: null,
      applicantNotes: s.applicantNotes ?? null,
      stage: s.stage,
      aiSummary: ai.summary,
      aiKeyPoints: JSON.stringify(ai.keyPoints),
      aiGeneratedAt: createdAt,
      aiProvider: "heuristic",
      isDuplicate,
      duplicateAlertSeen: !isDuplicate,
      reapplicationCount,
      previousSnapshots,
      source: "PUBLIC_FORM",
      createdAt,
      updatedAt: createdAt,
      hiredAt: s.hiredDaysAgo !== undefined ? daysAgo(s.hiredDaysAgo, 17, 0) : null,
    };

    const [candidate] = await db.insert(candidates).values(newCandidate).returning();

    await db.insert(statusHistory).values({
      candidateId: candidate.id,
      fromStage: null,
      toStage: "NEW",
      note: isDuplicate ? "Re-applied via public form (submission #2)" : "Applied via public form",
      createdAt,
    });

    if (s.stage !== "NEW") {
      await db.insert(statusHistory).values({
        candidateId: candidate.id,
        fromStage: "NEW",
        toStage: "REVIEWING",
        createdAt: daysAgo(Math.max(s.createdDaysAgo - 1, 0), 11, 0),
      });

      if (s.stage !== "REVIEWING") {
        await db.insert(statusHistory).values({
          candidateId: candidate.id,
          fromStage: "REVIEWING",
          toStage: s.stage,
          note: s.interview?.completed ? `Interview outcome: ${INTERVIEW_OUTCOME_LABELS[s.interview.completed.outcome]}` : null,
          createdAt:
            s.hiredDaysAgo !== undefined ? daysAgo(s.hiredDaysAgo, 17, 0) : daysAgo(Math.max(s.createdDaysAgo - 2, 0), 12, 0),
        });
      }
    }

    if (s.internalNote) {
      await db.insert(notes).values({ candidateId: candidate.id, body: s.internalNote, createdAt });
    }

    if (s.tags) {
      for (const tagName of s.tags) {
        const tagId = await ensureTag(tagName);
        await db.insert(candidateTags).values({ candidateId: candidate.id, tagId });
      }
    }

    if (s.interview) {
      let scheduledAt: string | null = null;
      let interviewCreatedAt = createdAt;
      if (s.interview.schedule.kind === "today") {
        scheduledAt = todayAt(s.interview.schedule.hour, s.interview.schedule.minute ?? 0);
      } else if (s.interview.schedule.kind === "future") {
        scheduledAt = daysFromNow(s.interview.schedule.days, s.interview.schedule.hour);
      } else {
        scheduledAt = daysAgo(s.interview.schedule.daysAgo, s.interview.schedule.hour);
        interviewCreatedAt = scheduledAt;
      }

      const questions = heuristicInterviewQuestions(aiInput);

      const interviewRow: Partial<Interview> = {
        candidateId: candidate.id,
        round: 1,
        scheduledAt,
        aiQuestions: JSON.stringify(questions),
        createdAt: interviewCreatedAt,
        updatedAt: interviewCreatedAt,
      };

      if (s.interview.completed) {
        Object.assign(interviewRow, s.interview.completed.ratings, {
          notes: s.interview.completed.notes,
          outcome: s.interview.completed.outcome,
          completedAt: scheduledAt,
        });
      }

      const [insertedInterview] = await db.insert(interviews).values(interviewRow as typeof interviews.$inferInsert).returning();

      if (s.interview.completed) {
        const summary = heuristicInterviewSummary(candidate, insertedInterview);
        await db.update(interviews).set({ aiInterviewSummary: summary }).where(eq(interviews.id, insertedInterview.id));
      }
    }
  }

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
