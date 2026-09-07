import type { Metadata } from "next";
import { BadgeCheck, Building2, MapPin, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { TeamInviteForm } from "@/components/team-invite-form";
import { Card } from "@/components/ui/card";
import { getViewer } from "@/lib/auth/dal";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { getTeamData } from "@/lib/data/team";
import { isLocale, localePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Team", robots: { index: false, follow: false } };

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, `/auth/login?next=/${locale}/team`));
  if (!viewer.onboardingComplete) redirect(localePath(locale, "/onboarding"));
  if (viewer.role !== "organization" && viewer.role !== "admin") redirect(localePath(locale, "/dashboard"));
  const [team, unreadCount] = await Promise.all([getTeamData(viewer), getUnreadNotificationCount(viewer.id)]);
  if (!team) redirect(localePath(locale, "/onboarding"));
  const isArabic = locale === "ar";
  const roleLabels: Record<string, [string, string]> = { owner: ["المالك", "Owner"], manager: ["مدير", "Manager"], recruiter: ["مسؤول توظيف", "Recruiter"], viewer: ["مشاهدة", "Viewer"] };
  const canInvite = ["owner", "manager"].includes(team.viewerMemberRole);
  return (
    <DashboardShell locale={locale} viewer={viewer} activePage="team" unreadCount={unreadCount}>
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">{isArabic ? "مساحة المنشأة" : "Organization workspace"}</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">{isArabic ? "الفريق والصلاحيات" : "Team & access"}</h1><p className="mt-3 text-slate-600">{isArabic ? "دعوات واضحة وصلاحيات محددة لكل عضو." : "Clear invitations and an explicit access level for each member."}</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black shadow-sm"><Building2 className="size-4 text-brand-600" />{team.organizationName}</span></section>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="grid content-start gap-4">
          {team.members.map((member) => <Card key={member.userId} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-full bg-brand-100 text-brand-700"><UserRound className="size-5" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-black">{member.fullName ?? (isArabic ? "عضو الفريق" : "Team member")}</h2>{member.verificationStatus === "verified" && <BadgeCheck className="size-4 text-emerald-600" aria-label={isArabic ? "موثّق" : "Verified"} />}</div>{member.city && <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500"><MapPin className="size-3" />{member.city}</p>}</div></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700"><ShieldCheck className="size-3.5" />{roleLabels[member.memberRole]?.[isArabic ? 0 : 1] ?? member.memberRole}</span></Card>)}
        </section>
        <Card className="h-fit p-6"><UsersRound className="size-7 text-brand-600" /><h2 className="mt-5 text-xl font-black">{isArabic ? "إضافة عضو" : "Add a member"}</h2><p className="mt-2 text-sm leading-7 text-slate-500">{isArabic ? "إذا كان البريد مسجلًا سيُضاف الحساب، وإلا تصله دعوة لإنشاء الحساب." : "Existing accounts are added; new users receive an account invitation."}</p><div className="mt-6"><TeamInviteForm locale={locale} canInvite={canInvite} canInviteManager={team.viewerMemberRole === "owner"} /></div></Card>
      </div>
    </DashboardShell>
  );
}
