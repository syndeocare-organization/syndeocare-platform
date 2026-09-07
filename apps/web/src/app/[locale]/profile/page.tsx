import type { Metadata } from "next";
import { BadgeCheck, FileCheck2, Settings2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProfileForm } from "@/components/profile-form";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getViewer } from "@/lib/auth/dal";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { getProfileDetails } from "@/lib/data/profile";
import { isLocale, localePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: false } };

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, `/auth/login?next=/${locale}/profile`));
  if (!viewer.onboardingComplete) redirect(localePath(locale, "/onboarding"));
  const [profile, unreadCount] = await Promise.all([getProfileDetails(viewer), getUnreadNotificationCount(viewer.id)]);
  if (!profile) redirect(localePath(locale, "/onboarding"));
  const isArabic = locale === "ar";

  return (
    <DashboardShell locale={locale} viewer={viewer} activePage="profile" unreadCount={unreadCount}>
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="eyebrow">{isArabic ? "هويتك على المنصة" : "Your platform identity"}</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">{isArabic ? "الملف الشخصي" : "Profile"}</h1><p className="mt-3 text-slate-600">{isArabic ? "حدّث معلوماتك المهنية، وتابع حالة التحقق من مكان واحد." : "Keep your information current and follow verification from one place."}</p></div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${viewer.verificationStatus === "verified" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}><BadgeCheck className="size-4" />{viewer.verificationStatus === "verified" ? (isArabic ? "حساب موثّق" : "Verified") : (isArabic ? "التحقق قيد الإكمال" : "Verification in progress")}</span>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <Card className="p-6 sm:p-9"><ProfileForm locale={locale} profile={profile} /></Card>
        <aside className="grid content-start gap-4">
          <Card className="p-5"><span className="grid size-10 place-items-center rounded-2xl bg-brand-100 text-brand-700"><FileCheck2 className="size-5" /></span><h2 className="mt-5 font-black">{isArabic ? "المستندات والتحقق" : "Documents & verification"}</h2><p className="mt-2 text-sm leading-7 text-slate-500">{isArabic ? "ارفع الهوية والترخيص وتابع نتيجة المراجعة." : "Upload ID and licenses, then track review status."}</p><Link href={localePath(locale, "/verification")} className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-5 w-full`}>{isArabic ? "إدارة المستندات" : "Manage documents"}</Link></Card>
          <Card className="p-5"><span className="grid size-10 place-items-center rounded-2xl bg-slate-100 text-slate-600"><Settings2 className="size-5" /></span><h2 className="mt-5 font-black">{isArabic ? "الأمان والخصوصية" : "Security & privacy"}</h2><p className="mt-2 text-sm leading-7 text-slate-500">{isArabic ? "سياسة البيانات وخيار حذف الحساب بشكل آمن." : "Data policy and secure account deletion."}</p><div className="mt-5 grid gap-2"><Link href={localePath(locale, "/privacy")} className={buttonVariants({ variant: "ghost", size: "sm" })}><ShieldCheck className="size-4" />{isArabic ? "الخصوصية" : "Privacy"}</Link><Link href={localePath(locale, "/delete-account")} className={buttonVariants({ variant: "ghost", size: "sm" })}>{isArabic ? "حذف الحساب" : "Delete account"}</Link></div></Card>
        </aside>
      </div>
    </DashboardShell>
  );
}
