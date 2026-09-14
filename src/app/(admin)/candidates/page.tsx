"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Users, X } from "lucide-react";
import { CandidateCard } from "@/components/CandidateCard";
import { EmptyState } from "@/components/EmptyState";
import { useApiData } from "@/lib/use-api";
import { useCandidateActions } from "@/lib/use-candidate-actions";
import {
  BRANCHES,
  BRANCH_LABELS,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  POSITIONS,
  POSITION_LABELS,
  STAGE_LABELS,
  type Stage,
} from "@/lib/constants";
import type { Candidate } from "@/db/schema";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "shrink-0 rounded-full bg-orange-600 px-3.5 py-1.5 text-xs font-semibold text-white"
          : "shrink-0 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-300"
      }
    >
      {children}
    </button>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={null}>
      <CandidatesPageInner />
    </Suspense>
  );
}

function CandidatesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const stage = searchParams.get("stage") ?? "";
  const position = searchParams.get("position") ?? "";
  const branch = searchParams.get("branch") ?? "";
  const employmentType = searchParams.get("employmentType") ?? "";
  const experience = searchParams.get("experience") ?? "";

  const [searchInput, setSearchInput] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  // Sync the input when `q` changes externally (e.g. a nav link with
  // ?q=...) — adjusted during render per
  // https://react.dev/learn/you-might-not-need-an-effect
  if (q !== lastQ) {
    setLastQ(q);
    setSearchInput(q);
  }

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/candidates?${params.toString()}`);
  }

  function toggleParam(key: string, value: string) {
    setParam(key, searchParams.get(key) === value ? "" : value);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== q) setParam("q", searchInput);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const apiUrl = `/api/candidates?${searchParams.toString()}`;
  const { data: candidates, loading, setData } = useApiData<Candidate[]>(apiUrl);

  const { busyId, moveToFuture, reject, startInterview } = useCandidateActions((id, patch) => {
    setData((prev) => (prev ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)));
  });

  const hasFilters = Boolean(q || stage || position || branch || employmentType || experience);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Candidates</h1>
          <p className="text-sm text-stone-500">{candidates ? `${candidates.length} people` : "Loading…"}</p>
        </div>
      </div>

      <div className="relative">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or phone number…"
          className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
        />
      </div>

      {stage && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">Filtered by:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-white">
            {STAGE_LABELS[stage as Stage] ?? stage}
            <button onClick={() => setParam("stage", "")} aria-label="Clear stage filter">
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
          <SlidersHorizontal size={13} /> Filters
          {hasFilters && (
            <button
              onClick={() => router.push("/candidates")}
              className="ml-auto text-orange-600 hover:text-orange-700"
            >
              Clear all
            </button>
          )}
        </div>
        <FilterGroup label="Position">
          {POSITIONS.map((p) => (
            <Chip key={p} active={position === p} onClick={() => toggleParam("position", p)}>
              {POSITION_LABELS[p]}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup label="Branch">
          {BRANCHES.filter((b) => b !== "ANY_BRANCH").map((b) => (
            <Chip key={b} active={branch === b} onClick={() => toggleParam("branch", b)}>
              {BRANCH_LABELS[b]}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup label="Type">
          {EMPLOYMENT_TYPES.map((e) => (
            <Chip key={e} active={employmentType === e} onClick={() => toggleParam("employmentType", e)}>
              {EMPLOYMENT_TYPE_LABELS[e]}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup label="Experience">
          <Chip active={experience === "EXPERIENCED"} onClick={() => toggleParam("experience", "EXPERIENCED")}>
            Experienced
          </Chip>
          <Chip active={experience === "NO_EXPERIENCE"} onClick={() => toggleParam("experience", "NO_EXPERIENCE")}>
            No Experience
          </Chip>
        </FilterGroup>
        <FilterGroup label="Pool">
          <Chip active={stage === "FUTURE_TALENT"} onClick={() => toggleParam("stage", "FUTURE_TALENT")}>
            Future Candidate
          </Chip>
        </FilterGroup>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : candidates && candidates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {candidates.map((candidate) => (
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
        <EmptyState icon={Users} title="No candidates match" description="Try adjusting your search or filters." />
      )}
    </div>
  );
}
