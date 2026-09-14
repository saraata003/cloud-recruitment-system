"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  User,
  Briefcase,
  FileText,
  Sparkles,
  MessageSquare,
  History,
  StickyNote,
  Clock,
  Download,
  RefreshCw,
  Loader2,
  Check,
  Star,
  XCircle,
  PlayCircle,
  TriangleAlert,
  Tag as TagIcon,
  ArrowLeft,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Section, InfoItem } from "@/components/Section";
import { Button, LinkButton } from "@/components/Button";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { TagEditor } from "@/components/TagEditor";
import { EmptyState } from "@/components/EmptyState";
import { useApiData } from "@/lib/use-api";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import {
  BRANCH_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  POSITION_LABELS,
  STAGE_LABELS,
  INTERVIEW_OUTCOME_LABELS,
  type Branch,
  type EmploymentType,
  type Position,
  type Stage,
  type InterviewOutcome,
} from "@/lib/constants";
import { formatDate, formatDateTime, formatYearsOfExperience, getDisplayAge, safeJsonParse, timeAgo } from "@/lib/utils";
import type { CandidateProfile } from "@/types";
import type { PreviousSnapshot } from "@/lib/application-service";

export default function CandidateProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { show } = useToast();

  const { data: candidate, loading, setData } = useApiData<CandidateProfile>(`/api/candidates/${id}`);

  const [noteInput, setNoteInput] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [stageBusy, setStageBusy] = useState(false);
  const [startingInterview, setStartingInterview] = useState(false);

  if (loading && !candidate) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-stone-400" size={28} />
      </div>
    );
  }
  if (!candidate) {
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Candidate not found"
        description="This profile may have been removed."
        action={
          <LinkButton href="/candidates" variant="outline" size="sm">
            Back to Candidates
          </LinkButton>
        }
      />
    );
  }

  async function changeStage(stage: Stage) {
    setStageBusy(true);
    try {
      const updated = await api.patch<CandidateProfile>(`/api/candidates/${id}/stage`, { stage });
      setData((prev) => (prev ? { ...prev, ...updated } : prev));
      show(`Moved to ${STAGE_LABELS[stage]}`);
    } catch {
      show("Something went wrong", "error");
    } finally {
      setStageBusy(false);
    }
  }

  async function startInterview() {
    setStartingInterview(true);
    try {
      const interview = await api.post<{ id: string }>(`/api/candidates/${id}/interviews`, {});
      router.push(`/interviews/${interview.id}`);
    } catch {
      show("Something went wrong", "error");
      setStartingInterview(false);
    }
  }

  async function regenerateSummary() {
    setRegenerating(true);
    try {
      const updated = await api.post<CandidateProfile>(`/api/candidates/${id}/ai-summary`, {});
      setData((prev) => (prev ? { ...prev, ...updated } : prev));
      show("AI summary updated");
    } catch {
      show("Something went wrong", "error");
    } finally {
      setRegenerating(false);
    }
  }

  async function addNote() {
    if (!noteInput.trim()) return;
    setAddingNote(true);
    try {
      const created = await api.post<CandidateProfile["notes"][number]>(`/api/candidates/${id}/notes`, {
        body: noteInput.trim(),
      });
      setData((prev) => (prev ? { ...prev, notes: [created, ...prev.notes] } : prev));
      setNoteInput("");
    } catch {
      show("Something went wrong", "error");
    } finally {
      setAddingNote(false);
    }
  }

  async function dismissDuplicateAlert() {
    try {
      const updated = await api.patch<CandidateProfile>(`/api/candidates/${id}`, { duplicateAlertSeen: true });
      setData((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch {
      // non-critical — silently ignore
    }
  }

  const age = getDisplayAge(candidate);
  const position =
    candidate.position === "OTHER" && candidate.otherPositionText
      ? candidate.otherPositionText
      : POSITION_LABELS[candidate.position as Position];
  const branchLabel = BRANCH_LABELS[candidate.preferredBranch as Branch];
  const keyPoints = safeJsonParse<string[]>(candidate.aiKeyPoints, []);
  const previousSnapshots = safeJsonParse<PreviousSnapshot[]>(candidate.previousSnapshots, []);
  const latestInterview = candidate.interviews[0];

  return (
    <div className="flex flex-col gap-5 pb-16">
      <LinkButton href="/candidates" variant="ghost" size="sm" className="-ml-2 self-start">
        <ArrowLeft size={14} /> Back to Candidates
      </LinkButton>

      {candidate.isDuplicate && !candidate.duplicateAlertSeen && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="flex-1 text-sm text-amber-900">
            <p className="font-semibold">Duplicate applicant</p>
            <p className="mt-0.5 text-amber-800">
              This person applied before ({candidate.reapplicationCount} previous submission
              {candidate.reapplicationCount === 1 ? "" : "s"}). Their profile now reflects the latest submission —
              see Previous Submissions below for what changed.
            </p>
          </div>
          <button onClick={dismissDuplicateAlert} className="shrink-0 text-xs font-medium text-amber-700 hover:text-amber-900">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={candidate.photoUrl} name={candidate.fullName} size="xl" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">{candidate.fullName}</h1>
              <StatusBadge stage={candidate.stage} />
            </div>
            <p className="text-sm text-stone-500">
              {position}
              {age ? ` · ${age} yrs` : ""} · {branchLabel}
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Applied {formatDate(candidate.createdAt)} ({timeAgo(candidate.createdAt)})
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WhatsAppButton phone={candidate.phone} name={candidate.fullName} position={position} branch={branchLabel} />
          <Button variant="outline" size="md" onClick={startInterview} disabled={startingInterview}>
            {startingInterview ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />} Start Interview
          </Button>
        </div>
      </div>

      {/* Decision actions */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white p-4">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-stone-400">Move to</span>
        <Button variant="success" size="sm" disabled={stageBusy} onClick={() => changeStage("SHORTLISTED")}>
          <Check size={14} /> Shortlist
        </Button>
        <Button variant="subtle" size="sm" disabled={stageBusy} onClick={() => changeStage("FUTURE_TALENT")}>
          <Star size={14} /> Future Talent
        </Button>
        <Button variant="primary" size="sm" disabled={stageBusy} onClick={() => changeStage("HIRED")}>
          <Check size={14} /> Hire
        </Button>
        <Button variant="danger" size="sm" disabled={stageBusy} onClick={() => changeStage("REJECTED")}>
          <XCircle size={14} /> Reject
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Section title="Personal Information" icon={User}>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoItem label="Phone" value={candidate.phone} />
              <InfoItem label="Location" value={candidate.location} />
              <InfoItem label="Age" value={age ?? undefined} />
              <InfoItem label="Date of birth" value={candidate.dateOfBirth ? formatDate(candidate.dateOfBirth) : undefined} />
              <InfoItem label="Transportation" value={candidate.hasTransportation ? "Has own transportation" : "No transportation"} />
              <InfoItem label="Source" value={candidate.source === "PUBLIC_FORM" ? "Public application form" : candidate.source} />
            </dl>
          </Section>

          <Section title="Application" icon={Briefcase}>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoItem label="Position" value={position} />
              <InfoItem label="Preferred branch" value={branchLabel} />
              <InfoItem label="Employment type" value={EMPLOYMENT_TYPE_LABELS[candidate.employmentType as EmploymentType]} />
              {candidate.employmentType === "STUDENT" && (
                <>
                  <InfoItem label="University" value={candidate.university} />
                  <InfoItem label="Major" value={candidate.major} />
                </>
              )}
              <InfoItem label="Years of experience" value={formatYearsOfExperience(candidate.yearsOfExperience)} />
              <InfoItem label="Last job" value={candidate.lastJob} />
              <InfoItem label="Available from" value={candidate.availableFrom} />
            </dl>
            {candidate.previousExperience && (
              <div className="mt-4 border-t border-stone-100 pt-4">
                <dt className="text-xs text-stone-400">Previous experience</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{candidate.previousExperience}</dd>
              </div>
            )}
            {candidate.applicantNotes && (
              <div className="mt-4 border-t border-stone-100 pt-4">
                <dt className="text-xs text-stone-400">Notes from applicant</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{candidate.applicantNotes}</dd>
              </div>
            )}
          </Section>

          {previousSnapshots.length > 0 && (
            <Section title={`Previous Submissions (${previousSnapshots.length})`} icon={History}>
              <div className="flex flex-col gap-3">
                {previousSnapshots
                  .slice()
                  .reverse()
                  .map((snap, i) => (
                    <div key={i} className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-sm">
                      <p className="text-xs font-medium text-stone-400">{formatDateTime(snap.submittedAt)}</p>
                      <p className="mt-1 text-stone-700">
                        Applied for{" "}
                        <strong>
                          {snap.position === "OTHER" && snap.otherPositionText
                            ? snap.otherPositionText
                            : POSITION_LABELS[snap.position as Position]}
                        </strong>{" "}
                        at {BRANCH_LABELS[snap.preferredBranch as Branch]}
                        {snap.lastJob ? `, last worked at ${snap.lastJob}` : ""}.
                      </p>
                    </div>
                  ))}
              </div>
            </Section>
          )}

          <Section
            title="CV"
            icon={FileText}
            action={
              candidate.cvUrl ? (
                <a
                  href={candidate.cvUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  <Download size={13} /> Download
                </a>
              ) : undefined
            }
          >
            {candidate.cvUrl ? (
              candidate.cvUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe src={candidate.cvUrl} className="h-96 w-full rounded-xl border border-stone-200" title="CV preview" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={candidate.cvUrl} alt="CV" className="max-h-96 w-full rounded-xl border border-stone-200 object-contain" />
              )
            ) : (
              <p className="text-sm text-stone-400">No CV uploaded.</p>
            )}
          </Section>

          <Section title="Interview History" icon={History}>
            {candidate.interviews.length === 0 ? (
              <p className="text-sm text-stone-400">No interviews yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {candidate.interviews.map((iv) => (
                  <a
                    key={iv.id}
                    href={`/interviews/${iv.id}`}
                    className="block rounded-xl border border-stone-100 p-3.5 hover:border-orange-200 hover:bg-orange-50/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-stone-800">
                        Round {iv.round}
                        {iv.scheduledAt ? ` · ${formatDateTime(iv.scheduledAt)}` : ""}
                      </p>
                      {iv.outcome && (
                        <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                          {INTERVIEW_OUTCOME_LABELS[iv.outcome as InterviewOutcome]}
                        </span>
                      )}
                    </div>
                    {iv.aiInterviewSummary && <p className="mt-1.5 line-clamp-2 text-xs text-stone-500">{iv.aiInterviewSummary}</p>}
                  </a>
                ))}
              </div>
            )}
          </Section>

          <Section title="Status History" icon={Clock}>
            <ol className="flex flex-col gap-3">
              {candidate.statusHistory.map((h) => (
                <li key={h.id} className="flex gap-3 text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  <div>
                    <p className="text-stone-700">
                      {h.fromStage ? (
                        <>
                          Moved from <strong>{STAGE_LABELS[h.fromStage as Stage] ?? h.fromStage}</strong> to{" "}
                          <strong>{STAGE_LABELS[h.toStage as Stage] ?? h.toStage}</strong>
                        </>
                      ) : (
                        <>
                          Applied — set to <strong>{STAGE_LABELS[h.toStage as Stage] ?? h.toStage}</strong>
                        </>
                      )}
                    </p>
                    {h.note && <p className="text-xs text-stone-500">{h.note}</p>}
                    <p className="text-xs text-stone-400">{formatDateTime(h.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <div className="flex flex-col gap-5">
          <Section
            title="AI Summary"
            icon={Sparkles}
            action={
              <button
                onClick={regenerateSummary}
                disabled={regenerating}
                className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50"
              >
                {regenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Regenerate
              </button>
            }
          >
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
            <p className="mt-3 text-[11px] text-stone-400">
              {candidate.aiProvider === "claude" ? "Generated by AI" : "Generated automatically"}
              {candidate.aiGeneratedAt ? ` · ${timeAgo(candidate.aiGeneratedAt)}` : ""}
            </p>
          </Section>

          {latestInterview?.aiQuestions && (
            <Section title="AI Interview Questions" icon={MessageSquare}>
              <ul className="flex flex-col gap-3">
                {safeJsonParse<{ category: string; question: string }[]>(latestInterview.aiQuestions, []).map((q, i) => (
                  <li key={i}>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-500">{q.category}</span>
                    <p className="text-sm text-stone-700">{q.question}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Tags" icon={TagIcon}>
            <TagEditor
              candidateId={candidate.id}
              tags={candidate.tags}
              onChange={(tags) => setData((prev) => (prev ? { ...prev, tags } : prev))}
            />
          </Section>

          <Section title="Notes" icon={StickyNote}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addNote();
              }}
              className="mb-3 flex flex-col gap-2"
            >
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                rows={2}
                placeholder="Add an internal note…"
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
              />
              <Button type="submit" size="sm" variant="outline" disabled={addingNote || !noteInput.trim()} className="self-end">
                Add Note
              </Button>
            </form>
            <div className="flex flex-col gap-3">
              {candidate.notes.length === 0 ? (
                <p className="text-sm text-stone-400">No notes yet.</p>
              ) : (
                candidate.notes.map((n) => (
                  <div key={n.id} className="rounded-xl bg-stone-50 p-3">
                    <p className="whitespace-pre-wrap text-sm text-stone-700">{n.body}</p>
                    <p className="mt-1 text-xs text-stone-400">{timeAgo(n.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
