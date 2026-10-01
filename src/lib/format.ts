export const jd = (n: number) => `${n.toFixed(3)} JD`;

export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("ar-JO", { hour: "numeric", minute: "2-digit" });

export const minutesLeft = (iso: string | null) =>
  iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 60_000)) : null;

export const STORE_LABEL: Record<string, string> = {
  open: "مفتوح",
  busy: "مشغول",
  very_busy: "مشغول جداً",
  paused: "متوقف مؤقتاً",
};

export const PAUSED_MESSAGE = "الطلبات متوقفة مؤقتاً، جرب بعد قليل.";
