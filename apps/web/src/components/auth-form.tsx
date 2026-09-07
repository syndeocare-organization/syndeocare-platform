"use client";

import { AlertCircle, ArrowLeft, ArrowRight, Building2, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Stethoscope, UserRound } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { localePath, type Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  mode: "login" | "register";
  defaultRole?: "professional" | "organization";
  next?: string;
};

export function AuthForm({ locale, mode, defaultRole = "professional", next }: Props) {
  const isArabic = locale === "ar";
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, { status: "idle" } satisfies AuthState);
  const [showPassword, setShowPassword] = useState(false);
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next ?? ""} />

      {mode === "register" && (
        <>
          <div>
            <Label htmlFor="fullName">{isArabic ? "الاسم الكامل" : "Full name"}</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute start-4 top-3.5 size-5 text-slate-400" aria-hidden="true" />
              <Input id="fullName" name="fullName" autoComplete="name" placeholder={isArabic ? "الاسم كما يظهر في الهوية" : "Name as shown on your ID"} className="ps-12" aria-invalid={Boolean(state.fieldErrors?.fullName)} aria-describedby={state.fieldErrors?.fullName ? "full-name-error" : undefined} required />
            </div>
            <FieldError id="full-name-error">{state.fieldErrors?.fullName?.[0]}</FieldError>
          </div>
          <div>
            <Label>{isArabic ? "نوع الحساب" : "Account type"}</Label>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-describedby={state.fieldErrors?.role ? "role-error" : undefined}>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:ring-4 has-[:checked]:ring-brand-600/10">
                <input type="radio" name="role" value="professional" defaultChecked={defaultRole === "professional"} className="size-4 accent-brand-700" />
                <Stethoscope className="size-5 text-brand-600" /><span className="text-sm font-black">{isArabic ? "مقدم رعاية" : "Care professional"}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition has-[:checked]:border-violet-500 has-[:checked]:bg-violet-500/5 has-[:checked]:ring-4 has-[:checked]:ring-violet-500/10">
                <input type="radio" name="role" value="organization" defaultChecked={defaultRole === "organization"} className="size-4 accent-violet-600" />
                <Building2 className="size-5 text-violet-600" /><span className="text-sm font-black">{isArabic ? "منشأة صحية" : "Healthcare organization"}</span>
              </label>
            </div>
            <FieldError id="role-error">{state.fieldErrors?.role?.[0]}</FieldError>
          </div>
        </>
      )}

      <div>
        <Label htmlFor="email">{isArabic ? "البريد الإلكتروني" : "Email address"}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute start-4 top-3.5 size-5 text-slate-400" aria-hidden="true" />
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" dir="ltr" placeholder="name@example.com" className="ps-12 text-start" aria-invalid={Boolean(state.fieldErrors?.email)} aria-describedby={state.fieldErrors?.email ? "email-error" : undefined} required />
        </div>
        <FieldError id="email-error">{state.fieldErrors?.email?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="password">{isArabic ? "كلمة المرور" : "Password"}</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute start-4 top-3.5 size-5 text-slate-400" aria-hidden="true" />
          <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 6 : 10} className="pe-12 ps-12" aria-invalid={Boolean(state.fieldErrors?.password)} aria-describedby={mode === "register" ? "password-help password-error" : state.fieldErrors?.password ? "password-error" : undefined} required />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute end-2 top-1.5 grid size-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15" aria-label={showPassword ? (isArabic ? "إخفاء كلمة المرور" : "Hide password") : (isArabic ? "إظهار كلمة المرور" : "Show password")}>
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {mode === "register" && <p id="password-help" className="mt-2 text-xs text-slate-500">{isArabic ? "10 أحرف على الأقل، وتتضمن حرفًا ورقمًا." : "At least 10 characters, including a letter and a number."}</p>}
        <FieldError id="password-error">{state.fieldErrors?.password?.[0]}</FieldError>
        {mode === "login" && (
          <div className="mt-1 text-end">
            <Link
              className="inline-flex min-h-11 items-center text-xs font-black text-brand-700 hover:text-brand-900"
              href={localePath(locale, "/auth/forgot-password")}
            >
              {isArabic ? "نسيت كلمة المرور؟" : "Forgot your password?"}
            </Link>
          </div>
        )}
      </div>

      {mode === "register" && (
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-600">
            <input id="acceptedTerms" name="acceptedTerms" type="checkbox" className="mt-1 size-4 accent-brand-700" aria-invalid={Boolean(state.fieldErrors?.acceptedTerms)} aria-describedby={state.fieldErrors?.acceptedTerms ? "terms-error" : undefined} required />
            <span>
              {isArabic ? "أوافق على شروط الاستخدام وسياسة الخصوصية." : "I agree to the Terms of Use and Privacy Policy."}{" "}
              <Link href={localePath(locale, "/terms")} className="font-bold text-brand-700 underline underline-offset-4">{isArabic ? "الشروط" : "Terms"}</Link>{" · "}<Link href={localePath(locale, "/privacy")} className="font-bold text-brand-700 underline underline-offset-4">{isArabic ? "الخصوصية" : "Privacy"}</Link>
            </span>
          </label>
          <FieldError id="terms-error">{state.fieldErrors?.acceptedTerms?.[0]}</FieldError>
        </div>
      )}

      {state.message && (
        <div role={state.status === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-xl p-4 text-sm leading-6 ${state.status === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>
          {state.status === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
          {state.message}
        </div>
      )}

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending || state.status === "success"}>
        {pending ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <Arrow className="size-4" aria-hidden="true" />}
        {pending
          ? (isArabic ? "جارٍ التنفيذ..." : "Working...")
          : mode === "login"
            ? (isArabic ? "دخول آمن" : "Sign in securely")
            : (isArabic ? "إنشاء الحساب" : "Create account")}
      </Button>
    </form>
  );
}
