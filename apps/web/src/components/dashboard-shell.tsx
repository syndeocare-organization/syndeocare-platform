import { Bell, ChevronDown, LayoutDashboard, LogOut, Settings, UsersRound } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import type { Viewer } from "@/lib/auth/dal";
import { localePath, type Locale } from "@/lib/i18n";
import { initials } from "@/lib/utils";

export function DashboardShell({ locale, viewer, children }: { locale: Locale; viewer: Viewer; children: React.ReactNode }) {
  const isArabic = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="page-shell flex min-h-20 items-center justify-between gap-4">
          <BrandLogo locale={locale} />
          <nav className="hidden items-center gap-1 rounded-full bg-slate-100 p-1 md:flex" aria-label={isArabic ? "لوحة التحكم" : "Dashboard"}>
            <Link className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-brand-900 shadow-sm" href={localePath(locale, "/dashboard")}><LayoutDashboard className="size-4" aria-hidden="true" />{isArabic ? "الرئيسية" : "Overview"}</Link>
            <Link className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-slate-600 hover:text-brand-800" href={localePath(locale, "/shifts")}><UsersRound className="size-4" aria-hidden="true" />{viewer.role === "professional" ? (isArabic ? "الفرص" : "Opportunities") : (isArabic ? "المناوبات" : "Shifts")}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label={isArabic ? "الإشعارات" : "Notifications"}><Bell className="size-5" /></button>
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 py-1 pe-3 ps-1 sm:flex">
              <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-xs font-black text-brand-800">{initials(viewer.fullName)}</span>
              <span className="max-w-28 truncate text-xs font-black text-slate-800">{viewer.fullName ?? viewer.email}</span>
              <ChevronDown className="size-3 text-slate-400" aria-hidden="true" />
            </div>
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label={isArabic ? "تسجيل الخروج" : "Sign out"}><LogOut className="size-5" /></button>
            </form>
          </div>
        </div>
      </header>
      <main id="main-content" className="page-shell py-8 sm:py-12">{children}</main>
      <footer className="page-shell flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-6 text-xs text-slate-500">
        <span>© {new Date().getFullYear()} SyndeoCare</span>
        <Link className="inline-flex items-center gap-2 font-bold hover:text-brand-700" href={localePath(locale, "/privacy")}><Settings className="size-3.5" />{isArabic ? "الخصوصية والإعدادات" : "Privacy & settings"}</Link>
      </footer>
    </div>
  );
}
