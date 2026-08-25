import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/public-page-shell";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const sections = ar ? [
    ["البيانات التي نعالجها", "قد تشمل بيانات الحساب والاتصال، الملف المهني والتراخيص، بيانات المنشأة والعضوية، المناوبات والطلبات، الرسائل، المستندات التي ترفعها، وبيانات تقنية محدودة لحماية الخدمة."],
    ["لماذا نستخدم البيانات", "لتشغيل الحساب، مطابقة الكفاءات بالاحتياج، التحقق من الملفات، تمكين التواصل، تقديم الدعم، حماية المنصة، والوفاء بالمتطلبات النظامية."],
    ["من يمكنه الاطلاع", "يظهر لكل مستخدم الحد الأدنى اللازم لدوره. قد يطلع مقدمون تقنيون موثوقون مثل مزود الاستضافة وقاعدة البيانات والبريد على البيانات اللازمة لتقديم خدماتهم لنا."],
    ["الاحتفاظ والحذف", "نحتفظ بالبيانات طوال مدة الحساب وبالقدر اللازم للأغراض الموضحة. عند طلب الحذف، نمحو البيانات أو نفصلها عن هويتك، مع استثناء السجلات التي يلزم الاحتفاظ بها نظاميًا أو لمنع الاحتيال وتسوية النزاعات."],
    ["حقوقك وخياراتك", "يمكنك طلب الوصول أو التصحيح أو الحذف أو الاعتراض حيثما ينطبق، كما يمكنك حذف الحساب من داخل التطبيق أو من صفحة حذف الحساب على الويب."],
    ["الأمن ونقل البيانات", "نستخدم التشفير أثناء النقل، صلاحيات دقيقة، وسياسات وصول على مستوى السجلات. قد تُعالج البيانات في دول توفر فيها الجهات التقنية بنيتها، مع تطبيق الضمانات المناسبة."],
  ] : [
    ["Data we process", "This may include account and contact details, professional profiles and licenses, organization memberships, shifts and applications, messages, uploaded documents, and limited technical data used to protect the service."],
    ["Why we use it", "To operate accounts, match professionals with staffing needs, verify profiles, enable communication, provide support, secure the platform, and meet legal obligations."],
    ["Who can access it", "Each user sees only what is necessary for their role. Trusted infrastructure, database, and email providers may process the limited data required to deliver services to us."],
    ["Retention and deletion", "We keep data while an account is active and as needed for the purposes above. Following deletion, we erase or de-identify data except where limited records must be retained for legal obligations, fraud prevention, or dispute resolution."],
    ["Your rights and choices", "You may request access, correction, deletion, or objection where applicable. Accounts can be deleted in the app or through the web account-deletion page."],
    ["Security and international processing", "We use encryption in transit, fine-grained permissions, and row-level access controls. Data may be processed where our technical providers operate, subject to appropriate safeguards."],
  ];
  return <PublicPageShell locale={locale}><main id="main-content" className="page-shell section-space"><article className="mx-auto max-w-3xl"><span className="grid size-13 place-items-center rounded-2xl bg-brand-100 text-brand-700"><ShieldCheck className="size-6" /></span><p className="eyebrow mt-8">{ar ? "آخر تحديث: 24 أغسطس 2026" : "Last updated: August 24, 2026"}</p><h1 className="mt-4 text-4xl font-black sm:text-5xl">{ar ? "سياسة الخصوصية" : "Privacy Policy"}</h1><p className="mt-6 text-lg leading-9 text-slate-600">{ar ? "توضح هذه السياسة كيف تتعامل SyndeoCare مع البيانات عند استخدام الموقع أو التطبيق أو خدمات المنصة. سنحدّثها عند تغيّر الممارسات أو المتطلبات." : "This policy explains how SyndeoCare handles data when you use the website, mobile app, or platform services. We update it as practices or requirements change."}</p><div className="mt-12 grid gap-10">{sections.map(([title, body]) => <section key={title}><h2 className="text-xl font-black">{title}</h2><p className="mt-3 leading-8 text-slate-600">{body}</p></section>)}</div><section className="mt-12 rounded-2xl bg-brand-50 p-6"><h2 className="font-black">{ar ? "تواصل معنا" : "Contact us"}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{ar ? "لأسئلة الخصوصية أو لممارسة حقوقك، راسلنا على privacy@syndeocare.ai." : "For privacy questions or to exercise your rights, email privacy@syndeocare.ai."}</p><a href="mailto:privacy@syndeocare.ai" className="mt-3 inline-block font-black text-brand-700">privacy@syndeocare.ai</a></section></article></main></PublicPageShell>;
}
