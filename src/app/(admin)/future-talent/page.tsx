"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { CandidateCard } from "@/components/CandidateCard";
import { EmptyState } from "@/components/EmptyState";
import { useApiData } from "@/lib/use-api";
import { useCandidateActions } from "@/lib/use-candidate-actions";
import type { CandidateWithExtras } from "@/types";

interface TagCount {
  id: string;
  name: string;
  count: number;
}

export default function FutureTalentPage() {
  const { data: candidates, loading, setData } = useApiData<CandidateWithExtras[]>("/api/candidates?stage=FUTURE_TALENT");
  const { data: allTags } = useApiData<TagCount[]>("/api/tags");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const { busyId, reject, startInterview } = useCandidateActions((id, patch) => {
    setData((prev) => (prev ?? []).filter((c) => !(c.id === id && patch.stage && patch.stage !== "FUTURE_TALENT")));
  });

  function toggleTag(name: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const filtered = useMemo(() => {
    if (!candidates) return [];
    if (selectedTags.size === 0) return candidates;
    return candidates.filter((c) => [...selectedTags].every((t) => c.tags.some((ct) => ct.name === t)));
  }, [candidates, selectedTags]);

  const relevantTags = (allTags ?? []).filter((t) => t.count > 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Future Talent</h1>
        <p className="text-sm text-stone-500">Great people saved for when the right role opens up.</p>
      </div>

      {relevantTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-stone-200 bg-white p-4">
          {relevantTags.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTag(t.name)}
              className={
                selectedTags.has(t.name)
                  ? "rounded-full bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-300"
              }
            >
              {t.name} <span className="opacity-60">· {t.count}</span>
            </button>
          ))}
          {selectedTags.size > 0 && (
            <button
              onClick={() => setSelectedTags(new Set())}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              busy={busyId === candidate.id}
              onInterview={() => startInterview(candidate)}
              onReject={() => reject(candidate)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Star}
          title="No future talent saved yet"
          description="When you meet someone great but have no open role, move them here instead of losing them."
        />
      )}
    </div>
  );
}
