import type { Locale } from "@/lib/i18n";

const shiftLabels = {
  draft: ["مسودة", "Draft"],
  published: ["منشورة", "Published"],
  filled: ["اكتمل العدد", "Filled"],
  cancelled: ["ملغاة", "Cancelled"],
  completed: ["مكتملة", "Completed"],
} as const;

const applicationLabels = {
  applied: ["تم التقديم", "Applied"],
  shortlisted: ["في القائمة المختصرة", "Shortlisted"],
  accepted: ["مقبول", "Accepted"],
  rejected: ["غير مقبول", "Not selected"],
  withdrawn: ["تم السحب", "Withdrawn"],
  cancelled: ["ملغي", "Cancelled"],
  completed: ["مكتمل", "Completed"],
} as const;

function localizedLabel(labels: readonly [string, string] | undefined, fallback: string, locale: Locale) {
  return labels?.[locale === "ar" ? 0 : 1] ?? fallback;
}

export function shiftStatusLabel(status: string, locale: Locale) {
  return localizedLabel(shiftLabels[status as keyof typeof shiftLabels], status, locale);
}

export function applicationStatusLabel(status: string, locale: Locale) {
  return localizedLabel(applicationLabels[status as keyof typeof applicationLabels], status, locale);
}

export function applicationStatusTone(status: string) {
  if (["accepted", "completed"].includes(status)) return "bg-emerald-50 text-emerald-700";
  if (["rejected", "cancelled", "withdrawn"].includes(status)) return "bg-slate-100 text-slate-600";
  if (status === "shortlisted") return "bg-violet-50 text-violet-700";
  return "bg-brand-50 text-brand-700";
}
