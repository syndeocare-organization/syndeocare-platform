"use client";

import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

export function ApplyButton({ locale, shiftId, existingStatus }: { locale: Locale; shiftId: string; existingStatus: string | null }) {
  const [status, setStatus] = useState(existingStatus);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const isArabic = locale === "ar";

  async function apply() {
    setPending(true);
    setFailed(false);
    try {
      const response = await fetch("/api/v1/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shiftId }) });
      if (response.ok) setStatus("applied");
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  if (status) return <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-50 px-4 text-xs font-black text-emerald-700"><CheckCircle2 className="size-4" />{isArabic ? "تم التقديم" : "Applied"}</span>;
  return <div className="text-end"><Button type="button" size="sm" onClick={apply} disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}{pending ? (isArabic ? "جارٍ التقديم" : "Applying") : (isArabic ? "تقديم" : "Apply")}</Button>{failed && <p role="alert" className="mt-2 max-w-48 text-xs text-red-700">{isArabic ? "تعذر التقديم. حاول مجددًا." : "Could not apply. Try again."}</p>}</div>;
}
