import type { Metadata } from "next";
import { Banknote, BriefcaseMedical, Clock3, MapPin, UsersRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ApplyButton } from "@/components/apply-button";
import { CreateShiftForm } from "@/components/create-shift-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { getViewer } from "@/lib/auth/dal";
import { getShiftsForViewer } from "@/lib/data/shifts";
import { isLocale, localePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shifts", robots: { index: false, follow: false } };

export default async function ShiftsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, `/auth/login?next=/${locale}/shifts`));
  if (!viewer.onboardingComplete) redirect(localePath(locale, "/onboarding"));
  const shifts = await getShiftsForViewer(viewer);
  const isArabic = locale === "ar";

  return (
    <DashboardShell locale={locale} viewer={viewer}>
      <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">{viewer.role === "professional" ? (isArabic ? "فرص مناسبة" : "Matched opportunities") : (isArabic ? "إدارة التغطية" : "Coverage management")}</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">{viewer.role === "professional" ? (isArabic ? "المناوبات المتاحة" : "Available shifts") : (isArabic ? "المناوبات" : "Shifts")}</h1></div></div>
      {viewer.role === "organization" && <Card className="mt-8 p-6 sm:p-8"><h2 className="mb-6 text-xl font-black">{isArabic ? "إنشاء مناوبة جديدة" : "Create a new shift"}</h2><CreateShiftForm locale={locale} canPublish={viewer.verificationStatus === "verified"} /></Card>}
      <section className="mt-8 grid gap-4" aria-label={isArabic ? "قائمة المناوبات" : "Shift list"}>
        {shifts.length ? shifts.map((shift) => (
          <Card key={shift.id} className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">{shift.specialty}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{shift.status}</span></div>
              <h2 className="mt-4 text-xl font-black">{shift.title}</h2>
              {shift.organizationName && <p className="mt-1 text-sm text-slate-500">{shift.organizationName}</p>}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{shift.city}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" />{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(shift.startsAt))}</span><span className="inline-flex items-center gap-1.5"><UsersRound className="size-4" />{shift.neededCount}</span>{shift.hourlyRate && <span className="inline-flex items-center gap-1.5"><Banknote className="size-4" />{shift.hourlyRate} {shift.currency}</span>}</div>
            </div>
            {viewer.role === "professional" && <ApplyButton locale={locale} shiftId={shift.id} existingStatus={shift.applicationStatus} />}
          </Card>
        )) : <Card className="py-16 text-center"><BriefcaseMedical className="mx-auto size-10 text-slate-300" /><h2 className="mt-5 font-black text-slate-700">{isArabic ? "لا توجد مناوبات حتى الآن" : "No shifts yet"}</h2><p className="mt-2 text-sm text-slate-500">{isArabic ? "ستظهر المناوبات هنا فور توفرها." : "Shifts will appear here as soon as they are available."}</p></Card>}
      </section>
    </DashboardShell>
  );
}
