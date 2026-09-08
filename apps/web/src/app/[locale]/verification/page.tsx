import type { Metadata } from "next";
import { FileCheck2, LockKeyhole } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { DocumentCenter } from "@/components/document-center";
import { getViewer } from "@/lib/auth/dal";
import { getDocuments } from "@/lib/data/documents";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { isLocale, localePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Verification", robots: { index: false, follow: false } };

export default async function VerificationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, `/auth/login?next=/${locale}/verification`));
  if (!viewer.onboardingComplete) redirect(localePath(locale, "/onboarding"));
  const [documents, unreadCount] = await Promise.all([getDocuments(viewer.id), getUnreadNotificationCount(viewer.id)]);
  const isArabic = locale === "ar";
  return (
    <DashboardShell locale={locale} viewer={viewer} activePage="verification" unreadCount={unreadCount}>
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="eyebrow">{isArabic ? "ثقة موثّقة" : "Verified trust"}</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">{isArabic ? "المستندات والتحقق" : "Documents & verification"}</h1><p className="mt-3 max-w-2xl text-slate-600">{isArabic ? "اعرف المطلوب، ارفع الملف مرة واحدة، وتابع المراجعة بوضوح." : "See what is needed, upload once, and track review clearly."}</p></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-xs font-black text-brand-800"><LockKeyhole className="size-4" />{isArabic ? "تخزين خاص ومشفّر" : "Private, protected storage"}</span>
      </section>
      <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm leading-7 text-brand-900"><FileCheck2 className="me-2 inline size-4" />{isArabic ? "ارفع صورًا واضحة أو PDF. إذا احتاج المراجع تعديلًا ستظهر الملاحظة بجانب المستند." : "Upload clear images or PDFs. If changes are needed, the review note appears beside the document."}</div>
      <div className="mt-7"><DocumentCenter locale={locale} documents={documents} /></div>
    </DashboardShell>
  );
}
