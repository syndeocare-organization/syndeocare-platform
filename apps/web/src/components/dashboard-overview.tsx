import { ArrowUpLeft, ArrowUpRight, BadgeCheck, Bell, BriefcaseMedical, Building2, CalendarDays, CheckCircle2, Clock3, FileCheck2, MapPin, MessageCircle, Plus, ShieldCheck, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ActionRow } from "@/components/ui/action-row";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Viewer } from "@/lib/auth/dal";
import type { DashboardSummary } from "@/lib/data/dashboard";
import { localePath, type Locale } from "@/lib/i18n";
import { shiftStatusLabel } from "@/lib/status-labels";
import { cn } from "@/lib/utils";

export function DashboardOverview({ locale, viewer, summary }: { locale: Locale; viewer: Viewer; summary: DashboardSummary }) {
  const isArabic = locale === "ar";
  const professional = viewer.role === "professional";
  const admin = viewer.role === "admin";
  const Arrow = isArabic ? ArrowUpLeft : ArrowUpRight;
  const cards: Array<[string, number, LucideIcon, string]> = admin
    ? [
        [isArabic ? "مراجعات معلّقة" : "Pending reviews", summary.primaryCount, ShieldCheck, "bg-brand-100 text-brand-700"],
        [isArabic ? "إشعارات" : "Notifications", summary.secondaryCount, Bell, "bg-violet-500/12 text-violet-600"],
        [isArabic ? "التحقق" : "Verification", summary.tertiaryCount, FileCheck2, "bg-emerald-100 text-emerald-700"],
      ]
    : professional
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
          <p className="mt-3 app-text-muted">{admin ? (isArabic ? "هذه نظرة مركزة على أعمال المراجعة والثقة." : "A focused view of trust and review work.") : professional ? (isArabic ? "هذه أحدث فرصك وطلباتك المهنية." : "Here are your latest professional opportunities and applications.") : (isArabic ? "هذه نظرة سريعة على احتياج منشأتك وفريقك." : "Here is a quick view of your organization and staffing activity.")}</p>
        </div>
        <Link className={buttonVariants({ size: "lg" })} href={localePath(locale, admin ? "/admin" : "/shifts")}>
          {admin ? <ShieldCheck className="size-5" /> : professional ? <BriefcaseMedical className="size-5" /> : <Plus className="size-5" />}
          {admin ? (isArabic ? "افتح مركز المراجعة" : "Open review center") : professional ? (isArabic ? "استعرض الفرص" : "Browse opportunities") : (isArabic ? "إنشاء مناوبة" : "Create shift")}
        </Link>
      </section>

      <section className="mt-9 grid gap-4 md:grid-cols-3" aria-label={isArabic ? "ملخص الحساب" : "Account summary"}>
        {cards.map(([label, value, Icon, tone]) => (
          <Card key={String(label)} className="flex items-center gap-5 p-6">
            <span className={cn("grid size-12 place-items-center rounded-2xl", String(tone))}><Icon className="size-5" aria-hidden="true" /></span>
            <div><p className="text-3xl font-black">{String(value).padStart(2, "0")}</p><p className="mt-1 text-sm app-text-muted">{String(label)}</p></div>
          </Card>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <Card className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-wider app-text-muted">{professional ? (isArabic ? "مختارة لك" : "Selected for you") : (isArabic ? "آخر النشاط" : "Latest activity")}</p><h2 className="mt-2 text-xl font-black">{professional ? (isArabic ? "المناوبات القادمة" : "Upcoming opportunities") : (isArabic ? "المناوبات الأخيرة" : "Recent shifts")}</h2></div>
            <Link href={localePath(locale, professional ? "/shifts" : "/applications")} className="inline-flex items-center gap-2 text-sm font-black text-brand-700">{isArabic ? "عرض الكل" : "View all"}<Arrow className="size-4" /></Link>
          </div>
          {summary.recentShifts.length ? (
            <div className="app-border mt-6 divide-y">
              {summary.recentShifts.map((shift) => (
                <div key={shift.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-black">{shift.title}</p><p className="mt-2 flex flex-wrap gap-4 text-xs app-text-muted"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{shift.city}</span><span className="inline-flex items-center gap-1.5 bidi-isolate"><Clock3 className="size-3.5" />{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(shift.startsAt))}</span></p></div>
                  <span className="w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{shiftStatusLabel(shift.status, locale)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState icon={CalendarDays} title={isArabic ? "لا يوجد نشاط بعد" : "No activity yet"} description={professional ? (isArabic ? "ستظهر الفرص المناسبة هنا عند نشرها." : "Matching opportunities will appear here when published.") : (isArabic ? "أنشئ أول مناوبة لبدء استقبال الطلبات." : "Create the first shift to start receiving applications.")} />
            </div>
          )}
        </Card>
        {admin ? (
          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-black">{isArabic ? "خطوات الإدارة التالية" : "Admin next steps"}</h2>
            <div className="mt-5 grid gap-3">
              <ActionRow href={localePath(locale, "/admin")} icon={ShieldCheck} title={isArabic ? "مراجعة الحسابات والمستندات" : "Review accounts and documents"} description={isArabic ? "راجع الطلبات المعلقة واتخذ قرارًا واضحًا." : "Handle pending trust and safety decisions."} />
              <ActionRow href={localePath(locale, "/notifications")} icon={Bell} title={isArabic ? "تابع التنبيهات" : "Check notifications"} description={isArabic ? "تأكد من أي تحديثات عاجلة للنظام." : "Review urgent platform updates."} />
            </div>
          </Card>
        ) : viewer.verificationStatus === "verified" ? (
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
            <Link href={localePath(locale, "/verification")} className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15">{isArabic ? "رفع المستندات" : "Upload documents"}</Link>
          </Card>
        )}
      </section>
      {!admin && (
        <section className="mt-6">
          <Card className="p-6">
            <h2 className="text-lg font-black">{isArabic ? "الخطوة التالية" : "What to do next"}</h2>
            <div className="mt-4 grid gap-3">
              {professional ? (
                <>
                  {viewer.verificationStatus !== "verified" && <ActionRow href={localePath(locale, "/verification")} icon={FileCheck2} tone="warning" title={isArabic ? "أكمل التحقق" : "Complete verification"} description={isArabic ? "ارفع المستندات المطلوبة لتفعيل كل المزايا." : "Upload required documents to unlock all features."} />}
                  <ActionRow href={localePath(locale, "/shifts")} icon={BriefcaseMedical} title={isArabic ? "استعرض الفرص المتاحة" : "Browse opportunities"} description={isArabic ? "فلتر حسب المدينة أو التخصص ثم قدّم مباشرة." : "Filter by city/specialty and apply quickly."} />
                  <ActionRow href={localePath(locale, "/applications")} icon={FileCheck2} title={isArabic ? "تابع حالة الطلبات" : "Track applications"} description={isArabic ? "راجع المقبول والمرفوض وما ينتظر القرار." : "Check accepted, rejected, and pending updates."} />
                  <ActionRow href={localePath(locale, "/messages")} icon={MessageCircle} title={isArabic ? "نسّق عبر الرسائل" : "Coordinate in messages"} description={isArabic ? "افتح المحادثة المرتبطة بالمناوبة المقبولة." : "Open shift-linked conversations after acceptance."} />
                </>
              ) : (
                <>
                  <ActionRow href={localePath(locale, "/shifts")} icon={Plus} title={isArabic ? "أنشئ مناوبة جديدة" : "Create a new shift"} description={isArabic ? "ابدأ بنشر الاحتياج أو حفظه كمسودة." : "Post your staffing need or save it as draft."} />
                  <ActionRow href={localePath(locale, "/applications")} icon={UsersRound} title={isArabic ? "راجع الطلبات" : "Review applications"} description={isArabic ? "اتخذ قرار القبول أو الرفض بسرعة." : "Accept or reject candidates with clear status updates."} />
                  <ActionRow href={localePath(locale, "/team")} icon={Building2} title={isArabic ? "نظّم صلاحيات الفريق" : "Manage team access"} description={isArabic ? "أضف أعضاء وحدد الدور المناسب لكل حساب." : "Invite members and set role-based permissions."} />
                </>
              )}
            </div>
          </Card>
        </section>
      )}
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
