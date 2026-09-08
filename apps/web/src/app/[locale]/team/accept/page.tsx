import { Building2, ShieldCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { acceptTeamInvitation } from "@/app/actions/team";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getViewer } from "@/lib/auth/dal";
import { isLocale, localePath } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AcceptTeamPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, `/auth/login?next=/${locale}/team/accept`));
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const organizationId = data.user?.app_metadata?.invited_org_id;
  if (typeof organizationId !== "string") redirect(localePath(locale, "/dashboard"));
  let organizationName = locale === "ar" ? "المنشأة الصحية" : "the healthcare organization";
  try {
    const admin = createAdminClient();
    const { data: organization } = await admin.from("organizations").select("name").eq("id", organizationId).maybeSingle();
    if (organization?.name) organizationName = organization.name;
  } catch {}
  const isArabic = locale === "ar";
  return <main className="page-shell grid min-h-screen place-items-center py-12"><div className="w-full max-w-lg"><BrandLogo locale={locale} /><Card className="mt-10 p-7 text-center sm:p-10"><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-brand-100 text-brand-700"><Building2 className="size-8" /></span><p className="eyebrow mt-8">{isArabic ? "دعوة فريق" : "Team invitation"}</p><h1 className="mt-4 text-3xl font-black">{isArabic ? `انضم إلى ${organizationName}` : `Join ${organizationName}`}</h1><p className="mt-4 leading-8 text-slate-600">{isArabic ? "ستحصل على صلاحيات العمل المرسلة لك، ويمكنك إكمال بياناتك الشخصية بعد الانضمام." : "You will receive the assigned workspace access and can complete your personal details next."}</p>{query.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{isArabic ? "تعذر قبول الدعوة الآن. حاول مرة أخرى." : "The invitation could not be accepted. Try again."}</p>}<form action={acceptTeamInvitation} className="mt-7"><input type="hidden" name="locale" value={locale} /><Button type="submit" size="lg" className="w-full"><ShieldCheck className="size-5" />{isArabic ? "قبول والانضمام" : "Accept and join"}</Button></form></Card></div></main>;
}
