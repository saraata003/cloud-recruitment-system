export const POSITIONS = ["BARISTA", "KITCHEN", "CASHIER", "SUPERVISOR", "OTHER"] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_LABELS: Record<Position, string> = {
  BARISTA: "Barista",
  KITCHEN: "Kitchen",
  CASHIER: "Cashier",
  SUPERVISOR: "Supervisor",
  OTHER: "Other",
};

export const BRANCHES = [
  "HASHEMITE",
  "LUMINUS",
  "MIDDLE_EAST_UNIVERSITY",
  "CLOUD_KITCHEN",
  "ANY_BRANCH",
] as const;
export type Branch = (typeof BRANCHES)[number];

export const BRANCH_LABELS: Record<Branch, string> = {
  HASHEMITE: "Hashemite",
  LUMINUS: "Luminus",
  MIDDLE_EAST_UNIVERSITY: "Middle East University",
  CLOUD_KITCHEN: "Cloud Kitchen",
  ANY_BRANCH: "Any Branch",
};

export const EMPLOYMENT_TYPES = ["STUDENT", "FREELANCE", "FULL_TIME"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  STUDENT: "Student",
  FREELANCE: "Freelance",
  FULL_TIME: "Full Time",
};

export const STAGES = [
  "NEW",
  "REVIEWING",
  "INTERVIEW",
  "SHORTLISTED",
  "FUTURE_TALENT",
  "HIRED",
  "REJECTED",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  NEW: "New",
  REVIEWING: "Reviewing",
  INTERVIEW: "Interview",
  SHORTLISTED: "Shortlisted",
  FUTURE_TALENT: "Future Talent",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

export const STAGE_COLORS: Record<Stage, { bg: string; text: string; dot: string }> = {
  NEW: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  REVIEWING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  INTERVIEW: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  SHORTLISTED: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  FUTURE_TALENT: { bg: "bg-fuchsia-50", text: "text-fuchsia-700", dot: "bg-fuchsia-500" },
  HIRED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  REJECTED: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
};

export const INTERVIEW_OUTCOMES = [
  "HIRE",
  "SHORTLIST",
  "FUTURE_CANDIDATE",
  "SECOND_INTERVIEW",
  "REJECT",
] as const;
export type InterviewOutcome = (typeof INTERVIEW_OUTCOMES)[number];

export const INTERVIEW_OUTCOME_LABELS: Record<InterviewOutcome, string> = {
  HIRE: "Hire",
  SHORTLIST: "Shortlist",
  FUTURE_CANDIDATE: "Future Candidate",
  SECOND_INTERVIEW: "Second Interview",
  REJECT: "Reject",
};

// Maps an interview outcome decision to the pipeline stage the candidate moves to.
export const OUTCOME_TO_STAGE: Record<InterviewOutcome, Stage> = {
  HIRE: "HIRED",
  SHORTLIST: "SHORTLISTED",
  FUTURE_CANDIDATE: "FUTURE_TALENT",
  SECOND_INTERVIEW: "INTERVIEW",
  REJECT: "REJECTED",
};

export const RATING_CATEGORIES = [
  { key: "ratingCommunication", label: "Communication" },
  { key: "ratingExperience", label: "Experience" },
  { key: "ratingAvailability", label: "Availability" },
  { key: "ratingAttitude", label: "Attitude" },
  { key: "ratingLocation", label: "Location / Transportation" },
] as const;

export const SUGGESTED_TAGS = [
  "Barista",
  "Kitchen",
  "Cashier",
  "Supervisor",
  "Hashemite",
  "Luminus",
  "Middle East University",
  "Cloud Kitchen",
  "Experienced",
  "Student",
  "Full Time",
  "Fast Learner",
  "Strong Communication",
];

export const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || "962";

export const WHATSAPP_TEMPLATES = {
  INTERVIEW_INVITATION: {
    label: "Interview Invitation",
    build: (name: string, branch: string) =>
      `Hi ${name}, this is DRINKAT HR. We'd like to invite you for an interview` +
      `${branch ? ` at our ${branch} branch` : ""}. Could you let us know a time that works for you? Thank you!`,
  },
  ACCEPTED: {
    label: "Accepted",
    build: (name: string, position: string) =>
      `Hi ${name}, congratulations! We're happy to offer you the ${position} position at DRINKAT. ` +
      `Our team will follow up shortly with the next steps. Welcome aboard!`,
  },
  NOT_SELECTED: {
    label: "Not Selected",
    build: (name: string) =>
      `Hi ${name}, thank you for taking the time to apply and interview with DRINKAT. ` +
      `We've decided to move forward with other candidates for this role. We really appreciate your interest and wish you all the best.`,
  },
  KEEP_FOR_FUTURE: {
    label: "Keep For Future",
    build: (name: string) =>
      `Hi ${name}, thank you for applying to DRINKAT. We don't have an open position that matches right now, ` +
      `but we were impressed and would like to keep your profile for future opportunities. We'll reach out as soon as something opens up!`,
  },
} as const;

export type WhatsAppTemplateKey = keyof typeof WHATSAPP_TEMPLATES;

export const BRAND = {
  name: "DRINKAT",
  productName: "DRINKAT Recruitment",
};
