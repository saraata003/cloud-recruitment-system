"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Candidate } from "@/db/schema";
import { useToast } from "@/components/Toast";
import { api } from "./api-client";

/**
 * Shared quick-action handlers for candidate cards (Interview / Future /
 * Reject), used on the Dashboard, Candidates list, and Future Talent pages.
 * `onMutated` lets each page decide how to update its local list —
 * typically removing the candidate once it no longer matches the page's
 * current filter (e.g. rejected candidates dropping out of "New Applicants").
 */
export function useCandidateActions(onMutated?: (id: string, patch: Partial<Candidate>) => void) {
  const router = useRouter();
  const { show } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStage(candidate: Candidate, stage: string, successMsg: string) {
    setBusyId(candidate.id);
    try {
      const updated = await api.patch<Candidate>(`/api/candidates/${candidate.id}/stage`, { stage });
      onMutated?.(candidate.id, updated);
      show(successMsg);
    } catch {
      show("Something went wrong. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function startInterview(candidate: Candidate) {
    setBusyId(candidate.id);
    try {
      const interview = await api.post<{ id: string }>(`/api/candidates/${candidate.id}/interviews`, {});
      onMutated?.(candidate.id, { stage: "INTERVIEW" });
      router.push(`/interviews/${interview.id}`);
    } catch {
      show("Something went wrong. Please try again.", "error");
      setBusyId(null);
    }
  }

  return {
    busyId,
    moveToFuture: (c: Candidate) => setStage(c, "FUTURE_TALENT", "Moved to Future Talent"),
    reject: (c: Candidate) => setStage(c, "REJECTED", "Candidate rejected"),
    startInterview,
  };
}
