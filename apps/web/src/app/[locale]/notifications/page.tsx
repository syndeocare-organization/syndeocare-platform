import type { Metadata } from "next";
import { Bell, BellOff, Clock3 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { MarkNotificationsReadButton } from "@/components/mark-notifications-read-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/lib/auth/dal";
import { getNotifications } from "@/lib/data/notifications";
import { isLocale, localePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications", robots: { index: false, follow: false } };

export default async function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, `/auth/login?next=/${locale}/notifications`));
  if (!viewer.onboardingComplete) redirect(localePath(locale, "/onboarding"));

  const notifications = await getNotifications(viewer.id);
  const hasUnread = notifications.some((notification) => !notification.readAt);
  const isArabic = locale === "ar";

  return (
    <DashboardShell locale={locale} viewer={viewer} activePage="notifications" unreadCount={notifications.filter((notification) => !notification.readAt).length}>
      <PageHeader
        eyebrow={isArabic ? "آخر المستجدات" : "Latest updates"}
        title={isArabic ? "الإشعارات" : "Notifications"}
        description={isArabic ? "حالة الطلبات والمناوبات والتنبيهات المهمة في مكان واحد." : "Application, shift, and important account updates in one place."}
        action={<MarkNotificationsReadButton locale={locale} disabled={!hasUnread} />}
      />

      <section className="mt-8 grid gap-4" aria-label={isArabic ? "قائمة الإشعارات" : "Notification list"}>
        {notifications.length ? notifications.map((notification) => (
          <Card key={notification.id} className={`flex gap-4 p-5 sm:p-6 ${notification.readAt ? "bg-white" : "border-brand-300 bg-brand-50/55"}`}>
            <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${notification.readAt ? "bg-slate-100 text-slate-500" : "bg-brand-100 text-brand-700"}`}><Bell className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-black">{notification.title}</h2>
                {!notification.readAt && <span className="rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-black text-white">{isArabic ? "جديد" : "New"}</span>}
              </div>
              <p className="mt-2 text-sm leading-7 app-text-muted">{notification.body}</p>
              <p className="bidi-isolate mt-3 inline-flex items-center gap-1.5 text-xs app-text-muted"><Clock3 className="size-3.5" aria-hidden="true" />{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.createdAt))}</p>
            </div>
          </Card>
        )) : (
          <EmptyState
            icon={BellOff}
            title={isArabic ? "لا توجد إشعارات بعد" : "No notifications yet"}
            description={isArabic ? "ستظهر هنا التحديثات المهمة عند حدوثها. يمكنك متابعة الفرص والطلبات الآن." : "Important updates will appear here as they happen. Continue with shifts and applications for now."}
            action={<Link href={localePath(locale, "/dashboard")} className={buttonVariants({ variant: "secondary" })}>{isArabic ? "العودة للرئيسية" : "Back to dashboard"}</Link>}
          />
        )}
      </section>
    </DashboardShell>
  );
}
