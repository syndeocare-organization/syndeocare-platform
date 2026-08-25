import { BadgeCheck, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { BrandLogo } from "@/components/brand-logo";
import { localePath, type Locale } from "@/lib/i18n";

export function AuthPage({ locale, mode, role, next }: { locale: Locale; mode: "login" | "register"; role?: "professional" | "organization"; next?: string }) {
  const isArabic = locale === "ar";
  const title = mode === "login" ? (isArabic ? "مرحبًا بعودتك" : "Welcome back") : (isArabic ? "ابدأ مع SyndeoCare" : "Start with SyndeoCare");
  const description = mode === "login" ? (isArabic ? "ادخل إلى لوحة التحكم وأكمل من حيث توقفت." : "Access your dashboard and continue where you left off.") : (isArabic ? "أنشئ حسابًا آمنًا، ثم أكمل ملفك بخطوات واضحة." : "Create a secure account, then complete your profile in clear steps.");

  return (
    <main id="main-content" className="grid min-h-[78svh] lg:grid-cols-[.88fr_1.12fr]">
      <section className="flex items-center bg-white px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <BrandLogo locale={locale} />
          <div className="mt-12">
            <p className="eyebrow">{mode === "login" ? (isArabic ? "حسابك الآمن" : "Your secure account") : (isArabic ? "انضم إلى المنصة" : "Join the platform")}</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-4 leading-7 text-slate-600">{description}</p>
          </div>
          <AuthForm locale={locale} mode={mode} defaultRole={role} next={next} />
          <p className="mt-7 text-center text-sm text-slate-600">
            {mode === "login" ? (isArabic ? "ليس لديك حساب؟" : "New to SyndeoCare?") : (isArabic ? "لديك حساب بالفعل؟" : "Already have an account?")}{" "}
            <Link className="font-black text-brand-700 hover:text-brand-900" href={localePath(locale, mode === "login" ? "/auth/register" : "/auth/login")}>{mode === "login" ? (isArabic ? "سجل الآن" : "Create one") : (isArabic ? "سجل الدخول" : "Sign in")}</Link>
          </p>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-brand-950 px-14 py-16 text-white lg:flex lg:flex-col lg:justify-between" aria-label={isArabic ? "مزايا الأمان" : "Security benefits"}>
        <div className="soft-grid absolute inset-0 opacity-10" />
        <div className="relative max-w-lg">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-300/15 text-brand-200"><ShieldCheck className="size-7" aria-hidden="true" /></span>
          <blockquote className="mt-12 text-balance text-3xl font-black leading-[1.45]">{isArabic ? "كل ملف موثّق يختصر خطوة، وكل خطوة واضحة تبني رعاية أفضل." : "Every verified profile removes friction—and every clear step supports better care."}</blockquote>
        </div>
        <ul className="relative grid gap-4 text-sm text-brand-100/80">
          <li className="flex items-center gap-3"><BadgeCheck className="size-5 text-brand-300" aria-hidden="true" />{isArabic ? "تحقق مهني منظم" : "Structured professional verification"}</li>
          <li className="flex items-center gap-3"><LockKeyhole className="size-5 text-brand-300" aria-hidden="true" />{isArabic ? "صلاحيات دقيقة لكل دور" : "Fine-grained access for every role"}</li>
        </ul>
      </aside>
    </main>
  );
}
