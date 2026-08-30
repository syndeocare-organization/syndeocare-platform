import type { Metadata } from "next";
import { Bell, BellOff, Clock3 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { MarkNotificationsReadButton } from "@/components/mark-notifications-read-button";
import { Card } from "@/components/ui/card";
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
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{isArabic ? "آخر المستجدات" : "Latest updates"}</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">{isArabic ? "الإشعارات" : "Notifications"}</h1>
          <p className="mt-3 text-slate-600">{isArabic ? "حالة الطلبات والمناوبات والتنبيهات المهمة في مكان واحد." : "Application, shift, and important account updates in one place."}</p>
        </div>
        <MarkNotificationsReadButton locale={locale} disabled={!hasUnread} />
      </section>

      <section className="mt-8 grid gap-4" aria-label={isArabic ? "قائمة الإشعارات" : "Notification list"}>
        {notifications.length ? notifications.map((notification) => (
          <Card key={notification.id} className={`flex gap-4 p-5 sm:p-6 ${notification.readAt ? "bg-white" : "border-brand-300 bg-brand-50/55"}`}>
            <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${notification.readAt ? "bg-slate-100 text-slate-500" : "bg-brand-100 text-brand-700"}`}><Bell className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-black text-slate-900">{notification.title}</h2>
                {!notification.readAt && <span className="rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-black text-white">{isArabic ? "جديد" : "New"}</span>}
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">{notification.body}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400"><Clock3 className="size-3.5" aria-hidden="true" />{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.createdAt))}</p>
            </div>
          </Card>
        )) : (
          <Card className="py-16 text-center">
            <BellOff className="mx-auto size-10 text-slate-300" aria-hidden="true" />
            <h2 className="mt-5 font-black text-slate-700">{isArabic ? "لا توجد إشعارات بعد" : "No notifications yet"}</h2>
            <p className="mt-2 text-sm text-slate-500">{isArabic ? "ستظهر هنا التحديثات المهمة عند حدوثها." : "Important updates will appear here as they happen."}</p>
          </Card>
        )}
      </section>
    </DashboardShell>
  );
}
