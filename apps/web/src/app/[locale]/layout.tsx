import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { getSiteUrl } from "@/lib/env";
import { direction, isLocale, locales } from "@/lib/i18n";
import "../globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const isArabic = locale === "ar";
  const title = isArabic
    ? "SyndeoCare | منصة الرعاية الموثوقة"
    : "SyndeoCare | Trusted care, connected";
  const description = isArabic
    ? "نربط المنشآت الصحية بكفاءات تمريضية ورعائية موثقة، بسرعة ووضوح."
    : "Connecting healthcare teams with verified nursing and care professionals.";

  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: title, template: "%s | SyndeoCare" },
    description,
    applicationName: "SyndeoCare",
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: "/ar", en: "/en" },
    },
    openGraph: {
      type: "website",
      locale: isArabic ? "ar_SA" : "en_US",
      siteName: "SyndeoCare",
      title,
      description,
    },
    twitter: { card: "summary", title, description },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfbf7" },
    { media: "(prefers-color-scheme: dark)", color: "#081520" },
  ],
  colorScheme: "light dark",
};

const appearanceScript = `
(() => {
  try {
    const key = 'syndeocare:appearance';
    const value = localStorage.getItem(key);
    const selected = value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = selected === 'system' ? (dark ? 'dark' : 'light') : selected;
    document.documentElement.dataset.theme = resolved;
  } catch {}
})();
`;

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} dir={direction(locale)} suppressHydrationWarning>
      <body className="app-bg app-text min-h-screen antialiased">
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
        <a
          href="#main-content"
          className="fixed start-4 top-3 z-50 -translate-y-24 rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-[var(--background)] focus:translate-y-0"
        >
          {locale === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}
        </a>
        {children}
      </body>
    </html>
  );
}
