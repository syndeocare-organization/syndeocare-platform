"use client";

import { CheckCheck, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

export function MarkNotificationsReadButton({ locale, disabled }: { locale: Locale; disabled: boolean }) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  const isArabic = locale === "ar";

  async function markAllRead() {
    setPending(true);
    setFailed(false);
    try {
      const response = await fetch("/api/v1/notifications", { method: "PATCH" });
      if (!response.ok) throw new Error("request_failed");
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="text-end">
      <Button type="button" variant="secondary" size="sm" disabled={disabled || pending} onClick={markAllRead}>
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <CheckCheck className="size-4" aria-hidden="true" />}
        {pending ? (isArabic ? "جارٍ التحديث" : "Updating") : (isArabic ? "تحديد الكل كمقروء" : "Mark all as read")}
      </Button>
      {failed && <p role="alert" className="mt-2 text-xs text-red-700">{isArabic ? "تعذر تحديث الإشعارات." : "Notifications could not be updated."}</p>}
    </div>
  );
}
