"use client";

import { Download, UserCheck } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { LinkButton } from "@/components/Button";
import { useApiData } from "@/lib/use-api";
import {
  BRANCH_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  POSITION_LABELS,
  type Branch,
  type EmploymentType,
  type Position,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Candidate } from "@/db/schema";

function exportEmployeeData(c: Candidate) {
  const payload = {
    fullName: c.fullName,
    phone: c.phone,
    photoUrl: c.photoUrl,
    cvUrl: c.cvUrl,
    position: c.position === "OTHER" && c.otherPositionText ? c.otherPositionText : POSITION_LABELS[c.position as Position],
    branch: BRANCH_LABELS[c.preferredBranch as Branch],
    employmentType: EMPLOYMENT_TYPE_LABELS[c.employmentType as EmploymentType],
    location: c.location,
    dateOfBirth: c.dateOfBirth,
    age: c.age,
    hiredAt: c.hiredAt,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${c.fullName.replace(/\s+/g, "-").toLowerCase()}-employee-profile.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function HiredPage() {
  const { data: hired, loading } = useApiData<Candidate[]>("/api/candidates?stage=HIRED");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Hired</h1>
        <p className="text-sm text-stone-500">Everyone hired through DRINKAT Recruitment — ready to hand off to HR.</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : hired && hired.length > 0 ? (
        <div className="flex flex-col gap-3">
          {hired.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar src={c.photoUrl} name={c.fullName} size="lg" />
                <div>
                  <p className="font-semibold text-stone-900">{c.fullName}</p>
                  <p className="text-sm text-stone-500">
                    {c.position === "OTHER" && c.otherPositionText ? c.otherPositionText : POSITION_LABELS[c.position as Position]} ·{" "}
                    {BRANCH_LABELS[c.preferredBranch as Branch]}
                  </p>
                  <p className="text-xs text-stone-400">
                    Hired {formatDate(c.hiredAt ?? c.updatedAt)} · {c.phone}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <LinkButton href={`/candidates/${c.id}`} variant="outline" size="sm">
                  View Profile
                </LinkButton>
                <button
                  onClick={() => exportEmployeeData(c)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-3.5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200"
                >
                  <Download size={14} /> Export
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UserCheck}
          title="No hires yet"
          description="Candidates you mark as Hired will show up here, with their data ready to hand off to DRINKAT HR."
        />
      )}
    </div>
  );
}
