"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, RefreshCw } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { resendSignupConfirmation, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

const COOLDOWN_SECONDS = 45;

export function ResendConfirmationForm({ locale }: { locale: Locale }) {
  const isArabic = locale === "ar";
  const [state, action, pending] = useActionState(
    resendSignupConfirmation,
    { status: "idle" } satisfies AuthState,
  );
  const [seconds, setSeconds] = useState(COOLDOWN_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  return (
    <form action={action} className="mt-7" onSubmit={() => setSeconds(COOLDOWN_SECONDS)}>
      <input type="hidden" name="locale" value={locale} />
      <Button type="submit" variant="secondary" className="w-full" disabled={pending || seconds > 0}>
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
        {pending
          ? isArabic ? "جارٍ الإرسال..." : "Sending..."
          : seconds > 0
            ? isArabic ? `إعادة الإرسال بعد ${seconds} ث` : `Resend in ${seconds}s`
            : isArabic ? "إعادة إرسال رابط التحقق" : "Resend verification link"}
      </Button>
      {state.message && (
        <div role={state.status === "error" ? "alert" : "status"} className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-xs leading-6 ${state.status === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>
          {state.status === "error" ? <AlertCircle className="mt-1 size-4 shrink-0" /> : <CheckCircle2 className="mt-1 size-4 shrink-0" />}
          {state.message}
        </div>
      )}
    </form>
  );
}
