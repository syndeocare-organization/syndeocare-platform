import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/public-page-shell";
import { Card } from "@/components/ui/card";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Terms of use" };

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const sections = ar ? [
    ["استخدام المنصة", "تربط SyndeoCare مقدمي الرعاية بالمنشآت الصحية. يجب تقديم معلومات صحيحة، والمحافظة على سرية الحساب، واستخدام المنصة لأغراض مهنية وقانونية فقط."],
    ["التحقق والقرارات", "قد نطلب مستندات للتحقق من الهوية والترخيص. الاعتماد داخل المنصة لا يستبدل متطلبات الجهات التنظيمية أو مسؤولية المنشأة في التحقق قبل التعاقد."],
    ["المناوبات والطلبات", "ينشئ كل طرف بياناته وقراراته بنفسه. يجب أن تكون تفاصيل المناوبة والأجر والأوقات دقيقة، وأن يتم الإلغاء أو التعديل مبكرًا قدر الإمكان."],
    ["السلوك الآمن", "يُمنع انتحال الهوية، مشاركة بيانات دخول الآخرين، إساءة استخدام المعلومات الصحية أو الشخصية، أو إرسال محتوى مؤذٍ أو غير قانوني."],
    ["تعليق الحساب", "يجوز تقييد الحساب عند الاشتباه في إساءة الاستخدام أو انتهاء الترخيص أو مخالفة هذه الشروط، مع إتاحة التواصل مع الدعم للمراجعة."],
    ["التواصل", "لأي سؤال حول هذه الشروط استخدم صفحة الدعم داخل SyndeoCare."],
  ] : [
    ["Using the platform", "SyndeoCare connects care professionals and healthcare organizations. Provide accurate information, protect your account, and use the platform only for lawful professional purposes."],
    ["Verification and decisions", "We may request identity and license documents. Platform verification does not replace regulatory requirements or an organization's responsibility to verify credentials before engagement."],
    ["Shifts and applications", "Each party controls its own listings and decisions. Shift, pay, and schedule details must be accurate, and cancellations or changes should be made as early as possible."],
    ["Safe conduct", "Impersonation, sharing another person's credentials, misuse of health or personal information, and harmful or unlawful content are prohibited."],
    ["Account restriction", "We may restrict accounts when misuse, expired credentials, or a violation is suspected. Support remains available for review."],
    ["Contact", "For questions about these terms, use the SyndeoCare support page."],
  ];
  return <PublicPageShell locale={locale}><section className="mx-auto max-w-4xl py-12 sm:py-20"><p className="eyebrow">{ar ? "اتفاق واضح" : "A clear agreement"}</p><h1 className="mt-4 text-4xl font-black sm:text-5xl">{ar ? "شروط الاستخدام" : "Terms of use"}</h1><p className="mt-4 text-sm text-slate-500">{ar ? "آخر تحديث: 4 سبتمبر 2026" : "Last updated: September 4, 2026"}</p><div className="mt-9 grid gap-4">{sections.map(([title, body]) => <Card key={title} className="p-6 sm:p-8"><h2 className="text-xl font-black">{title}</h2><p className="mt-3 leading-8 text-slate-600">{body}</p></Card>)}</div></section></PublicPageShell>;
}
