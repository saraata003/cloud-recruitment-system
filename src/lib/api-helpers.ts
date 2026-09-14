import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UploadError } from "./uploads";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return jsonError(err.issues.map((i) => i.message).join("; "), 422);
  }
  if (err instanceof UploadError) {
    return jsonError(err.message, 422);
  }
  console.error(err);
  return jsonError("Something went wrong. Please try again.", 500);
}
