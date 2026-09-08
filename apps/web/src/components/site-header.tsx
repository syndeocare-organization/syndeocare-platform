import { ArrowUpLeft, ArrowUpRight, Languages } from "lucide-react";
import Link from "next/link";
import { AppearanceToggle } from "@/components/appearance-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import {
  alternateLocale,
  getCopy,
  localePath,
  type Locale,
} from "@/lib/i18n";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = getCopy(locale);
  const Arrow = locale === "ar" ? ArrowUpLeft : ArrowUpRight;

  return (
    <header className="sticky top-0 z-40 border-b app-border app-bg backdrop-blur-xl">
      <div className="page-shell flex min-h-20 items-center justify-between gap-5">
        <BrandLogo locale={locale} />
        <nav className="hidden items-center gap-7 text-sm font-semibold app-text lg:flex" aria-label="Primary">
          <Link className="hover:text-brand-700" href={localePath(locale, "/#professionals")}>{t.nav.professionals}</Link>
          <Link className="hover:text-brand-700" href={localePath(locale, "/#clinics")}>{t.nav.clinics}</Link>
          <Link className="hover:text-brand-700" href={localePath(locale, "/#safety")}>{t.nav.safety}</Link>
          <Link className="hover:text-brand-700" href={localePath(locale, "/support")}>{t.nav.support}</Link>
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <AppearanceToggle locale={locale} className="hidden md:flex" />
          <Link
            href={localePath(alternateLocale(locale))}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            aria-label={t.nav.language}
          >
            <Languages className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t.nav.language}</span>
          </Link>
          <Link
            className="hidden rounded-full px-4 py-2 text-sm font-bold app-text hover:bg-[var(--surface-muted)] sm:inline-flex"
            href={localePath(locale, "/auth/login")}
          >
            {t.nav.login}
          </Link>
          <Link className={buttonVariants({ size: "sm" })} href={localePath(locale, "/auth/register")}>
            {t.nav.join}
            <Arrow className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
