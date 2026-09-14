import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { handleApiError } from "@/lib/api-helpers";
import type { DashboardStats } from "@/types";

export async function GET() {
  try {
    const rows = await db.select({ stage: candidates.stage }).from(candidates);

    const stats: DashboardStats = {
      totalApplicants: rows.length,
      newApplicants: rows.filter((r) => r.stage === "NEW").length,
      interviews: rows.filter((r) => r.stage === "INTERVIEW").length,
      shortlisted: rows.filter((r) => r.stage === "SHORTLISTED").length,
      futureCandidates: rows.filter((r) => r.stage === "FUTURE_TALENT").length,
      hired: rows.filter((r) => r.stage === "HIRED").length,
    };

    return NextResponse.json(stats);
  } catch (err) {
    return handleApiError(err);
  }
}
