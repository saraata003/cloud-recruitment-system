import type { Candidate, Interview, NoteRow, StatusHistoryRow, Tag } from "@/db/schema";

// Matches the response shape of GET /api/candidates.
export interface CandidateWithExtras extends Candidate {
  tags: Tag[];
}

// Note: aiKeyPoints, previousSnapshots (on Candidate) and aiQuestions (on
// Interview) are stored as JSON text columns — parse with safeJsonParse().
export interface CandidateProfile extends Candidate {
  tags: Tag[];
  interviews: Interview[];
  notes: NoteRow[];
  statusHistory: StatusHistoryRow[];
}

export interface DashboardStats {
  totalApplicants: number;
  newApplicants: number;
  interviews: number;
  shortlisted: number;
  futureCandidates: number;
  hired: number;
}

export interface TodayInterview extends Interview {
  candidate: Candidate;
}

export interface InterviewWithCandidate extends Interview {
  candidate: Candidate;
}
