"use client";

import { Check, CircleX, LoaderCircle, Star, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

type ApplicationAction = "shortlisted" | "accepted" | "rejected" | "withdrawn" | "cancelled" | "completed";

const actionIcon = {
  shortlisted: Star,
  accepted: Check,
  rejected: CircleX,
  withdrawn: Undo2,
  cancelled: CircleX,
  completed: Check,
} as const;

export function ApplicationActions({
  id,
  status,
  role,
  locale,
}: {
  id: string;
  status: string;
  role: "professional" | "organization" | "admin";
  locale: Locale;
}) {
  const router = useRouter();
  const isArabic = locale === "ar";
  const [pending, setPending] = useState<ApplicationAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions: Array<{ status: ApplicationAction; label: string; variant: "primary" | "secondary" | "danger" }> = role === "professional"
    ? ["applied", "shortlisted"].includes(status)
      ? [{ status: "withdrawn", label: isArabic ? "سحب الطلب" : "Withdraw", variant: "secondary" }]
      : []
    : status === "applied"
      ? [
          { status: "shortlisted", label: isArabic ? "قائمة مختصرة" : "Shortlist", variant: "secondary" },
          { status: "accepted", label: isArabic ? "قبول" : "Accept", variant: "primary" },
          { status: "rejected", label: isArabic ? "اعتذار" : "Decline", variant: "secondary" },
        ]
      : status === "shortlisted"
        ? [
            { status: "accepted", label: isArabic ? "قبول" : "Accept", variant: "primary" },
            { status: "rejected", label: isArabic ? "اعتذار" : "Decline", variant: "secondary" },
          ]
        : status === "accepted"
          ? [
              { status: "completed", label: isArabic ? "تمت المناوبة" : "Mark complete", variant: "primary" },
              { status: "cancelled", label: isArabic ? "إلغاء" : "Cancel", variant: "danger" },
            ]
          : [];

  async function update(nextStatus: ApplicationAction) {
    setPending(nextStatus);
    setError(null);
    try {
      const response = await fetch(`/api/v1/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await response.json().catch(() => null) as { error?: { code?: string } } | null;
      if (!response.ok) {
        setError(payload?.error?.code === "INVALID_TRANSITION"
          ? isArabic ? "تعذّر الانتقال لهذه الحالة أو اكتمل عدد المقبولين." : "This status is unavailable or the shift is already full."
          : isArabic ? "تعذر تحديث الطلب. حاول مرة أخرى." : "We could not update the application. Try again.");
        return;
      }
      router.refresh();
    } catch {
      setError(isArabic ? "تعذر الاتصال بالخدمة." : "Could not connect to the service.");
    } finally {
      setPending(null);
    }
  }

  if (!actions.length) return null;
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = actionIcon[action.status];
          return (
            <Button key={action.status} type="button" size="sm" variant={action.variant} disabled={Boolean(pending)} onClick={() => update(action.status)}>
              {pending === action.status ? <LoaderCircle className="size-4 animate-spin" /> : <Icon className="size-4" />}
              {action.label}
            </Button>
          );
        })}
      </div>
      {error && <p role="alert" className="mt-3 text-xs font-bold text-red-700">{error}</p>}
    </div>
  );
}
