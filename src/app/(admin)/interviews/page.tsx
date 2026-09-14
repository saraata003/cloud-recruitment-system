"use client";

import { useMemo } from "react";
import { CalendarClock, Play } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { LinkButton } from "@/components/Button";
import { useApiData } from "@/lib/use-api";
import { INTERVIEW_OUTCOME_LABELS, POSITION_LABELS, type InterviewOutcome, type Position } from "@/lib/constants";
import { formatDateTime, isToday } from "@/lib/utils";
import type { InterviewWithCandidate } from "@/types";

function Row({ interview }: { interview: InterviewWithCandidate }) {
  const c = interview.candidate;
  const position = c.position === "OTHER" && c.otherPositionText ? c.otherPositionText : POSITION_LABELS[c.position as Position];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3.5">
      <Avatar src={c.photoUrl} name={c.fullName} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-stone-900">{c.fullName}</p>
          <StatusBadge stage={c.stage} />
        </div>
        <p className="truncate text-xs text-stone-500">
          {position} · Round {interview.round}
          {interview.scheduledAt ? ` · ${formatDateTime(interview.scheduledAt)}` : " · Not scheduled"}
        </p>
      </div>
      {interview.outcome ? (
        <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
          {INTERVIEW_OUTCOME_LABELS[interview.outcome as InterviewOutcome]}
        </span>
      ) : (
        <LinkButton href={`/interviews/${interview.id}`} size="sm" variant="subtle">
          <Play size={13} /> Start
        </LinkButton>
      )}
    </div>
  );
}

export default function InterviewsPage() {
  const { data, loading } = useApiData<InterviewWithCandidate[]>("/api/interviews");

  const groups = useMemo(() => {
    const today: InterviewWithCandidate[] = [];
    const upcoming: InterviewWithCandidate[] = [];
    const completed: InterviewWithCandidate[] = [];

    for (const iv of data ?? []) {
      if (iv.outcome) {
        completed.push(iv);
      } else if (iv.scheduledAt && isToday(iv.scheduledAt)) {
        today.push(iv);
      } else {
        // Not yet completed: no time set, or scheduled for another day.
        upcoming.push(iv);
      }
    }

    today.sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));
    upcoming.sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));

    return { today, upcoming, completed };
  }, [data]);

  const isEmpty = !loading && (data?.length ?? 0) === 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Interviews</h1>
        <p className="text-sm text-stone-500">Today, upcoming, and completed interviews.</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState icon={CalendarClock} title="No interviews yet" description="Start one from any candidate's profile." />
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-stone-900">Today</h2>
            {groups.today.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {groups.today.map((iv) => (
                  <Row key={iv.id} interview={iv} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400">Nothing scheduled for today.</p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-stone-900">Upcoming</h2>
            {groups.upcoming.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {groups.upcoming.map((iv) => (
                  <Row key={iv.id} interview={iv} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400">No other pending interviews.</p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-stone-900">Completed</h2>
            {groups.completed.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {groups.completed.map((iv) => (
                  <Row key={iv.id} interview={iv} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400">No completed interviews yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
