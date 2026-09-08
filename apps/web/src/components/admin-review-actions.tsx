"use client";

import { Check, LoaderCircle, ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

export function AdminReviewActions({ resource, id, locale, allowSuspend = false }: { resource: "profile" | "organization" | "document"; id: string; locale: Locale; allowSuspend?: boolean }) {
  const isArabic = locale === "ar";
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState(false);
  async function review(decision: "approve" | "reject" | "suspend") {
    const rejecting = decision !== "approve";
    const note = rejecting ? window.prompt(isArabic ? "اكتب سببًا واضحًا يظهر للمستخدم:" : "Add a clear reason for the user:") : undefined;
    if (rejecting && !note) return;
    setPending(decision);
    setError(false);
    const response = await fetch("/api/v1/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource, id, decision, note }) }).catch(() => null);
    setPending(null);
    if (!response?.ok) { setError(true); return; }
    router.refresh();
  }
  return <div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" onClick={() => review("approve")} disabled={Boolean(pending)}>{pending === "approve" ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}{isArabic ? "اعتماد" : "Approve"}</Button><Button type="button" size="sm" variant="secondary" onClick={() => review(allowSuspend ? "suspend" : "reject")} disabled={Boolean(pending)}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldX className="size-4" />}{allowSuspend ? (isArabic ? "تعليق" : "Suspend") : (isArabic ? "طلب تحديث" : "Request update")}</Button></div>{error && <p role="alert" className="mt-2 text-xs font-bold text-red-700">{isArabic ? "تعذر حفظ القرار." : "The decision could not be saved."}</p>}</div>;
}
