"use client";

import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, KeyRound, LoaderCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, updatePassword, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { localePath, type Locale } from "@/lib/i18n";

export function PasswordRecoveryForm({ locale, mode }: { locale: Locale; mode: "request" | "update" }) {
  const isArabic = locale === "ar";
  const action = mode === "request" ? requestPasswordReset : updatePassword;
  const [state, formAction, pending] = useActionState(action, { status: "idle" } satisfies AuthState);
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <input type="hidden" name="locale" value={locale} />

      {mode === "request" ? (
        <div>
          <Label htmlFor="email">{isArabic ? "البريد الإلكتروني" : "Email address"}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute start-4 top-3.5 size-5 text-slate-400" aria-hidden="true" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              dir="ltr"
              className="ps-12 text-start"
              aria-invalid={Boolean(state.fieldErrors?.email)}
              aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
              required
            />
          </div>
          <FieldError id="email-error">{state.fieldErrors?.email?.[0]}</FieldError>
        </div>
      ) : (
        <>
          <div>
            <Label htmlFor="password">{isArabic ? "كلمة المرور الجديدة" : "New password"}</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute start-4 top-3.5 size-5 text-slate-400" aria-hidden="true" />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={10}
                className="ps-12"
                aria-invalid={Boolean(state.fieldErrors?.password)}
                aria-describedby="password-help password-error"
                required
              />
            </div>
            <p id="password-help" className="mt-2 text-xs text-slate-500">
              {isArabic ? "10 أحرف على الأقل، وتتضمن حرفًا ورقمًا." : "At least 10 characters, including a letter and a number."}
            </p>
            <FieldError id="password-error">{state.fieldErrors?.password?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="confirmPassword">{isArabic ? "تأكيد كلمة المرور" : "Confirm password"}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={10}
              aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
              aria-describedby={state.fieldErrors?.confirmPassword ? "confirm-password-error" : undefined}
              required
            />
            <FieldError id="confirm-password-error">{state.fieldErrors?.confirmPassword?.[0]}</FieldError>
          </div>
        </>
      )}

      {state.message && (
        <div
          role={state.status === "error" ? "alert" : "status"}
          className={`flex items-start gap-3 rounded-xl p-4 text-sm leading-6 ${state.status === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}
        >
          {state.status === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
          {state.message}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending || state.status === "success"}>
        {pending ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <Arrow className="size-4" aria-hidden="true" />}
        {pending
          ? (isArabic ? "جارٍ التنفيذ..." : "Working...")
          : mode === "request"
            ? (isArabic ? "إرسال رابط الاستعادة" : "Send recovery link")
            : (isArabic ? "حفظ كلمة المرور" : "Save new password")}
      </Button>

      <Link className="text-center text-sm font-black text-brand-700 hover:text-brand-900" href={localePath(locale, "/auth/login")}>
        {isArabic ? "العودة إلى تسجيل الدخول" : "Back to sign in"}
      </Link>
    </form>
  );
}
