"use client";

import Link from "next/link";
import { MapPin, GraduationCap, Phone, Clock } from "lucide-react";
import { Avatar } from "./Avatar";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./Button";
import {
  BRANCH_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  POSITION_LABELS,
  type Branch,
  type EmploymentType,
  type Position,
} from "@/lib/constants";
import { formatYearsOfExperience, getDisplayAge } from "@/lib/utils";
import type { Candidate } from "@/db/schema";

export function CandidateCard({
  candidate,
  onInterview,
  onFuture,
  onReject,
  busy,
  showStage = true,
}: {
  candidate: Candidate;
  onInterview?: () => void;
  onFuture?: () => void;
  onReject?: () => void;
  busy?: boolean;
  showStage?: boolean;
}) {
  const age = getDisplayAge(candidate);
  const position =
    candidate.position === "OTHER" && candidate.otherPositionText
      ? candidate.otherPositionText
      : POSITION_LABELS[candidate.position as Position];
  const showDuplicateFlag = candidate.isDuplicate && !candidate.duplicateAlertSeen;
  const hasActions = onInterview || onFuture || onReject;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {showDuplicateFlag && (
        <span className="absolute -top-2 -right-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
          Duplicate
        </span>
      )}
      <Link href={`/candidates/${candidate.id}`} className="flex items-start gap-3">
        <Avatar src={candidate.photoUrl} name={candidate.fullName} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-stone-900">{candidate.fullName}</h3>
          <p className="text-sm text-stone-500">
            {position}
            {age ? ` · ${age} yrs` : ""}
          </p>
          {showStage && (
            <div className="mt-1.5">
              <StatusBadge stage={candidate.stage} />
            </div>
          )}
        </div>
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-stone-600">
        <div className="flex items-center gap-1.5 truncate" title={candidate.location}>
          <MapPin size={13} className="shrink-0 text-stone-400" />
          <span className="truncate">{candidate.location}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <GraduationCap size={13} className="shrink-0 text-stone-400" />
          <span className="truncate">{EMPLOYMENT_TYPE_LABELS[candidate.employmentType as EmploymentType]}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <Clock size={13} className="shrink-0 text-stone-400" />
          <span className="truncate">{formatYearsOfExperience(candidate.yearsOfExperience)}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <Phone size={13} className="shrink-0 text-stone-400" />
          <span className="truncate">{candidate.phone}</span>
        </div>
      </div>

      <div className="mt-2 text-xs text-stone-500">
        Prefers <span className="font-medium text-stone-700">{BRANCH_LABELS[candidate.preferredBranch as Branch]}</span>
      </div>

      <div className="mt-3 flex flex-col gap-1.5 border-t border-stone-100 pt-3">
        <Link href={`/candidates/${candidate.id}`}>
          <Button variant="outline" size="sm" full>
            View
          </Button>
        </Link>
        {hasActions && (
          <div className="grid grid-cols-3 gap-1.5">
            <Button variant="subtle" size="sm" onClick={onInterview} disabled={!onInterview || busy}>
              Interview
            </Button>
            <Button variant="subtle" size="sm" onClick={onFuture} disabled={!onFuture || busy}>
              Future
            </Button>
            <Button variant="danger" size="sm" onClick={onReject} disabled={!onReject || busy}>
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
