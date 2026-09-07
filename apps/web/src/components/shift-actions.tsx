"use client";

import { CheckCircle2, LoaderCircle, Play, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

type NextStatus = "published" | "filled" | "cancelled" | "completed";

export function ShiftActions({ id, status, locale, canPublish, applicationCount }: { id: string; status: string; locale: Locale; canPublish: boolean; applicationCount: number }) {
  const isArabic = locale === "ar";
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions: Array<{ status: NextStatus; label: string; icon: typeof Play; variant: "primary" | "secondary" | "danger" }> = status === "draft"
    ? [
        { status: "published", label: isArabic ? "نشر" : "Publish", icon: Play, variant: "primary" },
        { status: "cancelled", label: isArabic ? "إلغاء" : "Cancel", icon: XCircle, variant: "secondary" },
      ]
    : status === "published"
      ? [
          { status: "filled", label: isArabic ? "اكتمل العدد" : "Mark filled", icon: CheckCircle2, variant: "secondary" },
          { status: "completed", label: isArabic ? "إكمال" : "Complete", icon: CheckCircle2, variant: "primary" },
          { status: "cancelled", label: isArabic ? "إلغاء" : "Cancel", icon: XCircle, variant: "danger" },
        ]
      : status === "filled"
        ? [
            { status: "completed", label: isArabic ? "إكمال" : "Complete", icon: CheckCircle2, variant: "primary" },
            { status: "cancelled", label: isArabic ? "إلغاء" : "Cancel", icon: XCircle, variant: "danger" },
          ]
        : [];

  async function update(nextStatus: NextStatus) {
    setPending(nextStatus);
    setError(null);
    const response = await fetch(`/api/v1/shifts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) }).catch(() => null);
    setPending(null);
    if (!response?.ok) {
      const payload = await response?.json().catch(() => null) as { error?: { code?: string } } | undefined;
      setError(payload?.error?.code === "ORGANIZATION_NOT_ACTIVE" ? (isArabic ? "يلزم اعتماد المنشأة والحساب قبل النشر." : "The organization and account must be verified before publishing.") : (isArabic ? "تعذر تحديث المناوبة." : "The shift could not be updated."));
      return;
    }
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(isArabic ? "حذف المناوبة نهائيًا؟" : "Permanently delete this shift?")) return;
    setPending("delete");
    setError(null);
    const response = await fetch(`/api/v1/shifts/${id}`, { method: "DELETE" }).catch(() => null);
    setPending(null);
    if (!response?.ok) {
      setError(isArabic ? "لا يمكن حذف مناوبة مرتبطة بطلبات." : "A shift linked to applications cannot be deleted.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid justify-items-start gap-3 md:justify-items-end">
      <p className="text-xs font-bold text-slate-500">{isArabic ? `${applicationCount} طلب` : `${applicationCount} application${applicationCount === 1 ? "" : "s"}`}</p>
      <div className="flex flex-wrap gap-2 md:justify-end">
        {actions.map((action) => <Button key={action.status} type="button" size="sm" variant={action.variant} disabled={Boolean(pending) || (action.status === "published" && !canPublish)} onClick={() => update(action.status)}>{pending === action.status ? <LoaderCircle className="size-4 animate-spin" /> : <action.icon className="size-4" />}{action.label}</Button>)}
        {["draft", "cancelled"].includes(status) && applicationCount === 0 && <Button type="button" size="icon" variant="ghost" disabled={Boolean(pending)} onClick={remove} aria-label={isArabic ? "حذف المناوبة" : "Delete shift"}>{pending === "delete" ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4 text-red-600" />}</Button>}
      </div>
      {status === "draft" && !canPublish && <p className="max-w-64 text-xs leading-5 text-amber-700">{isArabic ? "ستتاح خاصية النشر بعد اعتماد المنشأة." : "Publishing unlocks after organization approval."}</p>}
      {error && <p role="alert" className="max-w-64 text-xs font-bold text-red-700">{error}</p>}
    </div>
  );
}
