import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { EmailVerificationPage } from "@/components/email-verification-page";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

export default async function CheckEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reason?: string }>;
}) {
  const [{ locale }, query, cookieStore] = await Promise.all([params, searchParams, cookies()]);
  if (!isLocale(locale)) notFound();

  return (
    <EmailVerificationPage
      locale={locale}
      email={cookieStore.get("syndeocare_pending_email")?.value ?? null}
      returning={query.reason === "unconfirmed"}
    />
  );
}
