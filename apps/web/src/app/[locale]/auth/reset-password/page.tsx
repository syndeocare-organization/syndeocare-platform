import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PasswordRecoveryPage } from "@/components/password-recovery-page";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <PasswordRecoveryPage locale={locale} mode="update" />;
}
