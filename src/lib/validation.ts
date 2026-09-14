import { z } from "zod";
import { BRANCHES, EMPLOYMENT_TYPES, INTERVIEW_OUTCOMES, POSITIONS, STAGES } from "./constants";

const optionalTrimmed = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

const coerceOptionalNumber = () =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === "") return undefined;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : undefined;
    });

const coerceBoolean = () =>
  z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "true" || v === "on" || v === "1");

export const applicationFieldsSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required"),
    phone: z.string().trim().min(7, "A valid phone number is required"),
    location: z.string().trim().min(2, "Location is required"),
    dateOfBirth: optionalTrimmed(),
    age: coerceOptionalNumber(),
    position: z.enum(POSITIONS),
    otherPositionText: optionalTrimmed(),
    preferredBranch: z.enum(BRANCHES),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    university: optionalTrimmed(),
    major: optionalTrimmed(),
    previousExperience: optionalTrimmed(),
    lastJob: optionalTrimmed(),
    yearsOfExperience: coerceOptionalNumber(),
    availableFrom: optionalTrimmed(),
    hasTransportation: coerceBoolean(),
    applicantNotes: optionalTrimmed(),
  })
  .superRefine((data, ctx) => {
    if (data.position === "OTHER" && !data.otherPositionText) {
      ctx.addIssue({
        code: "custom",
        path: ["otherPositionText"],
        message: "Please describe the position you're applying for",
      });
    }
    if (data.employmentType === "STUDENT" && !data.university) {
      ctx.addIssue({
        code: "custom",
        path: ["university"],
        message: "Please add your university",
      });
    }
  });

export type ApplicationFields = z.infer<typeof applicationFieldsSchema>;

export const updateCandidateSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  phone: z.string().trim().min(7).optional(),
  location: z.string().trim().min(2).optional(),
  dateOfBirth: z.string().optional().nullable(),
  age: z.number().int().positive().optional().nullable(),
  position: z.enum(POSITIONS).optional(),
  otherPositionText: z.string().optional().nullable(),
  preferredBranch: z.enum(BRANCHES).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  university: z.string().optional().nullable(),
  major: z.string().optional().nullable(),
  previousExperience: z.string().optional().nullable(),
  lastJob: z.string().optional().nullable(),
  yearsOfExperience: z.number().nonnegative().optional().nullable(),
  availableFrom: z.string().optional().nullable(),
  hasTransportation: z.boolean().optional(),
  applicantNotes: z.string().optional().nullable(),
  duplicateAlertSeen: z.boolean().optional(),
});

export const stageChangeSchema = z.object({
  stage: z.enum(STAGES),
  note: z.string().trim().optional(),
});

export const noteCreateSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty"),
});

export const tagAddSchema = z.object({
  name: z.string().trim().min(1).max(40),
});

export const interviewCreateSchema = z.object({
  scheduledAt: z.string().optional(),
  round: z.number().int().positive().optional(),
});

export const interviewUpdateSchema = z.object({
  scheduledAt: z.string().optional().nullable(),
  notes: z.string().optional(),
  ratingCommunication: z.number().int().min(1).max(5).optional().nullable(),
  ratingExperience: z.number().int().min(1).max(5).optional().nullable(),
  ratingAvailability: z.number().int().min(1).max(5).optional().nullable(),
  ratingAttitude: z.number().int().min(1).max(5).optional().nullable(),
  ratingLocation: z.number().int().min(1).max(5).optional().nullable(),
  outcome: z.enum(INTERVIEW_OUTCOMES).optional().nullable(),
});

export const candidateSearchSchema = z.object({
  q: z.string().optional(),
  stage: z.string().optional(),
  position: z.string().optional(),
  branch: z.string().optional(),
  employmentType: z.string().optional(),
  experience: z.enum(["EXPERIENCED", "NO_EXPERIENCE"]).optional(),
  tag: z.string().optional(),
});
