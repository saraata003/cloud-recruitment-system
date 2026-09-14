import { NextResponse } from "next/server";
import { submitApplication } from "@/lib/application-service";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { applicationFieldsSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const raw: Record<string, unknown> = {};
    for (const key of [
      "fullName",
      "phone",
      "location",
      "dateOfBirth",
      "age",
      "position",
      "otherPositionText",
      "preferredBranch",
      "employmentType",
      "university",
      "major",
      "previousExperience",
      "lastJob",
      "yearsOfExperience",
      "availableFrom",
      "hasTransportation",
      "applicantNotes",
    ]) {
      const value = formData.get(key);
      if (value !== null) raw[key] = value;
    }

    const fields = applicationFieldsSchema.parse(raw);

    const photo = formData.get("photo");
    const cv = formData.get("cv");

    if (!(photo instanceof File) || photo.size === 0) {
      return jsonError("A photo is required.", 422);
    }

    const result = await submitApplication(fields, photo, cv instanceof File && cv.size > 0 ? cv : null);

    return NextResponse.json({ success: true, id: result.candidate.id }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
