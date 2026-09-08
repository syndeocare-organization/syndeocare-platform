import type { Metadata } from "next";
import { Banknote, BriefcaseMedical, Clock3, Filter, MapPin, UsersRound } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApplyButton } from "@/components/apply-button";
import { CreateShiftForm } from "@/components/create-shift-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { ShiftActions } from "@/components/shift-actions";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/lib/auth/dal";
import { getShiftsForViewer } from "@/lib/data/shifts";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { isLocale, localePath } from "@/lib/i18n";
import { shiftStatusLabel } from "@/lib/status-labels";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shifts", robots: { index: false, follow: false } };

export default async function ShiftsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ city?: string; specialty?: string }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, `/auth/login?next=/${locale}/shifts`));
  if (!viewer.onboardingComplete) redirect(localePath(locale, "/onboarding"));
  const [shifts, unreadCount] = await Promise.all([
    getShiftsForViewer(viewer, { city: query.city?.trim(), specialty: query.specialty?.trim() }),
    getUnreadNotificationCount(viewer.id),
  ]);
  const isArabic = locale === "ar";
  const hasFilters = Boolean(query.city?.trim() || query.specialty?.trim());

  return (
    <DashboardShell locale={locale} viewer={viewer} activePage="shifts" unreadCount={unreadCount}>
      <PageHeader
        eyebrow={viewer.role === "professional" ? (isArabic ? "فرص مناسبة" : "Matched opportunities") : (isArabic ? "إدارة التغطية" : "Coverage management")}
        title={viewer.role === "professional" ? (isArabic ? "المناوبات المتاحة" : "Available shifts") : (isArabic ? "المناوبات" : "Shifts")}
      />
      {viewer.role === "professional" && <form className="app-border app-surface mt-7 grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_1fr_auto]" method="get">
        <div>
          <Label htmlFor="specialty-filter">{isArabic ? "التخصص" : "Specialty"}</Label>
          <Input id="specialty-filter" name="specialty" defaultValue={query.specialty} placeholder={isArabic ? "مثل: تمريض عناية" : "e.g. ICU nursing"} />
        </div>
        <div>
          <Label htmlFor="city-filter">{isArabic ? "المدينة" : "City"}</Label>
          <Input id="city-filter" name="city" defaultValue={query.city} placeholder={isArabic ? "مثل: صنعاء" : "e.g. Riyadh"} />
        </div>
        <button className={`${buttonVariants({ variant: "secondary" })} self-end`} type="submit"><Filter className="size-4" />{isArabic ? "تصفية النتائج" : "Filter results"}</button>
      </form>}
      {viewer.role === "organization" && <Card className="mt-8 p-6 sm:p-8"><h2 className="mb-6 text-xl font-black">{isArabic ? "إنشاء مناوبة جديدة" : "Create a new shift"}</h2><CreateShiftForm locale={locale} canPublish={viewer.verificationStatus === "verified"} /></Card>}
      <section className="mt-8 grid gap-4" aria-label={isArabic ? "قائمة المناوبات" : "Shift list"}>
        {shifts.length ? shifts.map((shift) => (
          <Card key={shift.id} className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">{shift.specialty}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{shiftStatusLabel(shift.status, locale)}</span></div>
              <h2 className="mt-4 text-xl font-black">{shift.title}</h2>
              {shift.organizationName && <p className="mt-1 text-sm app-text-muted">{shift.organizationName}</p>}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs app-text-muted"><span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{shift.city}</span><span className="bidi-isolate inline-flex items-center gap-1.5"><Clock3 className="size-4" />{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(shift.startsAt))}</span><span className="bidi-isolate inline-flex items-center gap-1.5"><UsersRound className="size-4" />{shift.neededCount}</span>{shift.hourlyRate && <span className="bidi-isolate inline-flex items-center gap-1.5"><Banknote className="size-4" />{shift.hourlyRate} {shift.currency}</span>}</div>
            </div>
            {viewer.role === "professional" && <ApplyButton locale={locale} shiftId={shift.id} existingStatus={shift.applicationStatus} />}
            {viewer.role !== "professional" && <div className="grid gap-3"><ShiftActions id={shift.id} status={shift.status} locale={locale} canPublish={viewer.verificationStatus === "verified"} applicationCount={shift.applicationCount} />{shift.applicationCount > 0 && <Link href={localePath(locale, "/applications")} className={buttonVariants({ variant: "ghost", size: "sm" })}>{isArabic ? "عرض الطلبات" : "View applications"}</Link>}</div>}
          </Card>
        )) : <EmptyState icon={BriefcaseMedical} title={hasFilters ? (isArabic ? "لا توجد نتائج مطابقة" : "No matching results") : (isArabic ? "لا توجد مناوبات حتى الآن" : "No shifts yet")} description={hasFilters ? (isArabic ? "جرّب تعديل المدينة أو التخصص للعثور على فرص مناسبة." : "Try adjusting city or specialty filters to find matches.") : (isArabic ? "ستظهر المناوبات هنا فور توفرها." : "Shifts will appear here as soon as they are available.")} />}
      </section>
    </DashboardShell>
  );
}
