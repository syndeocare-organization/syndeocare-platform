import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Locale } from "@/lib/i18n";

export function PublicPageShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <><SiteHeader locale={locale} />{children}<SiteFooter locale={locale} /></>;
}
