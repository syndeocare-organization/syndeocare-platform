import { ArrowLeft, ArrowRight, CheckCircle2, MailCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ResendConfirmationForm } from "@/components/resend-confirmation-form";
import { buttonVariants } from "@/components/ui/button";
import { localePath, type Locale } from "@/lib/i18n";

export function EmailVerificationPage({
  locale,
  email,
  returning,
}: {
  locale: Locale;
  email: string | null;
  returning: boolean;
}) {
  const isArabic = locale === "ar";
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <main id="main-content" className="relative isolate grid min-h-screen place-items-center overflow-hidden px-5 py-12">
      <div className="soft-grid absolute inset-0 -z-20 opacity-60" />
      <div className="absolute -start-40 top-10 -z-10 size-[30rem] rounded-full bg-brand-200/45 blur-3xl" />
      <div className="absolute -end-40 bottom-0 -z-10 size-[28rem] rounded-full bg-violet-500/15 blur-3xl" />

      <section className="w-full max-w-xl rounded-[2rem] border border-brand-950/8 bg-white/95 p-6 shadow-[0_35px_90px_-45px_rgba(8,41,54,.5)] backdrop-blur sm:p-10">
        <BrandLogo locale={locale} />
        <div className="mt-10 grid size-16 place-items-center rounded-3xl bg-brand-100 text-brand-700">
          <MailCheck className="size-8" aria-hidden="true" />
        </div>
        <p className="eyebrow mt-8">{isArabic ? "خطوة أخيرة" : "One last step"}</p>
        <h1 className="mt-4 text-balance text-3xl font-black tracking-tight sm:text-4xl">
          {returning
            ? isArabic ? "فعّل بريدك للمتابعة" : "Verify your email to continue"
            : isArabic ? "تحقق من بريدك الإلكتروني" : "Check your email"}
        </h1>
        <p className="mt-4 leading-8 text-slate-600">
          {email
            ? isArabic
              ? <>أرسلنا رابطًا آمنًا إلى <strong dir="ltr" className="font-black text-slate-900">{email}</strong>. افتحه وسيعود بك مباشرةً لإكمال ملفك.</>
              : <>We sent a secure link to <strong className="font-black text-slate-900">{email}</strong>. Open it to continue directly to your profile.</>
            : isArabic
              ? "لم نجد بريد التسجيل في هذه الجلسة. ارجع لإنشاء الحساب أو سجّل الدخول إذا سبق أن فعّلته."
              : "We could not find the registration email in this session. Start again or sign in if you already verified it."}
        </p>

        <div className="mt-7 grid gap-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
          <p className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />{isArabic ? "افحص البريد الوارد ثم مجلد الرسائل غير المرغوبة." : "Check your inbox and spam folder."}</p>
          <p className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />{isArabic ? "الرابط مؤقت ولا يطلب منك إرسال كلمة المرور لأي شخص." : "The link is temporary and never asks you to share your password."}</p>
        </div>

        {email && <ResendConfirmationForm locale={locale} />}

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link className={buttonVariants({ variant: "secondary" })} href={localePath(locale, "/auth/register")}>
            {isArabic ? "تغيير البريد" : "Change email"}
          </Link>
          <Link className={buttonVariants()} href={localePath(locale, "/auth/login")}>
            {isArabic ? "العودة لتسجيل الدخول" : "Back to sign in"}<Arrow className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
