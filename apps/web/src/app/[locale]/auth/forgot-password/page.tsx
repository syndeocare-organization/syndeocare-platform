import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PasswordRecoveryPage } from "@/components/password-recovery-page";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Recover account", robots: { index: false, follow: false } };

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <PasswordRecoveryPage locale={locale} mode="request" />;
}
