import { relations } from "drizzle-orm";
import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

function uuid(columnName: string) {
  return text(columnName)
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
}

function nowIso() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Candidates — one row per person. A re-application by the same phone number
// updates this same row (see lib/duplicate.ts) so interview/notes history is
// never orphaned across resubmissions.
// ---------------------------------------------------------------------------
export const candidates = sqliteTable("candidates", {
  id: uuid("id"),

  fullName: text("full_name").notNull(),
  photoUrl: text("photo_url"),

  phone: text("phone").notNull(),
  phoneNormalized: text("phone_normalized").notNull(),
  location: text("location").notNull(),

  dateOfBirth: text("date_of_birth"),
  age: integer("age"),

  position: text("position").notNull(),
  otherPositionText: text("other_position_text"),
  preferredBranch: text("preferred_branch").notNull(),

  employmentType: text("employment_type").notNull(),
  university: text("university"),
  major: text("major"),

  previousExperience: text("previous_experience"),
  lastJob: text("last_job"),
  yearsOfExperience: real("years_of_experience"),

  availableFrom: text("available_from"),
  hasTransportation: integer("has_transportation", { mode: "boolean" })
    .notNull()
    .default(false),

  cvUrl: text("cv_url"),
  cvFileName: text("cv_file_name"),
  applicantNotes: text("applicant_notes"),

  stage: text("stage").notNull().default("NEW"),

  aiSummary: text("ai_summary"),
  aiKeyPoints: text("ai_key_points"),
  aiGeneratedAt: text("ai_generated_at"),
  aiProvider: text("ai_provider"),

  isDuplicate: integer("is_duplicate", { mode: "boolean" }).notNull().default(false),
  duplicateAlertSeen: integer("duplicate_alert_seen", { mode: "boolean" })
    .notNull()
    .default(false),
  reapplicationCount: integer("reapplication_count").notNull().default(0),
  previousSnapshots: text("previous_snapshots"),

  source: text("source").notNull().default("PUBLIC_FORM"),

  createdAt: text("created_at").notNull().$defaultFn(nowIso),
  updatedAt: text("updated_at").notNull().$defaultFn(nowIso),
  hiredAt: text("hired_at"),
});

export const interviews = sqliteTable("interviews", {
  id: uuid("id"),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),

  round: integer("round").notNull().default(1),
  scheduledAt: text("scheduled_at"),

  aiQuestions: text("ai_questions"),

  notes: text("notes"),

  ratingCommunication: integer("rating_communication"),
  ratingExperience: integer("rating_experience"),
  ratingAvailability: integer("rating_availability"),
  ratingAttitude: integer("rating_attitude"),
  ratingLocation: integer("rating_location"),

  outcome: text("outcome"),
  aiInterviewSummary: text("ai_interview_summary"),

  createdAt: text("created_at").notNull().$defaultFn(nowIso),
  updatedAt: text("updated_at").notNull().$defaultFn(nowIso),
  completedAt: text("completed_at"),
});

export const statusHistory = sqliteTable("status_history", {
  id: uuid("id"),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  fromStage: text("from_stage"),
  toStage: text("to_stage").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull().$defaultFn(nowIso),
});

export const notes = sqliteTable("notes", {
  id: uuid("id"),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(nowIso),
});

export const tags = sqliteTable("tags", {
  id: uuid("id"),
  name: text("name").notNull().unique(),
});

export const candidateTags = sqliteTable(
  "candidate_tags",
  {
    candidateId: text("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().$defaultFn(nowIso),
  },
  (t) => [primaryKey({ columns: [t.candidateId, t.tagId] })]
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const candidatesRelations = relations(candidates, ({ many }) => ({
  interviews: many(interviews),
  statusHistory: many(statusHistory),
  notes: many(notes),
  candidateTags: many(candidateTags),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  candidate: one(candidates, {
    fields: [interviews.candidateId],
    references: [candidates.id],
  }),
}));

export const statusHistoryRelations = relations(statusHistory, ({ one }) => ({
  candidate: one(candidates, {
    fields: [statusHistory.candidateId],
    references: [candidates.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  candidate: one(candidates, {
    fields: [notes.candidateId],
    references: [candidates.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  candidateTags: many(candidateTags),
}));

export const candidateTagsRelations = relations(candidateTags, ({ one }) => ({
  candidate: one(candidates, {
    fields: [candidateTags.candidateId],
    references: [candidates.id],
  }),
  tag: one(tags, {
    fields: [candidateTags.tagId],
    references: [tags.id],
  }),
}));

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
export type Interview = typeof interviews.$inferSelect;
export type NewInterview = typeof interviews.$inferInsert;
export type StatusHistoryRow = typeof statusHistory.$inferSelect;
export type NoteRow = typeof notes.$inferSelect;
export type Tag = typeof tags.$inferSelect;
