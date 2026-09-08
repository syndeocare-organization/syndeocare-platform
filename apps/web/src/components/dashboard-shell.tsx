import { Bell, BriefcaseBusiness, FileCheck2, LayoutDashboard, LogOut, MessageCircle, Settings, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { AppearanceToggle } from "@/components/appearance-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import type { Viewer } from "@/lib/auth/dal";
import { localePath, type Locale } from "@/lib/i18n";
import { initials } from "@/lib/utils";

type ActivePage = "dashboard" | "shifts" | "applications" | "messages" | "verification" | "team" | "profile" | "admin" | "notifications";

export function DashboardShell({ locale, viewer, activePage, unreadCount, children }: { locale: Locale; viewer: Viewer; activePage: ActivePage; unreadCount: number; children: React.ReactNode }) {
  const isArabic = locale === "ar";
  const dashboardLabel = isArabic ? "الرئيسية" : "Overview";
  const shiftsLabel = viewer.role === "professional" ? (isArabic ? "الفرص" : "Opportunities") : (isArabic ? "المناوبات" : "Shifts");
  const navLink = (active: boolean) => `inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm transition ${active ? "bg-[var(--primary)] font-black text-[var(--primary-foreground)] shadow-sm" : "font-bold app-text-muted hover:bg-[var(--surface)]"}`;
  const items: Array<{ page: ActivePage; href: string; label: string; icon: LucideIcon }> = viewer.role === "admin"
    ? [
        { page: "dashboard", href: "/dashboard", label: dashboardLabel, icon: LayoutDashboard },
        { page: "admin", href: "/admin", label: isArabic ? "المراجعة" : "Admin", icon: ShieldCheck },
      ]
    : [
        { page: "dashboard", href: "/dashboard", label: dashboardLabel, icon: LayoutDashboard },
        { page: "shifts", href: "/shifts", label: shiftsLabel, icon: BriefcaseBusiness },
        { page: "applications", href: "/applications", label: isArabic ? "الطلبات" : "Applications", icon: FileCheck2 },
        { page: "messages", href: "/messages", label: isArabic ? "الرسائل" : "Messages", icon: MessageCircle },
        viewer.role === "organization"
          ? { page: "team", href: "/team", label: isArabic ? "الفريق" : "Team", icon: UsersRound }
          : { page: "profile", href: "/profile", label: isArabic ? "ملفي" : "Profile", icon: UserRound },
      ];

  return (
    <div className="app-bg app-text min-h-screen">
      <header className="app-surface app-border sticky top-0 z-40 border-b">
        <div className="page-shell flex min-h-20 items-center justify-between gap-4">
          <BrandLogo locale={locale} />
          <nav className="app-surface-muted hidden items-center gap-1 rounded-full p-1 lg:flex" aria-label={isArabic ? "التنقل الرئيسي" : "Primary navigation"}>
            {items.map((item) => <Link key={item.page} className={navLink(activePage === item.page)} aria-current={activePage === item.page ? "page" : undefined} href={localePath(locale, item.href)}><item.icon className="size-4" aria-hidden="true" />{item.label}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            <AppearanceToggle locale={locale} className="hidden md:flex" />
            <Link href={localePath(locale, "/notifications")} className={`${buttonVariants({ variant: activePage === "notifications" ? "secondary" : "ghost", size: "icon" })} relative`} aria-label={isArabic ? `الإشعارات، ${unreadCount} غير مقروء` : `Notifications, ${unreadCount} unread`} aria-current={activePage === "notifications" ? "page" : undefined}><Bell className="size-5" />{unreadCount > 0 && <span className="absolute -end-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white">{Math.min(unreadCount, 99)}</span>}</Link>
            <Link href={localePath(locale, "/profile")} className="app-border flex items-center gap-2 rounded-full border p-1 transition hover:bg-[var(--surface-muted)] sm:pe-3" aria-label={isArabic ? "فتح الملف الشخصي" : "Open profile"}>
              <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-xs font-black text-brand-800">{initials(viewer.fullName)}</span>
              <span className="hidden max-w-28 truncate text-xs font-black app-text sm:inline">{viewer.fullName ?? viewer.email}</span>
            </Link>
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label={isArabic ? "تسجيل الخروج" : "Sign out"}><LogOut className="size-5" /></button>
            </form>
          </div>
        </div>
      </header>
      <main id="main-content" className="page-shell safe-bottom-nav pt-8 sm:py-12">{children}</main>
      <footer className="page-shell app-border flex flex-wrap items-center justify-between gap-3 border-t py-6 text-xs app-text-muted">
        <span>© {new Date().getFullYear()} SyndeoCare</span>
        <div className="inline-flex items-center gap-4">
          <Link className="inline-flex items-center gap-2 font-bold hover:text-brand-700" href={localePath(locale, "/support")}>{isArabic ? "الدعم" : "Support"}</Link>
          <Link className="inline-flex items-center gap-2 font-bold hover:text-brand-700" href={localePath(locale, "/privacy")}><Settings className="size-3.5" />{isArabic ? "الخصوصية والإعدادات" : "Privacy & settings"}</Link>
        </div>
      </footer>
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-flow-col auto-cols-fr rounded-2xl border app-border app-surface p-1.5 app-shadow backdrop-blur lg:hidden" aria-label={isArabic ? "التنقل الرئيسي" : "Primary navigation"}>
        {items.map((item) => <Link key={item.page} className={`grid min-h-14 place-items-center content-center gap-1 rounded-xl px-1 text-[10px] font-bold transition ${activePage === item.page ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "app-text-muted"}`} aria-current={activePage === item.page ? "page" : undefined} href={localePath(locale, item.href)}><item.icon className="size-5" aria-hidden="true" /><span className="max-w-16 truncate">{item.label}</span></Link>)}
      </nav>
    </div>
  );
}
