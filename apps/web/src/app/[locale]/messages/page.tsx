import type { Metadata } from "next";
import { Clock3, MessageCircle, MessagesSquare, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { MessageComposer } from "@/components/message-composer";
import { MessageThreadSync } from "@/components/message-thread-sync";
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
      <section><p className="eyebrow">{isArabic ? "تنسيق مباشر وآمن" : "Direct, secure coordination"}</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">{isArabic ? "الرسائل" : "Messages"}</h1><p className="mt-3 text-slate-600">{isArabic ? "تُفتح المحادثة تلقائيًا بعد قبول الطلب، وتبقى مرتبطة بالمناوبة." : "A conversation opens automatically after acceptance and stays linked to the shift."}</p></section>

      {data.conversations.length ? (
        <div className="mt-8 grid min-h-[38rem] overflow-hidden rounded-[1.75rem] border border-brand-950/8 bg-white shadow-sm lg:grid-cols-[20rem_1fr]">
          <aside className="border-b border-slate-100 bg-slate-50/70 lg:border-b-0 lg:border-e" aria-label={isArabic ? "المحادثات" : "Conversations"}>
            <div className="border-b border-slate-100 p-5"><h2 className="font-black">{isArabic ? "المحادثات" : "Conversations"}</h2><p className="mt-1 text-xs text-slate-500">{data.conversations.length} {isArabic ? "محادثة" : "total"}</p></div>
            <div className="max-h-72 overflow-y-auto lg:max-h-[34rem]">
              {data.conversations.map((conversation) => (
                <Link key={conversation.id} href={`${localePath(locale, "/messages")}?conversation=${conversation.id}`} className={`block border-b border-slate-100 p-4 transition hover:bg-white ${conversation.id === data.selectedId ? "bg-white shadow-[inset_3px_0_0_#197a91]" : ""}`}>
                  <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-black">{conversation.shiftTitle}</p>{conversation.unread && <span className="size-2 rounded-full bg-brand-600" aria-label={isArabic ? "غير مقروء" : "Unread"} />}</div>
                  <p className="mt-1 truncate text-xs text-slate-500">{conversation.participantNames.join("، ") || (isArabic ? "فريق المناوبة" : "Shift team")}</p>
                  <p className="mt-2 truncate text-xs text-slate-400">{conversation.latestMessage ?? (isArabic ? "ابدأ المحادثة" : "Start the conversation")}</p>
                </Link>
              ))}
            </div>
          </aside>
          <section className="flex min-h-[32rem] flex-col">
            <header className="flex items-center gap-3 border-b border-slate-100 p-5"><span className="grid size-10 place-items-center rounded-full bg-brand-100 text-brand-700"><UserRound className="size-5" /></span><div><h2 className="font-black">{selected?.shiftTitle}</h2><p className="text-xs text-slate-500">{selected?.participantNames.join("، ")}</p></div></header>
            {data.selectedId && <MessageThreadSync conversationId={data.selectedId} latestMessageId={data.messages.at(-1)?.id} />}
            <div id="message-thread" className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 p-4 sm:p-6" aria-live="polite">
              {data.messages.length ? data.messages.map((message) => {
                const mine = message.authorId === viewer.id;
                return <article key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${mine ? "rounded-ee-md bg-brand-700 text-white" : "rounded-es-md border border-slate-100 bg-white text-slate-700"}`}><p className={`mb-1 text-[10px] font-black ${mine ? "text-brand-100" : "text-brand-700"}`}>{mine ? (isArabic ? "أنت" : "You") : message.authorName}</p><p className="whitespace-pre-wrap break-words">{message.body}</p><time className={`mt-1 flex items-center gap-1 text-[10px] ${mine ? "text-brand-100/70" : "text-slate-400"}`}><Clock3 className="size-3" />{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "short", timeStyle: "short" }).format(new Date(message.createdAt))}</time></div></article>;
              }) : <div className="grid h-full min-h-72 place-items-center text-center"><div><MessageCircle className="mx-auto size-10 text-slate-300" /><h3 className="mt-4 font-black text-slate-700">{isArabic ? "ابدأ التنسيق" : "Start coordinating"}</h3><p className="mt-2 text-sm text-slate-500">{isArabic ? "أرسل أول رسالة بخصوص هذه المناوبة." : "Send the first message about this shift."}</p></div></div>}
            </div>
            {data.selectedId && <MessageComposer conversationId={data.selectedId} locale={locale} />}
          </section>
        </div>
      ) : (
        <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-20 text-center"><MessagesSquare className="mx-auto size-12 text-slate-300" /><h2 className="mt-5 text-xl font-black text-slate-700">{isArabic ? "لا توجد محادثات بعد" : "No conversations yet"}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-500">{isArabic ? "عند قبول طلب على مناوبة، تُنشأ محادثة آمنة تلقائيًا بين الطرفين." : "When an application is accepted, a secure conversation is created automatically for both sides."}</p></div>
      )}
    </DashboardShell>
  );
}
