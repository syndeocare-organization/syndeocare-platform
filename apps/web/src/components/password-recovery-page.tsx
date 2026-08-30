import { KeyRound, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { PasswordRecoveryForm } from "@/components/password-recovery-form";
import type { Locale } from "@/lib/i18n";

export function PasswordRecoveryPage({ locale, mode }: { locale: Locale; mode: "request" | "update" }) {
  const isArabic = locale === "ar";
  const isRequest = mode === "request";

  return (
    <main id="main-content" className="grid min-h-[78svh] lg:grid-cols-[.88fr_1.12fr]">
      <section className="flex items-center bg-white px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <BrandLogo locale={locale} />
          <div className="mt-12">
            <p className="eyebrow">{isArabic ? "استعادة آمنة" : "Secure recovery"}</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              {isRequest
                ? (isArabic ? "استعد الوصول إلى حسابك" : "Recover access to your account")
                : (isArabic ? "أنشئ كلمة مرور جديدة" : "Create a new password")}
            </h1>
            <p className="mt-4 leading-7 text-slate-600">
              {isRequest
                ? (isArabic ? "سنرسل رابطًا مؤقتًا إلى بريد الحساب دون الكشف عما إذا كان البريد مسجلًا." : "We will send a temporary link to the account email without revealing whether it is registered.")
                : (isArabic ? "استخدم كلمة قوية ومختلفة عن كلمات المرور التي تستعملها في خدمات أخرى." : "Use a strong password that is different from passwords you use elsewhere.")}
            </p>
          </div>
          <PasswordRecoveryForm locale={locale} mode={mode} />
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-brand-950 px-14 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="soft-grid absolute inset-0 opacity-10" />
        <div className="relative max-w-lg">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-300/15 text-brand-200"><KeyRound className="size-7" aria-hidden="true" /></span>
          <h2 className="mt-12 text-balance text-3xl font-black leading-[1.45]">{isArabic ? "رابط مؤقت، جلسة محمية، وكلمة مرور لا يراها فريقنا." : "A temporary link, a protected session, and a password our team never sees."}</h2>
        </div>
        <p className="relative flex items-center gap-3 text-sm text-brand-100/80"><ShieldCheck className="size-5 text-brand-300" aria-hidden="true" />{isArabic ? "لا تشارك رابط الاستعادة مع أي شخص." : "Never share your recovery link with anyone."}</p>
      </aside>
    </main>
  );
}
