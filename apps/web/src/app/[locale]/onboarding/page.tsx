import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { OnboardingForm } from "@/components/onboarding-form";
import { Card } from "@/components/ui/card";
import { getViewer } from "@/lib/auth/dal";
import { isLocale, localePath } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Complete your profile", robots: { index: false, follow: false } };

export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, `/auth/login?next=/${locale}/onboarding`));
  if (viewer.onboardingComplete) redirect(localePath(locale, "/dashboard"));
  const supabase = await createClient();
  const { data: teamMembership } = viewer.role === "organization"
    ? await supabase.from("organization_members").select("organization_id").eq("user_id", viewer.id).limit(1).maybeSingle()
    : { data: null };
  const teamMember = Boolean(teamMembership);
  const isArabic = locale === "ar";

  return (
    <main id="main-content" className="page-shell py-10 sm:py-16">
      <BrandLogo locale={locale} />
      <div className="mx-auto mt-10 max-w-3xl">
        <div className="mb-8 flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700"><BadgeCheck className="size-6" aria-hidden="true" /></span>
          <div>
            <p className="text-sm font-bold text-brand-700">{isArabic ? "الخطوة 1 من 2" : "Step 1 of 2"}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{isArabic ? "أكمل ملفك الأساسي" : "Complete your core profile"}</h1>
            <p className="mt-3 leading-7 text-slate-600">{isArabic ? "نحتاج هذه المعلومات لمطابقة حسابك والتحقق منه بطريقة صحيحة." : "We use this information to match and verify your account correctly."}</p>
          </div>
        </div>
        <Card className="p-6 sm:p-9"><OnboardingForm locale={locale} viewer={viewer} teamMember={teamMember} /></Card>
      </div>
    </main>
  );
}
