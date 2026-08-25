import {
  ArrowUpLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarCheck2,
  Check,
  ClipboardCheck,
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCopy, localePath, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const trustIcons = [BadgeCheck, LockKeyhole, ClipboardCheck];

export function LandingPage({ locale }: { locale: Locale }) {
  const t = getCopy(locale);
  const Arrow = locale === "ar" ? ArrowUpLeft : ArrowUpRight;

  return (
    <>
      <SiteHeader locale={locale} />
      <main id="main-content">
        <section className="relative isolate overflow-hidden border-b border-brand-950/6">
          <div className="soft-grid absolute inset-0 -z-20 opacity-60" />
          <div className="absolute -start-32 top-16 -z-10 size-[28rem] rounded-full bg-brand-200/45 blur-3xl" />
          <div className="absolute -end-32 bottom-0 -z-10 size-[25rem] rounded-full bg-violet-500/12 blur-3xl" />
          <div className="page-shell grid min-h-[calc(100svh-5rem)] items-center gap-14 py-16 lg:grid-cols-[1.02fr_.98fr] lg:py-20">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-700/12 bg-white/80 px-4 py-2 text-xs font-bold text-brand-800 shadow-sm backdrop-blur">
                <Sparkles className="size-4 text-violet-500" aria-hidden="true" />
                {t.hero.eyebrow}
              </div>
              <h1 className="text-balance text-[clamp(2.8rem,7vw,5.8rem)] font-black leading-[1.02] tracking-[-0.045em] text-brand-950">
                {t.hero.titleLead}{" "}
                <span className="bg-gradient-to-l from-brand-500 via-brand-700 to-violet-600 bg-clip-text text-transparent">
                  {t.hero.titleAccent}
                </span>
              </h1>
              <p className="mt-7 max-w-xl text-balance text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
                {t.hero.description}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link className={buttonVariants({ size: "lg" })} href={localePath(locale, "/auth/register?role=professional")}>
                  <Stethoscope className="size-5" aria-hidden="true" />
                  {t.hero.primary}
                  <Arrow className="size-4" aria-hidden="true" />
                </Link>
                <Link className={buttonVariants({ variant: "secondary", size: "lg" })} href={localePath(locale, "/auth/register?role=organization")}>
                  <Building2 className="size-5" aria-hidden="true" />
                  {t.hero.secondary}
                </Link>
              </div>
              <p className="mt-6 text-xs font-semibold text-slate-500">{t.hero.assurance}</p>
            </div>

            <HeroPanel locale={locale} />
          </div>
          <div className="page-shell grid border-t border-brand-950/7 sm:grid-cols-3">
            {t.stats.map(([value, label], index) => (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-4 py-6 sm:justify-center sm:px-8",
                  index > 0 && "border-t border-brand-950/7 sm:border-t-0 sm:border-s",
                )}
              >
                <strong className="text-xl font-black text-brand-800">{value}</strong>
                <span className="text-sm text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section-space bg-white" aria-labelledby="roles-title">
          <div className="page-shell">
            <div className="max-w-2xl">
              <p className="eyebrow">{t.roles.eyebrow}</p>
              <h2 id="roles-title" className="mt-4 text-balance text-3xl font-black tracking-tight text-brand-950 sm:text-5xl">
                {t.roles.title}
              </h2>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <RoleCard id="professionals" locale={locale} icon={Stethoscope} item={t.roles.professional} href="/auth/register?role=professional" tone="brand" />
              <RoleCard id="clinics" locale={locale} icon={Building2} item={t.roles.clinic} href="/auth/register?role=organization" tone="violet" />
            </div>
          </div>
        </section>

        <section className="section-space bg-cream-100/70" aria-labelledby="steps-title">
          <div className="page-shell">
            <div className="mx-auto max-w-3xl text-center">
              <p className="eyebrow justify-center before:hidden">{t.steps.eyebrow}</p>
              <h2 id="steps-title" className="mt-4 text-balance text-3xl font-black tracking-tight sm:text-5xl">
                {t.steps.title}
              </h2>
            </div>
            <ol className="mt-14 grid gap-6 md:grid-cols-3">
              {t.steps.items.map(([number, title, description]) => (
                <li key={number} className="relative rounded-3xl border border-brand-950/7 bg-white p-7 shadow-sm">
                  <span className="text-4xl font-black tracking-tighter text-brand-200">{number}</span>
                  <h3 className="mt-8 text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="safety" className="section-space overflow-hidden bg-brand-950 text-white" aria-labelledby="safety-title">
          <div className="page-shell grid items-center gap-14 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="eyebrow !text-brand-300">{t.safety.eyebrow}</p>
              <h2 id="safety-title" className="mt-4 text-balance text-3xl font-black tracking-tight sm:text-5xl">
                {t.safety.title}
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-8 text-brand-100/75">{t.safety.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {t.safety.items.map(([title, description], index) => {
                const Icon = trustIcons[index];
                return (
                  <div key={title} className="rounded-3xl border border-white/10 bg-white/[.06] p-6 backdrop-blur">
                    <div className="grid size-11 place-items-center rounded-2xl bg-brand-300/15 text-brand-200">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <h3 className="mt-8 font-black">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-brand-100/65">{description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section-space bg-white">
          <div className="page-shell">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-100 via-brand-50 to-violet-500/15 px-6 py-16 text-center sm:px-14">
              <HeartPulse className="mx-auto size-10 text-brand-700" aria-hidden="true" />
              <h2 className="mx-auto mt-6 max-w-3xl text-balance text-3xl font-black tracking-tight sm:text-5xl">{t.finalCta.title}</h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-600">{t.finalCta.description}</p>
              <Link className={cn(buttonVariants({ size: "lg" }), "mt-8")} href={localePath(locale, "/auth/register")}>
                {t.finalCta.button}<Arrow className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}

function HeroPanel({ locale }: { locale: Locale }) {
  const isArabic = locale === "ar";
  const professionals = isArabic
    ? [["سارة محمد", "تمريض عناية مركزة"], ["نورة خالد", "رعاية منزلية"], ["أحمد علي", "تمريض طوارئ"]]
    : [["Sarah M.", "Critical care nurse"], ["Noura K.", "Home care professional"], ["Ahmed A.", "Emergency nurse"]];

  return (
    <div className="relative mx-auto w-full max-w-xl lg:mx-0">
      <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2.5rem] bg-gradient-to-br from-brand-300/30 to-violet-500/20 blur-sm" />
      <Card className="overflow-hidden rounded-[2rem] bg-white/92 p-3 shadow-[0_40px_100px_-45px_rgba(8,41,54,.65)] backdrop-blur">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <div><p className="text-xs font-bold text-slate-400">{isArabic ? "التغطية القادمة" : "Upcoming coverage"}</p><p className="mt-1 font-black text-brand-950">{isArabic ? "فريق الرعاية" : "Care team"}</p></div>
          <div className="grid size-10 place-items-center rounded-2xl bg-brand-50 text-brand-700"><UsersRound className="size-5" aria-hidden="true" /></div>
        </div>
        <div className="grid gap-3 p-3">
          {professionals.map(([name, specialty], index) => (
            <div key={name} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-cream-50/70 p-3.5">
              <div className={cn("grid size-11 shrink-0 place-items-center rounded-full text-sm font-black", index === 1 ? "bg-violet-500/12 text-violet-600" : "bg-brand-100 text-brand-800")}>{name.slice(0, 1)}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{name}</p><p className="mt-0.5 truncate text-xs text-slate-500">{specialty}</p></div>
              <BadgeCheck className="size-5 shrink-0 text-brand-500" aria-label={isArabic ? "موثّق" : "Verified"} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 p-3 pt-0">
          <div className="rounded-2xl bg-brand-950 p-4 text-white"><CalendarCheck2 className="size-5 text-brand-300" aria-hidden="true" /><p className="mt-5 text-2xl font-black">08</p><p className="mt-1 text-xs text-brand-100/65">{isArabic ? "مناوبات مؤكدة" : "Confirmed shifts"}</p></div>
          <div className="rounded-2xl bg-brand-100 p-4 text-brand-950"><ShieldCheck className="size-5 text-brand-700" aria-hidden="true" /><p className="mt-5 text-2xl font-black">100%</p><p className="mt-1 text-xs text-brand-800/70">{isArabic ? "فريق موثّق" : "Verified team"}</p></div>
        </div>
      </Card>
      <div className="absolute -bottom-6 -start-5 flex items-center gap-3 rounded-2xl border border-brand-950/8 bg-white p-3.5 shadow-xl sm:-start-8">
        <span className="grid size-9 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="size-4" aria-hidden="true" /></span>
        <div><p className="text-xs font-black">{isArabic ? "تمت المطابقة" : "Match confirmed"}</p><p className="mt-0.5 text-[11px] text-slate-500">{isArabic ? "قبل دقيقتين" : "2 minutes ago"}</p></div>
      </div>
    </div>
  );
}

type RoleCopy = { readonly label: string; readonly title: string; readonly description: string; readonly items: readonly string[]; readonly cta: string };

function RoleCard({ id, locale, icon: Icon, item, href, tone }: { id: string; locale: Locale; icon: typeof Stethoscope; item: RoleCopy; href: string; tone: "brand" | "violet" }) {
  const Arrow = locale === "ar" ? ArrowUpLeft : ArrowUpRight;
  return (
    <Card id={id} className="group scroll-mt-28 overflow-hidden p-7 transition hover:-translate-y-1 sm:p-9">
      <div className={cn("grid size-13 place-items-center rounded-2xl", tone === "brand" ? "bg-brand-100 text-brand-700" : "bg-violet-500/12 text-violet-600")}><Icon className="size-6" aria-hidden="true" /></div>
      <p className="mt-8 text-xs font-black uppercase tracking-wider text-slate-400">{item.label}</p>
      <h3 className="mt-2 text-2xl font-black sm:text-3xl">{item.title}</h3>
      <p className="mt-4 max-w-xl leading-8 text-slate-600">{item.description}</p>
      <ul className="mt-7 grid gap-3 text-sm font-semibold text-slate-700">
        {item.items.map((text) => <li key={text} className="flex items-center gap-3"><Check className="size-4 text-brand-600" aria-hidden="true" />{text}</li>)}
      </ul>
      <Link href={localePath(locale, href)} className="mt-9 inline-flex items-center gap-2 text-sm font-black text-brand-700 hover:text-brand-900">
        {item.cta}<Arrow className="size-4 transition group-hover:-translate-y-0.5" aria-hidden="true" />
      </Link>
    </Card>
  );
}
