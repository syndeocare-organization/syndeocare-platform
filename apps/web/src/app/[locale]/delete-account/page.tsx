import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { DeleteAccountPanel } from "@/components/delete-account-panel";
import { PublicPageShell } from "@/components/public-page-shell";
import { Card } from "@/components/ui/card";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Delete account" };

export default async function DeleteAccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  return <PublicPageShell locale={locale}><main id="main-content" className="page-shell section-space"><div className="mx-auto max-w-2xl"><span className="grid size-13 place-items-center rounded-2xl bg-red-50 text-red-700"><Trash2 className="size-6" /></span><h1 className="mt-7 text-4xl font-black sm:text-5xl">{ar ? "حذف حساب SyndeoCare" : "Delete your SyndeoCare account"}</h1><p className="mt-5 text-lg leading-8 text-slate-600">{ar ? "هذه الصفحة تتيح حذف الحساب والبيانات المرتبطة به حتى إذا لم يعد التطبيق مثبتًا على جهازك." : "This page lets you delete your account and associated data even if the app is no longer installed."}</p><Card className="mt-9 p-6 sm:p-9"><DeleteAccountPanel locale={locale} /></Card><p className="mt-6 text-center text-sm text-slate-500">{ar ? "إذا تعذر الحذف، راسل support@syndeocare.ai من بريد الحساب." : "If deletion fails, email support@syndeocare.ai from the account address."}</p></div></main></PublicPageShell>;
}
