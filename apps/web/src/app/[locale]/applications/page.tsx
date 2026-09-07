import type { Metadata } from "next";
import { BadgeCheck, BriefcaseBusiness, CalendarDays, Clock3, FileSearch, MapPin, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ApplicationActions } from "@/components/application-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { getViewer } from "@/lib/auth/dal";
import { getApplicationsForViewer } from "@/lib/data/applications";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { isLocale, localePath } from "@/lib/i18n";
import { applicationStatusLabel, applicationStatusTone } from "@/lib/status-labels";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Applications", robots: { index: false, follow: false } };

export default async function ApplicationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, `/auth/login?next=/${locale}/applications`));
  if (!viewer.onboardingComplete) redirect(localePath(locale, "/onboarding"));

  const [applications, unreadCount] = await Promise.all([
    getApplicationsForViewer(viewer),
    getUnreadNotificationCount(viewer.id),
  ]);
  const isArabic = locale === "ar";
  const isProfessional = viewer.role === "professional";

  return (
    <DashboardShell locale={locale} viewer={viewer} activePage="applications" unreadCount={unreadCount}>
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{isProfessional ? (isArabic ? "مسارك المهني" : "Your career flow") : (isArabic ? "اختيار المرشحين" : "Candidate pipeline")}</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">{isArabic ? "الطلبات" : "Applications"}</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            {isProfessional
              ? isArabic ? "تابع كل طلب وحالته دون رسائل مبهمة أو خطوات ضائعة." : "Track every application and its status without unclear steps."
              : isArabic ? "راجع المرشحين وحدّث القرار؛ يصل التغيير للطرف الآخر فورًا." : "Review candidates and update decisions; changes reach them immediately."}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600">
          {isArabic ? `${applications.length} طلب` : `${applications.length} application${applications.length === 1 ? "" : "s"}`}
        </div>
      </section>

      <section className="mt-8 grid gap-4" aria-label={isArabic ? "قائمة الطلبات" : "Application list"}>
        {applications.length ? applications.map((application) => (
          <Card key={application.id} className="p-5 sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${applicationStatusTone(application.status)}`}>{applicationStatusLabel(application.status, locale)}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{application.shift.specialty}</span>
                </div>
                <h2 className="mt-4 text-xl font-black text-slate-950">{application.shift.title}</h2>
                {isProfessional ? (
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-500"><BriefcaseBusiness className="size-4" />{application.shift.organizationName ?? (isArabic ? "منشأة صحية" : "Healthcare organization")}</p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2 font-black text-slate-900"><UserRound className="size-4 text-brand-600" />{application.professional?.fullName ?? (isArabic ? "مقدم رعاية" : "Care professional")}</span>
                    {application.professional?.verificationStatus === "verified" && <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700"><BadgeCheck className="size-4" />{isArabic ? "موثّق" : "Verified"}</span>}
                    {application.professional?.yearsExperience != null && <span>{isArabic ? `${application.professional.yearsExperience} سنوات خبرة` : `${application.professional.yearsExperience} years experience`}</span>}
                  </div>
                )}
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{application.shift.city}</span>
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium" }).format(new Date(application.shift.startsAt))}</span>
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" />{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { timeStyle: "short" }).format(new Date(application.shift.startsAt))}</span>
                </div>
                {application.note && <blockquote className="mt-5 rounded-2xl border-s-4 border-brand-300 bg-brand-50/60 px-5 py-4 text-sm leading-7 text-slate-700">{application.note}</blockquote>}
              </div>
              <div className="shrink-0 lg:max-w-72">
                <p className="mb-3 text-xs text-slate-400">{isArabic ? "آخر تحديث" : "Last updated"}: {new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium" }).format(new Date(application.updatedAt))}</p>
                <ApplicationActions id={application.id} status={application.status} role={viewer.role} locale={locale} />
              </div>
            </div>
          </Card>
        )) : (
          <Card className="py-16 text-center">
            <FileSearch className="mx-auto size-11 text-slate-300" />
            <h2 className="mt-5 font-black text-slate-700">{isArabic ? "لا توجد طلبات بعد" : "No applications yet"}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">{isProfessional ? (isArabic ? "اختر مناوبة مناسبة وقدّم عليها؛ ستظهر هنا مباشرة." : "Choose a suitable shift and apply; it will appear here immediately.") : (isArabic ? "ستظهر طلبات المتقدمين فور التقديم على مناوبات منشأتك." : "Candidates appear here as soon as they apply to your shifts.")}</p>
          </Card>
        )}
      </section>
    </DashboardShell>
  );
}
