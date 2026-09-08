import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { getCopy, localePath, type Locale } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getCopy(locale);

  return (
    <footer className="app-surface app-text app-border border-t">
      <div className="page-shell grid gap-8 py-12 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <BrandLogo locale={locale} />
          <p className="mt-4 max-w-md text-sm leading-7 app-text-muted">{t.footer.description}</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold app-text" aria-label="Footer">
          <Link className="hover:text-brand-700" href={localePath(locale, "/privacy")}>{t.footer.privacy}</Link>
          <Link className="hover:text-brand-700" href={localePath(locale, "/terms")}>{locale === "ar" ? "الشروط" : "Terms"}</Link>
          <Link className="hover:text-brand-700" href={localePath(locale, "/support")}>{t.nav.support}</Link>
          <Link className="hover:text-brand-700" href={localePath(locale, "/delete-account")}>{t.footer.delete}</Link>
        </nav>
      </div>
      <div className="app-border border-t py-5 text-center text-xs app-text-muted">
        © {new Date().getFullYear()} SyndeoCare. {t.footer.copyright}
      </div>
    </footer>
  );
}
