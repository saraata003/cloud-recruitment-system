"use client";

import { useRef, useState } from "react";
import { Camera, Check, Coffee, Loader2, RotateCcw, TriangleAlert, X } from "lucide-react";
import { Field, inputClass, PillOptions, ToggleYesNo } from "@/components/FormField";
import { Button } from "@/components/Button";
import {
  BRANCHES,
  BRANCH_LABELS,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  POSITIONS,
  POSITION_LABELS,
  type Branch,
  type EmploymentType,
  type Position,
} from "@/lib/constants";
import { api, ApiError } from "@/lib/api-client";

interface FormState {
  fullName: string;
  phone: string;
  location: string;
  dobMode: "date" | "age";
  dateOfBirth: string;
  age: string;
  position: Position | "";
  otherPositionText: string;
  preferredBranch: Branch | "";
  employmentType: EmploymentType | "";
  university: string;
  major: string;
  previousExperience: string;
  lastJob: string;
  yearsOfExperience: string;
  availableFrom: string;
  hasTransportation: boolean;
  applicantNotes: string;
}

const initialState: FormState = {
  fullName: "",
  phone: "",
  location: "",
  dobMode: "date",
  dateOfBirth: "",
  age: "",
  position: "",
  otherPositionText: "",
  preferredBranch: "",
  employmentType: "",
  university: "",
  major: "",
  previousExperience: "",
  lastJob: "",
  yearsOfExperience: "",
  availableFrom: "",
  hasTransportation: false,
  applicantNotes: "",
};

const POSITION_OPTIONS = POSITIONS.map((value) => ({ value, label: POSITION_LABELS[value] }));
const BRANCH_OPTIONS = BRANCHES.map((value) => ({ value, label: BRANCH_LABELS[value] }));
const EMPLOYMENT_OPTIONS = EMPLOYMENT_TYPES.map((value) => ({ value, label: EMPLOYMENT_TYPE_LABELS[value] }));

export default function ApplyPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handlePhotoChange(file: File | null) {
    setPhoto(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!photo) next.photo = "Please add a photo of yourself";
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 7) next.phone = "A valid phone number is required";
    if (!form.location.trim()) next.location = "Please tell us where you live";
    if (!form.position) next.position = "Please choose a position";
    if (form.position === "OTHER" && !form.otherPositionText.trim()) next.otherPositionText = "Please describe the role";
    if (!form.preferredBranch) next.preferredBranch = "Please choose a branch";
    if (!form.employmentType) next.employmentType = "Please choose one";
    if (form.employmentType === "STUDENT" && !form.university.trim()) next.university = "Please add your university";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) {
      document.getElementById("form-top")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const data = new FormData();
    data.append("fullName", form.fullName.trim());
    data.append("phone", form.phone.trim());
    data.append("location", form.location.trim());
    if (form.dobMode === "date" && form.dateOfBirth) data.append("dateOfBirth", form.dateOfBirth);
    if (form.dobMode === "age" && form.age) data.append("age", form.age);
    data.append("position", form.position);
    if (form.position === "OTHER") data.append("otherPositionText", form.otherPositionText.trim());
    data.append("preferredBranch", form.preferredBranch);
    data.append("employmentType", form.employmentType);
    if (form.employmentType === "STUDENT") {
      if (form.university) data.append("university", form.university.trim());
      if (form.major) data.append("major", form.major.trim());
    }
    if (form.previousExperience) data.append("previousExperience", form.previousExperience.trim());
    if (form.lastJob) data.append("lastJob", form.lastJob.trim());
    if (form.yearsOfExperience) data.append("yearsOfExperience", form.yearsOfExperience);
    if (form.availableFrom) data.append("availableFrom", form.availableFrom.trim());
    data.append("hasTransportation", String(form.hasTransportation));
    if (form.applicantNotes) data.append("applicantNotes", form.applicantNotes.trim());
    if (photo) data.append("photo", photo);
    if (cv) data.append("cv", cv);

    setSubmitting(true);
    try {
      await api.postForm("/api/applications", data);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm(initialState);
    handlePhotoChange(null);
    setCv(null);
    setErrors({});
    setSubmitError(null);
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check size={30} strokeWidth={2.5} />
          </div>
          <h1 className="mt-5 text-xl font-bold text-stone-900">Application received!</h1>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-stone-600">
            Thank you for applying to DRINKAT. We&apos;ll reach out to you if you&apos;re selected for an interview.
          </p>
          <button
            onClick={resetForm}
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            <RotateCcw size={15} />
            Submit another application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      <div id="form-top" className="bg-white border-b border-stone-200">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-2 px-4 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-sm shadow-orange-600/20">
            <Coffee size={24} />
          </span>
          <h1 className="text-xl font-bold text-stone-900">Join the DRINKAT team</h1>
          <p className="text-sm text-stone-500">Takes about 3 minutes. No account needed.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-lg flex-col gap-5 px-4">
        {submitError && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            {submitError}
          </div>
        )}

        {/* Photo */}
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white p-6">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-stone-300 bg-stone-50 text-stone-400 hover:border-orange-400 hover:text-orange-500"
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Your photo" className="h-full w-full object-cover" />
            ) : (
              <Camera size={28} />
            )}
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
          />
          <p className="text-sm font-semibold text-stone-800">
            {photoPreview ? "Looking good!" : "Add your photo"} <span className="text-orange-600">*</span>
          </p>
          <p className="text-center text-xs text-stone-500">A clear face photo helps us remember you at your interview.</p>
          {errors.photo && <p className="text-xs font-medium text-rose-600">{errors.photo}</p>}
        </div>

        {/* Basic info */}
        <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5">
          <Field label="Full name" required error={errors.fullName}>
            <input
              className={inputClass}
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="e.g. Sara Al-Amin"
            />
          </Field>
          <Field label="Mobile / WhatsApp number" required error={errors.phone}>
            <input
              className={inputClass}
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="e.g. 079 123 4567"
            />
          </Field>
          <Field label="Where do you live?" required error={errors.location}>
            <input
              className={inputClass}
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. Marka, Amman"
            />
          </Field>

          <Field label="Age or date of birth">
            <div className="mb-2 flex gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => update("dobMode", "date")}
                className={form.dobMode === "date" ? "font-semibold text-orange-600 underline" : "text-stone-500"}
              >
                Date of birth
              </button>
              <span className="text-stone-300">·</span>
              <button
                type="button"
                onClick={() => update("dobMode", "age")}
                className={form.dobMode === "age" ? "font-semibold text-orange-600 underline" : "text-stone-500"}
              >
                Just my age
              </button>
            </div>
            {form.dobMode === "date" ? (
              <input
                className={inputClass}
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
            ) : (
              <input
                className={inputClass}
                type="number"
                inputMode="numeric"
                min={14}
                max={80}
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
                placeholder="e.g. 22"
              />
            )}
          </Field>
        </div>

        {/* Role */}
        <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5">
          <Field label="Position you're applying for" required error={errors.position}>
            <PillOptions options={POSITION_OPTIONS} value={form.position} onChange={(v) => update("position", v)} columns={2} />
          </Field>
          {form.position === "OTHER" && (
            <Field label="Please describe the role" required error={errors.otherPositionText}>
              <input
                className={inputClass}
                value={form.otherPositionText}
                onChange={(e) => update("otherPositionText", e.target.value)}
                placeholder="e.g. Delivery driver"
              />
            </Field>
          )}
          <Field label="Preferred branch" required error={errors.preferredBranch}>
            <PillOptions
              options={BRANCH_OPTIONS}
              value={form.preferredBranch}
              onChange={(v) => update("preferredBranch", v)}
              columns={2}
            />
          </Field>
        </div>

        {/* Availability */}
        <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5">
          <Field label="Are you a student or looking for freelance / full time work?" required error={errors.employmentType}>
            <PillOptions
              options={EMPLOYMENT_OPTIONS}
              value={form.employmentType}
              onChange={(v) => update("employmentType", v)}
              columns={3}
            />
          </Field>
          {form.employmentType === "STUDENT" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="University" required error={errors.university}>
                <input
                  className={inputClass}
                  value={form.university}
                  onChange={(e) => update("university", e.target.value)}
                  placeholder="e.g. Hashemite University"
                />
              </Field>
              <Field label="Major">
                <input
                  className={inputClass}
                  value={form.major}
                  onChange={(e) => update("major", e.target.value)}
                  placeholder="e.g. Business"
                />
              </Field>
            </div>
          )}
          <Field label="When can you start?">
            <input
              className={inputClass}
              value={form.availableFrom}
              onChange={(e) => update("availableFrom", e.target.value)}
              placeholder="e.g. Immediately, or a specific date"
            />
          </Field>
          <Field label="Do you have your own transportation?">
            <ToggleYesNo value={form.hasTransportation} onChange={(v) => update("hasTransportation", v)} />
          </Field>
        </div>

        {/* Experience */}
        <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5">
          <Field label="Previous experience">
            <textarea
              className={inputClass}
              rows={3}
              value={form.previousExperience}
              onChange={(e) => update("previousExperience", e.target.value)}
              placeholder="Tell us briefly about relevant experience"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Last place you worked">
              <input
                className={inputClass}
                value={form.lastJob}
                onChange={(e) => update("lastJob", e.target.value)}
                placeholder="e.g. Cafe Aroma"
              />
            </Field>
            <Field label="Years of experience">
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                min={0}
                step={0.5}
                value={form.yearsOfExperience}
                onChange={(e) => update("yearsOfExperience", e.target.value)}
                placeholder="e.g. 2"
              />
            </Field>
          </div>

          <Field label="Upload your CV" hint="PDF or a photo of your CV — optional but helpful">
            <div className="flex items-center gap-3">
              <input
                ref={cvInputRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(e) => setCv(e.target.files?.[0] ?? null)}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => cvInputRef.current?.click()}>
                Choose file
              </Button>
              {cv ? (
                <span className="flex items-center gap-1.5 truncate text-xs text-stone-600">
                  {cv.name}
                  <button type="button" onClick={() => setCv(null)} className="text-stone-400 hover:text-rose-600">
                    <X size={14} />
                  </button>
                </span>
              ) : (
                <span className="text-xs text-stone-400">No file selected</span>
              )}
            </div>
          </Field>

          <Field label="Anything else you'd like us to know?">
            <textarea
              className={inputClass}
              rows={2}
              value={form.applicantNotes}
              onChange={(e) => update("applicantNotes", e.target.value)}
              placeholder="Optional"
            />
          </Field>
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Submitting…
            </>
          ) : (
            "Submit application"
          )}
        </Button>
        <p className="pb-4 text-center text-xs text-stone-400">
          By submitting, you agree DRINKAT can contact you about this application.
        </p>
      </form>
    </div>
  );
}
