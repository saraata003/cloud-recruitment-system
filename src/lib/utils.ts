import { clsx, type ClassValue } from "clsx";
import { DEFAULT_COUNTRY_CODE } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Normalizes a phone number for duplicate matching: strips everything but
 * digits, drops a leading international "00", and folds a missing/extra
 * leading country code so "0791234567", "791234567" and "+962791234567"
 * all normalize to the same key.
 */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    digits = digits.slice(DEFAULT_COUNTRY_CODE.length);
  }
  digits = digits.replace(/^0+/, "");
  return `${DEFAULT_COUNTRY_CODE}${digits}`;
}

/** Formats a phone number into a wa.me-compatible international digit string. */
export function toWhatsAppDigits(raw: string): string {
  return normalizePhone(raw);
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = toWhatsAppDigits(phone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_PALETTE = [
  { bg: "#DCEEE8", fg: "#0F6B52" },
  { bg: "#FDE7D8", fg: "#B4530F" },
  { bg: "#E4E3FB", fg: "#4B3FBF" },
  { bg: "#FCE4EC", fg: "#AD1457" },
  { bg: "#E1F0FD", fg: "#0E6BA8" },
  { bg: "#FFF3CD", fg: "#8A6D00" },
  { bg: "#E7F6E7", fg: "#2E7D32" },
  { bg: "#F3E5F5", fg: "#6A1B9A" },
];

export function getAvatarColors(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}

/** Computes age in whole years from an ISO date-of-birth string. */
export function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function getDisplayAge(candidate: { age: number | null; dateOfBirth: string | null }): number | null {
  const fromDob = calculateAge(candidate.dateOfBirth);
  return fromDob ?? candidate.age ?? null;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function isToday(value: string | Date | null | undefined): boolean {
  if (!value) return false;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function formatYearsOfExperience(years: number | null | undefined): string {
  if (years === null || years === undefined) return "No experience listed";
  if (years === 0) return "No experience";
  if (years < 1) return "Less than a year";
  if (years === 1) return "1 year";
  return `${years} years`;
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
