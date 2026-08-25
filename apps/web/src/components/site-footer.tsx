import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { getCopy, localePath, type Locale } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getCopy(locale);

  return (
    <footer className="border-t border-brand-950/8 bg-white">
      <div className="page-shell grid gap-8 py-12 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <BrandLogo locale={locale} />
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">{t.footer.description}</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-700" aria-label="Footer">
          <Link className="hover:text-brand-700" href={localePath(locale, "/privacy")}>{t.footer.privacy}</Link>
          <Link className="hover:text-brand-700" href={localePath(locale, "/support")}>{t.nav.support}</Link>
          <Link className="hover:text-brand-700" href={localePath(locale, "/delete-account")}>{t.footer.delete}</Link>
        </nav>
      </div>
      <div className="border-t border-brand-950/6 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} SyndeoCare. {t.footer.copyright}
      </div>
    </footer>
  );
}
