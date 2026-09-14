import Anthropic from "@anthropic-ai/sdk";
import type { Candidate, Interview } from "@/db/schema";
import {
  BRANCH_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  INTERVIEW_OUTCOME_LABELS,
  POSITION_LABELS,
  RATING_CATEGORIES,
  type Branch,
  type EmploymentType,
  type InterviewOutcome,
  type Position,
} from "./constants";
import { formatYearsOfExperience, getDisplayAge } from "./utils";

const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const client = apiKey ? new Anthropic({ apiKey }) : null;

export type AiProvider = "claude" | "heuristic";

export interface CvSummaryResult {
  summary: string;
  keyPoints: string[];
  provider: AiProvider;
}

export interface InterviewQuestionsResult {
  questions: { category: string; question: string }[];
  provider: AiProvider;
}

export interface InterviewSummaryResult {
  summary: string;
  provider: AiProvider;
}

/**
 * Minimal candidate shape the AI helpers need. A narrower type (rather than
 * the full `Candidate` row) so the application-service can call these before
 * a row exists yet — e.g. to generate the very first AI summary as part of
 * creating the candidate.
 */
export type CandidateAiInput = Pick<
  Candidate,
  | "fullName"
  | "position"
  | "otherPositionText"
  | "preferredBranch"
  | "employmentType"
  | "age"
  | "dateOfBirth"
  | "location"
  | "university"
  | "major"
  | "yearsOfExperience"
  | "lastJob"
  | "previousExperience"
  | "availableFrom"
  | "hasTransportation"
  | "applicantNotes"
>;

// ---------------------------------------------------------------------------
// Shared candidate context builder — used both for the Claude prompt and as
// the basis for the heuristic fallback, so the two never disagree on facts.
// ---------------------------------------------------------------------------
function positionLabel(c: Pick<CandidateAiInput, "position" | "otherPositionText">) {
  return c.position === "OTHER" && c.otherPositionText ? c.otherPositionText : POSITION_LABELS[c.position as Position];
}

function branchLabel(c: Pick<CandidateAiInput, "preferredBranch">) {
  return BRANCH_LABELS[c.preferredBranch as Branch] ?? c.preferredBranch;
}

function employmentLabel(c: Pick<CandidateAiInput, "employmentType">) {
  return EMPLOYMENT_TYPE_LABELS[c.employmentType as EmploymentType] ?? c.employmentType;
}

function buildCandidateContext(candidate: CandidateAiInput, cvText?: string | null): string {
  const age = getDisplayAge(candidate);
  const lines = [
    `Full name: ${candidate.fullName}`,
    `Applying for: ${positionLabel(candidate)}`,
    `Preferred branch: ${branchLabel(candidate)}`,
    `Employment type: ${employmentLabel(candidate)}`,
    age ? `Age: ${age}` : null,
    `Lives in: ${candidate.location}`,
    candidate.university ? `University: ${candidate.university}` : null,
    candidate.major ? `Major: ${candidate.major}` : null,
    `Years of experience: ${formatYearsOfExperience(candidate.yearsOfExperience)}`,
    candidate.lastJob ? `Last job: ${candidate.lastJob}` : null,
    candidate.previousExperience ? `Experience details (from applicant): ${candidate.previousExperience}` : null,
    candidate.availableFrom ? `Can start: ${candidate.availableFrom}` : "Availability: not specified",
    `Has own transportation: ${candidate.hasTransportation ? "Yes" : "No"}`,
    candidate.applicantNotes ? `Applicant notes: ${candidate.applicantNotes}` : null,
    cvText ? `\nExtracted CV text:\n${cvText}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

async function callClaudeJson<T>(opts: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
}): Promise<T | null> {
  if (!client) return null;
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 1400,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
      output_config: {
        format: { type: "json_schema", schema: opts.schema },
      },
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;
    return JSON.parse(textBlock.text) as T;
  } catch (err) {
    console.error("Claude call failed, falling back to heuristic:", err);
    return null;
  }
}

const NO_JUDGMENT_RULE =
  "Never comment on physical appearance or a photo. Never state a final hire/reject decision — you only assist a " +
  "human recruiter, who makes the final call. Only use facts given to you; never invent details that weren't provided.";

// ---------------------------------------------------------------------------
// 1. CV Summary
// ---------------------------------------------------------------------------
const CV_SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "One or two plain-English sentences a busy hiring manager can read in five seconds.",
    },
    keyPoints: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 6,
      description: "Short, specific bullet points the recruiter should notice before interviewing this person.",
    },
  },
  required: ["summary", "keyPoints"],
  additionalProperties: false,
};

export async function generateCvSummary(candidate: CandidateAiInput, cvText?: string | null): Promise<CvSummaryResult> {
  const context = buildCandidateContext(candidate, cvText);
  const claudeResult = await callClaudeJson<{ summary: string; keyPoints: string[] }>({
    system:
      `You are a recruiting assistant for DRINKAT, a coffee & F&B brand hiring for Barista, Kitchen, Cashier and ` +
      `Supervisor roles. Summarize this candidate's application for a manager who is about to review dozens of ` +
      `applicants. ${NO_JUDGMENT_RULE}`,
    user: `Candidate application:\n${context}`,
    schema: CV_SUMMARY_SCHEMA,
  });

  if (claudeResult) {
    return { ...claudeResult, provider: "claude" };
  }
  return { ...heuristicCvSummary(candidate), provider: "heuristic" };
}

export function heuristicCvSummary(candidate: CandidateAiInput): Omit<CvSummaryResult, "provider"> {
  const years = candidate.yearsOfExperience;
  const role = positionLabel(candidate);

  const sentenceParts: string[] = [];
  if (years !== null && years !== undefined) {
    sentenceParts.push(
      years > 0
        ? `Has ${formatYearsOfExperience(years)} of ${role} experience${candidate.lastJob ? `, most recently at ${candidate.lastJob}` : ""}`
        : `Has no prior ${role} experience listed`
    );
  } else {
    sentenceParts.push(`Applying for ${role}, experience not specified`);
  }
  sentenceParts.push(`lives in ${candidate.location}`);
  if (candidate.availableFrom) {
    sentenceParts.push(
      /immediat|now|asap/i.test(candidate.availableFrom)
        ? "available to start immediately"
        : `available from ${candidate.availableFrom}`
    );
  }
  const summary =
    sentenceParts.join(", ").replace(/^./, (c) => c.toUpperCase()) +
    `. Looking for ${employmentLabel(candidate)} work, prefers the ${branchLabel(candidate)} branch.`;

  const keyPoints: string[] = [];
  if (years !== null && years !== undefined) {
    keyPoints.push(
      years >= 1
        ? `Strong ${role.toLowerCase()} experience (${formatYearsOfExperience(years)})`
        : "No prior experience — will need training"
    );
  } else {
    keyPoints.push("Experience not specified — confirm in interview");
  }
  if (candidate.employmentType === "STUDENT") {
    keyPoints.push(`Student${candidate.university ? ` at ${candidate.university}` : ""} — confirm class schedule vs. shifts`);
  }
  if (candidate.employmentType === "FREELANCE") {
    keyPoints.push("Looking for freelance / flexible hours");
  }
  if (!candidate.hasTransportation) {
    keyPoints.push("No personal transportation — confirm commute plan");
  }
  if (!candidate.availableFrom) {
    keyPoints.push("Availability needs confirmation");
  }
  if (candidate.lastJob) {
    keyPoints.push(`Previously worked at ${candidate.lastJob}`);
  }
  keyPoints.push(`Prefers ${branchLabel(candidate)} branch`);

  return { summary, keyPoints: keyPoints.slice(0, 6) };
}

// ---------------------------------------------------------------------------
// 2. AI Interview Questions
// ---------------------------------------------------------------------------
const INTERVIEW_QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      minItems: 5,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          category: { type: "string", description: "Short label, e.g. Experience, Availability, Location, Role Skills" },
          question: { type: "string" },
        },
        required: ["category", "question"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

export async function generateInterviewQuestions(
  candidate: CandidateAiInput,
  cvText?: string | null
): Promise<InterviewQuestionsResult> {
  const context = buildCandidateContext(candidate, cvText);
  const claudeResult = await callClaudeJson<{ questions: { category: string; question: string }[] }>({
    system:
      `You write interview questions for a DRINKAT hiring manager, tailored specifically to the candidate below — ` +
      `not generic questions. Reference their actual stated experience, last job, studies, location/transportation, ` +
      `and availability where relevant. ${NO_JUDGMENT_RULE}`,
    user: `Candidate application:\n${context}\n\nWrite 5-8 tailored interview questions.`,
    schema: INTERVIEW_QUESTIONS_SCHEMA,
  });

  if (claudeResult) {
    return { ...claudeResult, provider: "claude" };
  }
  return { questions: heuristicInterviewQuestions(candidate), provider: "heuristic" };
}

export function heuristicInterviewQuestions(candidate: CandidateAiInput): { category: string; question: string }[] {
  const questions: { category: string; question: string }[] = [];
  const branch = branchLabel(candidate);

  if (candidate.lastJob) {
    questions.push({
      category: "Experience",
      question: `You worked at ${candidate.lastJob} before — what did you do there day-to-day, and why did you leave?`,
    });
  } else {
    questions.push({ category: "Experience", question: "Tell me about your work experience so far." });
  }

  switch (candidate.position as Position) {
    case "BARISTA":
      questions.push(
        { category: "Role Skills", question: "What espresso machines or coffee equipment have you used before?" },
        { category: "Role Skills", question: "How would you handle a sudden rush of orders during peak hours?" }
      );
      break;
    case "KITCHEN":
      questions.push(
        { category: "Role Skills", question: "Which kitchen stations have you worked on before (grill, prep, etc.)?" },
        { category: "Role Skills", question: "How do you keep up with food safety and hygiene during a busy shift?" }
      );
      break;
    case "CASHIER":
      questions.push(
        { category: "Role Skills", question: "Have you used a POS system before? Which one?" },
        { category: "Role Skills", question: "How would you handle a customer disputing their bill?" }
      );
      break;
    case "SUPERVISOR":
      questions.push(
        { category: "Leadership", question: "Tell me about a time you had to manage or coach a team member." },
        { category: "Leadership", question: "How would you resolve a scheduling conflict between two staff members?" }
      );
      break;
    default:
      questions.push({
        category: "Role Fit",
        question: `You applied for "${candidate.otherPositionText || "this role"}" — what interests you about it?`,
      });
  }

  if (candidate.employmentType === "STUDENT") {
    questions.push(
      { category: "Availability", question: "What's your class schedule like, and which days/shifts work best for you?" },
      { category: "Availability", question: "Would you be able to work closing shifts when needed?" }
    );
  } else if (candidate.employmentType === "FREELANCE") {
    questions.push({
      category: "Availability",
      question: "How many hours a week are you looking for, and how flexible is your schedule?",
    });
  } else {
    questions.push({
      category: "Availability",
      question: "Are you comfortable with a full-time shift schedule, including weekends?",
    });
  }

  questions.push({
    category: "Location",
    question: candidate.hasTransportation
      ? `You mentioned you have transportation — how far is the ${branch} branch from where you live?`
      : `How would you plan to get to the ${branch} branch for your shifts?`,
  });

  if (candidate.availableFrom) {
    questions.push({
      category: "Availability",
      question: `You mentioned you can start "${candidate.availableFrom}" — does that still work?`,
    });
  }

  return questions.slice(0, 8);
}

// ---------------------------------------------------------------------------
// 3. Post-interview summary
// ---------------------------------------------------------------------------
const INTERVIEW_SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "2-4 sentence summary of how the interview went, based only on the interviewer's notes and ratings.",
    },
  },
  required: ["summary"],
  additionalProperties: false,
};

export async function generateInterviewSummary(candidate: Candidate, interview: Interview): Promise<InterviewSummaryResult> {
  const ratingsText = RATING_CATEGORIES.map(
    (r) => `${r.label}: ${(interview as unknown as Record<string, number | null>)[r.key] ?? "not rated"}/5`
  ).join(", ");

  const claudeResult = await callClaudeJson<{ summary: string }>({
    system:
      `You summarize a just-completed job interview for DRINKAT's hiring records, based only on the interviewer's ` +
      `raw notes and ratings below. ${NO_JUDGMENT_RULE}`,
    user:
      `Candidate: ${candidate.fullName}, applying for ${positionLabel(candidate)}.\n` +
      `Ratings (out of 5): ${ratingsText}\n` +
      `Interviewer notes: ${interview.notes || "(none written)"}\n` +
      (interview.outcome ? `Recruiter's decision: ${INTERVIEW_OUTCOME_LABELS[interview.outcome as InterviewOutcome]}\n` : ""),
    schema: INTERVIEW_SUMMARY_SCHEMA,
  });

  if (claudeResult) {
    return { ...claudeResult, provider: "claude" };
  }
  return { summary: heuristicInterviewSummary(candidate, interview), provider: "heuristic" };
}

export function heuristicInterviewSummary(candidate: Candidate, interview: Interview): string {
  const ratingValues = RATING_CATEGORIES.map(
    (r) => (interview as unknown as Record<string, number | null>)[r.key]
  ).filter((v): v is number => typeof v === "number");
  const avg = ratingValues.length ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length : null;

  let summary = `${candidate.fullName} was interviewed for the ${positionLabel(candidate)} role.`;
  if (avg !== null) {
    summary += ` Overall rating averaged ${avg.toFixed(1)}/5 across communication, experience, availability, attitude and location.`;
  }
  if (interview.notes) {
    const trimmed = interview.notes.length > 220 ? `${interview.notes.slice(0, 220)}…` : interview.notes;
    summary += ` Interviewer notes: ${trimmed}`;
  }
  if (interview.outcome) {
    summary += ` Recommended outcome: ${INTERVIEW_OUTCOME_LABELS[interview.outcome as InterviewOutcome]}.`;
  }
  return summary;
}

export const aiIsConfigured = Boolean(client);
