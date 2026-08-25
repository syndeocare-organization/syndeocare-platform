import { ArrowUpLeft, ArrowUpRight, BadgeCheck, BriefcaseMedical, Building2, CalendarDays, CheckCircle2, Clock3, FileCheck2, MapPin, Plus, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Viewer } from "@/lib/auth/dal";
import type { DashboardSummary } from "@/lib/data/dashboard";
import { localePath, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function DashboardOverview({ locale, viewer, summary }: { locale: Locale; viewer: Viewer; summary: DashboardSummary }) {
  const isArabic = locale === "ar";
  const professional = viewer.role === "professional";
  const Arrow = isArabic ? ArrowUpLeft : ArrowUpRight;
  const cards: Array<[string, number, LucideIcon, string]> = professional
    ? [
        [isArabic ? "فرص متاحة" : "Open opportunities", summary.primaryCount, BriefcaseMedical, "bg-brand-100 text-brand-700"],
        [isArabic ? "طلباتي" : "My applications", summary.secondaryCount, FileCheck2, "bg-violet-500/12 text-violet-600"],
        [isArabic ? "مقبولة" : "Accepted", summary.tertiaryCount, CheckCircle2, "bg-emerald-100 text-emerald-700"],
      ]
    : [
        [isArabic ? "مناوبات منشورة" : "Published shifts", summary.primaryCount, CalendarDays, "bg-brand-100 text-brand-700"],
        [isArabic ? "طلبات واردة" : "Applications", summary.secondaryCount, UsersRound, "bg-violet-500/12 text-violet-600"],
        [isArabic ? "أعضاء الفريق" : "Team members", summary.tertiaryCount, Building2, "bg-emerald-100 text-emerald-700"],
      ];

  return (
    <>
      <section className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-brand-700"><BadgeCheck className="size-4" />{verificationLabel(viewer.verificationStatus, isArabic)}</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{isArabic ? `مرحبًا، ${viewer.fullName ?? "بك"}` : `Welcome, ${viewer.fullName ?? "there"}`}</h1>
          <p className="mt-3 text-slate-600">{professional ? (isArabic ? "هذه أحدث فرصك وطلباتك المهنية." : "Here are your latest professional opportunities and applications.") : (isArabic ? "هذه نظرة سريعة على احتياج منشأتك وفريقك." : "Here is a quick view of your organization and staffing activity.")}</p>
        </div>
        <Link className={buttonVariants({ size: "lg" })} href={localePath(locale, "/shifts")}>
          {professional ? <BriefcaseMedical className="size-5" /> : <Plus className="size-5" />}
          {professional ? (isArabic ? "استعرض الفرص" : "Browse opportunities") : (isArabic ? "إنشاء مناوبة" : "Create shift")}
        </Link>
      </section>

      <section className="mt-9 grid gap-4 md:grid-cols-3" aria-label={isArabic ? "ملخص الحساب" : "Account summary"}>
        {cards.map(([label, value, Icon, tone]) => (
          <Card key={String(label)} className="flex items-center gap-5 p-6">
            <span className={cn("grid size-12 place-items-center rounded-2xl", String(tone))}><Icon className="size-5" aria-hidden="true" /></span>
            <div><p className="text-3xl font-black text-brand-950">{String(value).padStart(2, "0")}</p><p className="mt-1 text-sm text-slate-500">{String(label)}</p></div>
          </Card>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <Card className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{professional ? (isArabic ? "مختارة لك" : "Selected for you") : (isArabic ? "آخر النشاط" : "Latest activity")}</p><h2 className="mt-2 text-xl font-black">{professional ? (isArabic ? "المناوبات القادمة" : "Upcoming opportunities") : (isArabic ? "المناوبات الأخيرة" : "Recent shifts")}</h2></div>
            <Link href={localePath(locale, "/shifts")} className="inline-flex items-center gap-2 text-sm font-black text-brand-700">{isArabic ? "عرض الكل" : "View all"}<Arrow className="size-4" /></Link>
          </div>
          {summary.recentShifts.length ? (
            <div className="mt-6 divide-y divide-slate-100">
              {summary.recentShifts.map((shift) => (
                <div key={shift.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-black text-slate-900">{shift.title}</p><p className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{shift.city}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(shift.startsAt))}</span></p></div>
                  <span className="w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{shift.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center"><CalendarDays className="mx-auto size-8 text-slate-300" /><p className="mt-4 font-black text-slate-700">{isArabic ? "لا يوجد نشاط بعد" : "No activity yet"}</p><p className="mt-2 text-sm text-slate-500">{professional ? (isArabic ? "ستظهر الفرص المناسبة هنا عند نشرها." : "Matching opportunities will appear here when published.") : (isArabic ? "أنشئ أول مناوبة لبدء استقبال الطلبات." : "Create the first shift to start receiving applications.")}</p></div>
          )}
        </Card>
        {viewer.verificationStatus === "verified" ? (
          <Card className="bg-emerald-950 p-6 text-white sm:p-8">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-emerald-200"><BadgeCheck className="size-5" /></span>
            <h2 className="mt-8 text-xl font-black">{isArabic ? "اكتمل التحقق" : "Verification complete"}</h2>
            <p className="mt-3 text-sm leading-7 text-emerald-100/70">{isArabic ? "حسابك معتمد ويمكنه استخدام مزايا المنصة المخصصة للحسابات الموثّقة." : "Your account is approved and can use the platform features reserved for verified accounts."}</p>
            <div className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-bold text-white"><CheckCircle2 className="size-4" />{isArabic ? "حساب موثّق" : "Verified account"}</div>
          </Card>
        ) : (
          <Card className="bg-brand-950 p-6 text-white sm:p-8">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-brand-200"><FileCheck2 className="size-5" /></span>
            <h2 className="mt-8 text-xl font-black">{isArabic ? "أكمل التحقق" : "Complete verification"}</h2>
            <p className="mt-3 text-sm leading-7 text-brand-100/65">{isArabic ? "ارفع المستندات المطلوبة لتسريع المراجعة وإظهار شارة موثّق." : "Upload the required documents to speed up review and earn a verified badge."}</p>
            <button type="button" disabled className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 text-sm font-bold text-white/70">{isArabic ? "رفع المستندات — قريبًا" : "Upload documents — soon"}</button>
          </Card>
        )}
      </section>
    </>
  );
}

function verificationLabel(status: Viewer["verificationStatus"], isArabic: boolean) {
  const labels = {
    not_started: isArabic ? "التحقق لم يبدأ" : "Verification not started",
    pending: isArabic ? "التحقق قيد المراجعة" : "Verification in review",
    verified: isArabic ? "حساب موثّق" : "Verified account",
    rejected: isArabic ? "يلزم تحديث التحقق" : "Verification needs attention",
  };
  return labels[status];
}
