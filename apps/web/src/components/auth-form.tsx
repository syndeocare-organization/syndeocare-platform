"use client";

import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
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
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <form action={formAction} className="mt-8 grid gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next ?? ""} />

      {mode === "register" && (
        <>
          <div>
            <Label htmlFor="fullName">{isArabic ? "الاسم الكامل" : "Full name"}</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute start-4 top-3.5 size-5 text-slate-400" aria-hidden="true" />
              <Input id="fullName" name="fullName" autoComplete="name" placeholder={isArabic ? "الاسم كما يظهر في الهوية" : "Name as shown on your ID"} className="ps-12" required />
            </div>
          </div>
          <div>
            <Label htmlFor="role">{isArabic ? "نوع الحساب" : "Account type"}</Label>
            <Select id="role" name="role" defaultValue={defaultRole}>
              <option value="professional">{isArabic ? "مقدم رعاية" : "Care professional"}</option>
              <option value="organization">{isArabic ? "منشأة صحية" : "Healthcare organization"}</option>
            </Select>
          </div>
        </>
      )}

      <div>
        <Label htmlFor="email">{isArabic ? "البريد الإلكتروني" : "Email address"}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute start-4 top-3.5 size-5 text-slate-400" aria-hidden="true" />
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" dir="ltr" placeholder="name@example.com" className="ps-12 text-start" required />
        </div>
      </div>

      <div>
        <Label htmlFor="password">{isArabic ? "كلمة المرور" : "Password"}</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute start-4 top-3.5 size-5 text-slate-400" aria-hidden="true" />
          <Input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 8 : 10} className="ps-12" required />
        </div>
        {mode === "register" && <p className="mt-2 text-xs text-slate-500">{isArabic ? "10 أحرف على الأقل." : "At least 10 characters."}</p>}
      </div>

      {mode === "register" && (
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-600">
          <input name="acceptedTerms" type="checkbox" className="mt-1 size-4 accent-brand-700" required />
          <span>
            {isArabic ? "أوافق على شروط الاستخدام وسياسة الخصوصية." : "I agree to the Terms of Use and Privacy Policy."}{" "}
            <Link href={localePath(locale, "/privacy")} className="font-bold text-brand-700 underline underline-offset-4">{isArabic ? "اقرأ السياسة" : "Read the policy"}</Link>
          </span>
        </label>
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
