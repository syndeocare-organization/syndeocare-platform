import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard-overview";
import { DashboardShell } from "@/components/dashboard-shell";
import { getViewer } from "@/lib/auth/dal";
import { getDashboardSummary } from "@/lib/data/dashboard";
import { isLocale, localePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, `/auth/login?next=/${locale}/dashboard`));
  if (!viewer.onboardingComplete) redirect(localePath(locale, "/onboarding"));
  const summary = await getDashboardSummary(viewer);

  return <DashboardShell locale={locale} viewer={viewer}><DashboardOverview locale={locale} viewer={viewer} summary={summary} /></DashboardShell>;
}
