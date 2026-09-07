import type { Metadata } from "next";
import { Building2, FileCheck2, ShieldCheck, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AdminReviewActions } from "@/components/admin-review-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { getViewer } from "@/lib/auth/dal";
import { getAdminReviewData } from "@/lib/data/admin";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { isLocale, localePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin review", robots: { index: false, follow: false } };

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, `/auth/login?next=/${locale}/admin`));
  if (viewer.role !== "admin") redirect(localePath(locale, "/dashboard"));
  const [data, unreadCount] = await Promise.all([getAdminReviewData(), getUnreadNotificationCount(viewer.id)]);
  const isArabic = locale === "ar";
  return <DashboardShell locale={locale} viewer={viewer} activePage="admin" unreadCount={unreadCount}>
    <section><p className="eyebrow">{isArabic ? "الثقة والسلامة" : "Trust & safety"}</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">{isArabic ? "مركز المراجعة" : "Review center"}</h1><p className="mt-3 text-slate-600">{isArabic ? "الحسابات والمنشآت والمستندات التي تحتاج قرارًا واضحًا." : "Accounts, organizations, and documents waiting for a clear decision."}</p></section>
    <section className="mt-8 grid gap-4 sm:grid-cols-3">{[[isArabic ? "ملفات" : "Profiles", data.profiles.length, UserRound], [isArabic ? "منشآت" : "Organizations", data.organizations.length, Building2], [isArabic ? "مستندات" : "Documents", data.documents.length, FileCheck2]].map(([label, count, Icon]) => { const ReviewIcon = Icon as typeof ShieldCheck; return <Card key={String(label)} className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-2xl bg-brand-100 text-brand-700"><ReviewIcon className="size-5" /></span><div><p className="text-2xl font-black">{String(count).padStart(2, "0")}</p><p className="text-xs text-slate-500">{String(label)}</p></div></Card>; })}</section>
    <div className="mt-8 grid gap-8">
      <ReviewSection title={isArabic ? "المنشآت" : "Organizations"} empty={isArabic ? "لا توجد منشآت بانتظار المراجعة." : "No organizations are waiting."}>{data.organizations.map((item) => <Card key={item.id} className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center"><div><h3 className="font-black">{item.name}</h3><p className="mt-2 text-sm text-slate-500">{item.type} · {item.city} · <span dir="ltr">{item.licenseNumber}</span></p></div><AdminReviewActions resource="organization" id={item.id} locale={locale} allowSuspend={item.status === "suspended"} /></Card>)}</ReviewSection>
      <ReviewSection title={isArabic ? "ملفات الحسابات" : "Account profiles"} empty={isArabic ? "لا توجد ملفات بانتظار المراجعة." : "No profiles are waiting."}>{data.profiles.map((item) => <Card key={item.id} className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center"><div><h3 className="font-black">{item.fullName ?? item.id}</h3><p className="mt-2 text-sm text-slate-500">{item.role} · {item.city ?? "—"}</p></div><AdminReviewActions resource="profile" id={item.id} locale={locale} /></Card>)}</ReviewSection>
      <ReviewSection title={isArabic ? "المستندات" : "Documents"} empty={isArabic ? "لا توجد مستندات بانتظار المراجعة." : "No documents are waiting."}>{data.documents.map((item) => <Card key={item.id} className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center"><div><h3 className="font-black">{item.ownerName ?? item.ownerId}</h3><p className="mt-2 text-sm text-slate-500">{item.type} · {item.filename}</p><a className="mt-3 inline-flex text-xs font-black text-brand-700 underline" href={`/api/v1/documents/${item.id}`} target="_blank" rel="noreferrer">{isArabic ? "فتح المستند" : "Open document"}</a></div><AdminReviewActions resource="document" id={item.id} locale={locale} /></Card>)}</ReviewSection>
    </div>
  </DashboardShell>;
}

function ReviewSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section><h2 className="mb-4 text-xl font-black">{title}</h2><div className="grid gap-4">{hasChildren ? children : <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">{empty}</div>}</div></section>;
}
