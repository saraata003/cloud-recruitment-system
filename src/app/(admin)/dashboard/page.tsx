"use client";

import Link from "next/link";
import { Users, Inbox, CalendarClock, ClipboardCheck, Star, UserCheck, Play, Loader2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { CandidateCard } from "@/components/CandidateCard";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { LinkButton } from "@/components/Button";
import { useApiData } from "@/lib/use-api";
import { useCandidateActions } from "@/lib/use-candidate-actions";
import { POSITION_LABELS, type Position } from "@/lib/constants";
import { formatTime } from "@/lib/utils";
import type { Candidate } from "@/db/schema";
import type { DashboardStats, TodayInterview } from "@/types";

export default function DashboardPage() {
  const { data: stats } = useApiData<DashboardStats>("/api/stats");
  const { data: todayInterviews, loading: loadingToday } = useApiData<TodayInterview[]>("/api/interviews/today");
  const { data: newApplicants, loading: loadingNew, setData: setNewApplicants } = useApiData<Candidate[]>(
    "/api/candidates?stage=NEW"
  );

  const { busyId, moveToFuture, reject, startInterview } = useCandidateActions((id, patch) => {
    setNewApplicants((prev) => (prev ?? []).filter((c) => !(c.id === id && patch.stage && patch.stage !== "NEW")));
  });

  const visibleNew = (newApplicants ?? []).slice(0, 8);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-500">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Applicants" value={stats?.totalApplicants ?? "—"} icon={Users} accent="stone" href="/candidates" />
        <StatCard
          label="New Applicants"
          value={stats?.newApplicants ?? "—"}
          icon={Inbox}
          accent="sky"
          href="/candidates?stage=NEW"
        />
        <StatCard
          label="Interviews"
          value={stats?.interviews ?? "—"}
          icon={CalendarClock}
          accent="violet"
          href="/candidates?stage=INTERVIEW"
        />
        <StatCard
          label="Shortlisted"
          value={stats?.shortlisted ?? "—"}
          icon={ClipboardCheck}
          accent="teal"
          href="/candidates?stage=SHORTLISTED"
        />
        <StatCard label="Future Candidates" value={stats?.futureCandidates ?? "—"} icon={Star} accent="fuchsia" href="/future-talent" />
        <StatCard label="Hired" value={stats?.hired ?? "—"} icon={UserCheck} accent="emerald" href="/hired" />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900">Today&apos;s Interviews</h2>
          <Link href="/interviews" className="text-sm font-medium text-orange-600 hover:text-orange-700">
            View all
          </Link>
        </div>
        {loadingToday ? (
          <LoadingRow />
        ) : todayInterviews && todayInterviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todayInterviews.map((iv) => (
              <div key={iv.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm">
                <Avatar src={iv.candidate.photoUrl} name={iv.candidate.fullName} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-900">{iv.candidate.fullName}</p>
                  <p className="truncate text-xs text-stone-500">
                    {iv.candidate.position === "OTHER" && iv.candidate.otherPositionText
                      ? iv.candidate.otherPositionText
                      : POSITION_LABELS[iv.candidate.position as Position]}
                    {iv.scheduledAt ? ` · ${formatTime(iv.scheduledAt)}` : ""}
                  </p>
                </div>
                <LinkButton href={`/interviews/${iv.id}`} size="sm" variant="subtle">
                  <Play size={13} /> Start
                </LinkButton>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={CalendarClock} title="No interviews scheduled for today" description="Start one from a candidate's profile whenever you're ready." />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900">New Applicants</h2>
          <Link href="/candidates?stage=NEW" className="text-sm font-medium text-orange-600 hover:text-orange-700">
            View all
          </Link>
        </div>
        {loadingNew ? (
          <LoadingRow />
        ) : visibleNew.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleNew.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                busy={busyId === candidate.id}
                onInterview={() => startInterview(candidate)}
                onFuture={() => moveToFuture(candidate)}
                onReject={() => reject(candidate)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Inbox}
            title="No new applicants yet"
            description="Share your public application link to start receiving candidates."
            action={
              <LinkButton href="/apply" target="_blank" variant="outline" size="sm">
                Open application form
              </LinkButton>
            }
          />
        )}
      </section>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-stone-200 bg-white py-10 text-stone-400">
      <Loader2 size={20} className="animate-spin" />
    </div>
  );
}
