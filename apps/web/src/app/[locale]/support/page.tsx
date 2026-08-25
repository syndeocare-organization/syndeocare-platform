import type { Metadata } from "next";
import { Clock3, Mail, MessageCircleQuestion } from "lucide-react";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/contact-form";
import { PublicPageShell } from "@/components/public-page-shell";
import { Card } from "@/components/ui/card";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Support" };

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const isArabic = locale === "ar";
  return <PublicPageShell locale={locale}><main id="main-content"><section className="page-shell section-space grid gap-12 lg:grid-cols-[.72fr_1.28fr]"><div><span className="grid size-13 place-items-center rounded-2xl bg-brand-100 text-brand-700"><MessageCircleQuestion className="size-6" /></span><h1 className="mt-7 text-4xl font-black sm:text-5xl">{isArabic ? "كيف نقدر نساعدك؟" : "How can we help?"}</h1><p className="mt-5 text-lg leading-8 text-slate-600">{isArabic ? "أرسل تفاصيل المشكلة أو السؤال، وسيتابعها فريق SyndeoCare." : "Share the issue or question and the SyndeoCare team will follow up."}</p><div className="mt-9 grid gap-4 text-sm text-slate-600"><a href="mailto:support@syndeocare.ai" className="flex items-center gap-3 font-bold text-brand-800"><Mail className="size-5" />support@syndeocare.ai</a><p className="flex items-center gap-3"><Clock3 className="size-5 text-brand-700" />{isArabic ? "الرد عادة خلال يومي عمل" : "Replies are typically sent within two business days"}</p></div></div><Card className="p-6 sm:p-9"><ContactForm locale={locale} /></Card></section></main></PublicPageShell>;
}
