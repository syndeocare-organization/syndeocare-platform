import type { Metadata } from "next";
import { Clock3, MessageCircle, MessagesSquare, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { MessageComposer } from "@/components/message-composer";
import { MessageThreadSync } from "@/components/message-thread-sync";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/lib/auth/dal";
import { getMessagingData } from "@/lib/data/messages";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { isLocale, localePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages", robots: { index: false, follow: false } };

export default async function MessagesPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ conversation?: string }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, `/auth/login?next=/${locale}/messages`));
  if (!viewer.onboardingComplete) redirect(localePath(locale, "/onboarding"));
  const [data, unreadCount] = await Promise.all([getMessagingData(viewer, query.conversation), getUnreadNotificationCount(viewer.id)]);
  const isArabic = locale === "ar";
  const selected = data.conversations.find((conversation) => conversation.id === data.selectedId);

  return (
    <DashboardShell locale={locale} viewer={viewer} activePage="messages" unreadCount={unreadCount}>
      <PageHeader
        eyebrow={isArabic ? "تنسيق مباشر وآمن" : "Direct, secure coordination"}
        title={isArabic ? "الرسائل" : "Messages"}
        description={isArabic ? "تُفتح المحادثة تلقائيًا بعد قبول الطلب، وتبقى مرتبطة بالمناوبة." : "A conversation opens automatically after acceptance and stays linked to the shift."}
      />

      {data.conversations.length ? (
        <div className="app-border app-surface mt-8 grid min-h-[38rem] overflow-hidden rounded-[1.75rem] border shadow-sm lg:grid-cols-[20rem_1fr]">
          <aside className="app-border app-surface-muted border-b lg:border-b-0 lg:border-e" aria-label={isArabic ? "المحادثات" : "Conversations"}>
            <div className="app-border border-b p-5"><h2 className="font-black">{isArabic ? "المحادثات" : "Conversations"}</h2><p className="mt-1 text-xs app-text-muted">{data.conversations.length} {isArabic ? "محادثة" : "total"}</p></div>
            <div className="max-h-72 overflow-y-auto lg:max-h-[34rem]">
              {data.conversations.map((conversation) => (
                <Link key={conversation.id} href={`${localePath(locale, "/messages")}?conversation=${conversation.id}`} className={`app-border block border-b p-4 transition hover:bg-[var(--surface)] ${conversation.id === data.selectedId ? "app-surface shadow-[inset_3px_0_0_var(--ring)]" : ""}`}>
                  <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-black">{conversation.shiftTitle}</p>{conversation.unread && <span className="size-2 rounded-full bg-brand-600" aria-label={isArabic ? "غير مقروء" : "Unread"} />}</div>
                  <p className="mt-1 truncate text-xs app-text-muted">{conversation.participantNames.join("، ") || (isArabic ? "فريق المناوبة" : "Shift team")}</p>
                  <p className="mt-2 truncate text-xs app-text-muted">{conversation.latestMessage ?? (isArabic ? "ابدأ المحادثة" : "Start the conversation")}</p>
                </Link>
              ))}
            </div>
          </aside>
          <section className="flex min-h-[32rem] flex-col">
            <header className="app-border flex items-center gap-3 border-b p-5"><span className="grid size-10 place-items-center rounded-full bg-brand-100 text-brand-700"><UserRound className="size-5" /></span><div><h2 className="font-black">{selected?.shiftTitle}</h2><p className="text-xs app-text-muted">{selected?.participantNames.join("، ")}</p></div></header>
            {data.selectedId && <MessageThreadSync conversationId={data.selectedId} latestMessageId={data.messages.at(-1)?.id} />}
            <div id="message-thread" className="app-surface-muted flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
              {data.messages.length ? data.messages.map((message) => {
                const mine = message.authorId === viewer.id;
                return <article key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${mine ? "rounded-ee-md bg-brand-700 text-white" : "rounded-es-md app-border app-surface border app-text"}`}><p className={`mb-1 text-[10px] font-black ${mine ? "text-brand-100" : "text-brand-700"}`}>{mine ? (isArabic ? "أنت" : "You") : message.authorName}</p><p className="whitespace-pre-wrap break-words">{message.body}</p><time className={`bidi-isolate mt-1 flex items-center gap-1 text-[10px] ${mine ? "text-brand-100/70" : "app-text-muted"}`}><Clock3 className="size-3" />{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "short", timeStyle: "short" }).format(new Date(message.createdAt))}</time></div></article>;
              }) : <div className="grid h-full min-h-72 place-items-center text-center"><div><MessageCircle className="mx-auto size-10 app-text-muted" /><h3 className="mt-4 font-black">{isArabic ? "ابدأ التنسيق" : "Start coordinating"}</h3><p className="mt-2 text-sm app-text-muted">{isArabic ? "أرسل أول رسالة بخصوص هذه المناوبة." : "Send the first message about this shift."}</p></div></div>}
            </div>
            {data.selectedId && <MessageComposer conversationId={data.selectedId} locale={locale} />}
          </section>
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState icon={MessagesSquare} title={isArabic ? "لا توجد محادثات بعد" : "No conversations yet"} description={isArabic ? "عند قبول طلب على مناوبة، تُنشأ محادثة آمنة تلقائيًا بين الطرفين." : "When an application is accepted, a secure conversation is created automatically for both sides."} />
        </div>
      )}
    </DashboardShell>
  );
}
