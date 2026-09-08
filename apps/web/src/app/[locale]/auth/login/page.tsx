import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthPage } from "@/components/auth-page";
import { isLocale } from "@/lib/i18n";
import { safePath } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string; reset?: string; error?: string }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const notice = query.reset === "success"
    ? { tone: "success" as const, message: locale === "ar" ? "تم تحديث كلمة المرور. سجّل الدخول بكلمة المرور الجديدة." : "Your password was updated. Sign in with the new password." }
    : query.error === "callback"
      ? { tone: "error" as const, message: locale === "ar" ? "الرابط غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا." : "The link is invalid or expired. Request a new one." }
      : undefined;
  return <AuthPage locale={locale} mode="login" next={query.next ? safePath(query.next) : undefined} notice={notice} />;
}
