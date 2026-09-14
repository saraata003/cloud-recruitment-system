"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  MessageSquare,
  RefreshCw,
  Loader2,
  Check,
  Star,
  XCircle,
  Redo2,
  Save,
  TriangleAlert,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Section } from "@/components/Section";
import { Button, LinkButton } from "@/components/Button";
import { RatingInput } from "@/components/RatingInput";
import { EmptyState } from "@/components/EmptyState";
import { useApiData } from "@/lib/use-api";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import {
  BRANCH_LABELS,
  INTERVIEW_OUTCOME_LABELS,
  POSITION_LABELS,
  RATING_CATEGORIES,
  type Branch,
  type InterviewOutcome,
  type Position,
} from "@/lib/constants";
import { formatDateTime, getDisplayAge, safeJsonParse } from "@/lib/utils";
import type { InterviewWithCandidate } from "@/types";

type Ratings = {
  ratingCommunication: number | null;
  ratingExperience: number | null;
  ratingAvailability: number | null;
  ratingAttitude: number | null;
  ratingLocation: number | null;
};

export default function InterviewSessionPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { show } = useToast();

  const { data: interview, loading, setData } = useApiData<InterviewWithCandidate>(`/api/interviews/${id}`);

  const [notes, setNotes] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Ratings | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [decidingOutcome, setDecidingOutcome] = useState<InterviewOutcome | null>(null);

  if (loading && !interview) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-stone-400" size={28} />
      </div>
    );
  }
  if (!interview) {
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Interview not found"
        action={
          <LinkButton href="/interviews" variant="outline" size="sm">
            Back to Interviews
          </LinkButton>
        }
      />
    );
  }

  const currentNotes = notes ?? interview.notes ?? "";
  const currentRatings: Ratings = ratings ?? {
    ratingCommunication: interview.ratingCommunication,
    ratingExperience: interview.ratingExperience,
    ratingAvailability: interview.ratingAvailability,
    ratingAttitude: interview.ratingAttitude,
    ratingLocation: interview.ratingLocation,
  };

  const candidate = interview.candidate;
  const age = getDisplayAge(candidate);
  const position =
    candidate.position === "OTHER" && candidate.otherPositionText
      ? candidate.otherPositionText
      : POSITION_LABELS[candidate.position as Position];
  const questions = safeJsonParse<{ category: string; question: string }[]>(interview.aiQuestions, []);
  const keyPoints = safeJsonParse<string[]>(candidate.aiKeyPoints, []);

  async function generateQuestions() {
    setGeneratingQuestions(true);
    try {
      const updated = await api.post<InterviewWithCandidate>(`/api/interviews/${id}/ai-questions`, {});
      setData((prev) => (prev ? { ...prev, ...updated, candidate: prev.candidate } : prev));
    } catch {
      show("Something went wrong generating questions", "error");
    } finally {
      setGeneratingQuestions(false);
    }
  }

  async function saveProgress(silent = false) {
    setSavingProgress(true);
    try {
      const updated = await api.patch<InterviewWithCandidate>(`/api/interviews/${id}`, {
        notes: currentNotes,
        ...currentRatings,
      });
      setData((prev) => (prev ? { ...prev, ...updated } : prev));
      if (!silent) show("Progress saved");
      return updated;
    } catch {
      show("Something went wrong saving", "error");
      return null;
    } finally {
      setSavingProgress(false);
    }
  }

  async function decide(outcome: InterviewOutcome) {
    setDecidingOutcome(outcome);
    try {
      const updated = await api.patch<InterviewWithCandidate>(`/api/interviews/${id}`, {
        notes: currentNotes,
        ...currentRatings,
        outcome,
      });
      setData((prev) => (prev ? { ...prev, ...updated } : prev));
      show(`Marked as ${INTERVIEW_OUTCOME_LABELS[outcome]}`);
      try {
        const withSummary = await api.post<InterviewWithCandidate>(`/api/interviews/${id}/ai-summary`, {});
        setData((prev) => (prev ? { ...prev, ...withSummary, candidate: prev.candidate } : prev));
      } catch {
        // AI summary is a nice-to-have — the decision itself already saved successfully.
      }
    } catch {
      show("Something went wrong", "error");
    } finally {
      setDecidingOutcome(null);
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-16">
      <LinkButton href={`/candidates/${candidate.id}`} variant="ghost" size="sm" className="-ml-2 self-start">
        <ArrowLeft size={14} /> Back to profile
      </LinkButton>

      <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={candidate.photoUrl} name={candidate.fullName} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-stone-900">{candidate.fullName}</h1>
              <StatusBadge stage={candidate.stage} />
            </div>
            <p className="text-sm text-stone-500">
              {position}
              {age ? ` · ${age} yrs` : ""} · {BRANCH_LABELS[candidate.preferredBranch as Branch]} · Round {interview.round}
            </p>
          </div>
        </div>
        {candidate.cvUrl && (
          <a
            href={candidate.cvUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            <FileText size={15} /> Open CV
          </a>
        )}
      </div>

      {interview.outcome && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <Check size={16} /> This interview is complete — recorded as{" "}
          <strong>{INTERVIEW_OUTCOME_LABELS[interview.outcome as InterviewOutcome]}</strong>.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-1">
          <Section title="AI Summary" icon={Sparkles}>
            <p className="text-sm leading-relaxed text-stone-700">{candidate.aiSummary || "No AI summary yet."}</p>
            {keyPoints.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5">
                {keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-stone-600">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-orange-400" /> {point}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="AI Interview Questions"
            icon={MessageSquare}
            action={
              <button
                onClick={generateQuestions}
                disabled={generatingQuestions}
                className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50"
              >
                {generatingQuestions ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                {questions.length > 0 ? "Regenerate" : "Generate"}
              </button>
            }
          >
            {questions.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {questions.map((q, i) => (
                  <li key={i}>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-500">{q.category}</span>
                    <p className="text-sm text-stone-700">{q.question}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-400">
                Generate a set of questions tailored to this candidate&apos;s CV and answers.
              </p>
            )}
          </Section>

          {interview.aiInterviewSummary && (
            <Section title="Interview Summary" icon={Sparkles}>
              <p className="text-sm leading-relaxed text-stone-700">{interview.aiInterviewSummary}</p>
            </Section>
          )}
        </div>

        <div className="flex flex-col gap-5 lg:col-span-2">
          <Section title="Interview Notes" icon={FileText}>
            <textarea
              value={currentNotes}
              onChange={(e) => setNotes(e.target.value)}
              rows={7}
              placeholder="Type notes while you talk to the candidate…"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-3 text-sm leading-relaxed focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
            />
            <div className="mt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => saveProgress()} disabled={savingProgress}>
                {savingProgress ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Progress
              </Button>
            </div>
          </Section>

          <Section title="Evaluation">
            <div className="flex flex-col gap-3">
              {RATING_CATEGORIES.map((cat) => (
                <RatingInput
                  key={cat.key}
                  label={cat.label}
                  value={currentRatings[cat.key as keyof Ratings]}
                  onChange={(v) => setRatings({ ...currentRatings, [cat.key]: v })}
                />
              ))}
            </div>
          </Section>

          <Section title="Decision">
            <p className="mb-3 text-xs text-stone-500">
              Saves your notes and ratings, moves the candidate&apos;s pipeline stage, and generates an interview summary.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <DecisionButton
                label="Hire"
                icon={Check}
                variant="primary"
                busy={decidingOutcome === "HIRE"}
                disabled={Boolean(decidingOutcome)}
                onClick={() => decide("HIRE")}
              />
              <DecisionButton
                label="Shortlist"
                icon={Check}
                variant="success"
                busy={decidingOutcome === "SHORTLIST"}
                disabled={Boolean(decidingOutcome)}
                onClick={() => decide("SHORTLIST")}
              />
              <DecisionButton
                label="Future Candidate"
                icon={Star}
                variant="subtle"
                busy={decidingOutcome === "FUTURE_CANDIDATE"}
                disabled={Boolean(decidingOutcome)}
                onClick={() => decide("FUTURE_CANDIDATE")}
              />
              <DecisionButton
                label="Second Interview"
                icon={Redo2}
                variant="outline"
                busy={decidingOutcome === "SECOND_INTERVIEW"}
                disabled={Boolean(decidingOutcome)}
                onClick={() => decide("SECOND_INTERVIEW")}
              />
              <DecisionButton
                label="Reject"
                icon={XCircle}
                variant="danger"
                busy={decidingOutcome === "REJECT"}
                disabled={Boolean(decidingOutcome)}
                onClick={() => decide("REJECT")}
              />
            </div>
          </Section>

          {interview.scheduledAt && (
            <p className="text-center text-xs text-stone-400">Scheduled for {formatDateTime(interview.scheduledAt)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DecisionButton({
  label,
  icon: Icon,
  variant,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  icon: typeof Check;
  variant: "primary" | "success" | "subtle" | "outline" | "danger";
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant={variant} size="md" onClick={onClick} disabled={disabled} className="flex-col gap-1 py-3">
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
      <span className="text-xs">{label}</span>
    </Button>
  );
}
