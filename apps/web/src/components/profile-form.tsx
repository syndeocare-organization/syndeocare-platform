"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select } from "@/components/ui/field";
import type { ProfileDetails } from "@/lib/data/profile";
import type { Locale } from "@/lib/i18n";

const countries = [
  ["YE", "اليمن", "Yemen"],
  ["SA", "السعودية", "Saudi Arabia"],
  ["AE", "الإمارات", "United Arab Emirates"],
  ["BH", "البحرين", "Bahrain"],
  ["KW", "الكويت", "Kuwait"],
  ["OM", "عُمان", "Oman"],
  ["QA", "قطر", "Qatar"],
] as const;

export function ProfileForm({ locale, profile }: { locale: Locale; profile: ProfileDetails }) {
  const isArabic = locale === "ar";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: profile.role,
          fullName: form.get("fullName"),
          phone: form.get("phone"),
          city: form.get("city"),
          countryCode: form.get("countryCode"),
          locale,
          ...(profile.professional ? {
            specialty: form.get("specialty"),
            yearsExperience: Number(form.get("yearsExperience")),
            bio: form.get("bio"),
            available: form.get("available") === "on",
          } : {}),
          ...(profile.organization ? {
            organizationName: form.get("organizationName"),
            organizationType: form.get("organizationType"),
          } : {}),
        }),
      });
      if (!response.ok) throw new Error("update_failed");
      setResult({ ok: true, message: isArabic ? "تم حفظ التغييرات." : "Changes saved." });
      router.refresh();
    } catch {
      setResult({ ok: false, message: isArabic ? "تعذر حفظ التغييرات. راجع الحقول وحاول مجددًا." : "We could not save your changes. Review the fields and try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-7">
      <fieldset className="grid gap-5 sm:grid-cols-2" disabled={pending}>
        <legend className="mb-5 text-lg font-black">{isArabic ? "معلومات الحساب" : "Account details"}</legend>
        <div className="sm:col-span-2"><Label htmlFor="fullName">{isArabic ? "الاسم الكامل" : "Full name"}</Label><Input id="fullName" name="fullName" defaultValue={profile.fullName} autoComplete="name" required /></div>
        <div><Label htmlFor="email">{isArabic ? "البريد الإلكتروني" : "Email"}</Label><Input id="email" value={profile.email} readOnly dir="ltr" className="app-surface-muted app-text-muted" /></div>
        <div><Label htmlFor="phone">{isArabic ? "رقم الجوال" : "Mobile number"}</Label><Input id="phone" name="phone" defaultValue={profile.phone} type="tel" dir="ltr" autoComplete="tel" required /></div>
        <div><Label htmlFor="city">{isArabic ? "المدينة" : "City"}</Label><Input id="city" name="city" defaultValue={profile.city} autoComplete="address-level2" required /></div>
        <div><Label htmlFor="countryCode">{isArabic ? "الدولة" : "Country"}</Label><Select id="countryCode" name="countryCode" defaultValue={profile.countryCode}>{countries.map(([code, ar, en]) => <option key={code} value={code}>{isArabic ? ar : en}</option>)}</Select></div>
      </fieldset>

      {profile.professional && (
        <fieldset className="grid gap-5 border-t border-slate-100 pt-7 sm:grid-cols-2" disabled={pending}>
          <legend className="mb-5 text-lg font-black">{isArabic ? "الملف المهني" : "Professional profile"}</legend>
          <div><Label htmlFor="specialty">{isArabic ? "التخصص" : "Specialty"}</Label><Input id="specialty" name="specialty" defaultValue={profile.professional.specialty} required /></div>
          <div><Label htmlFor="yearsExperience">{isArabic ? "سنوات الخبرة" : "Years of experience"}</Label><Input id="yearsExperience" name="yearsExperience" type="number" min="0" max="70" defaultValue={profile.professional.yearsExperience} required /></div>
          <div className="sm:col-span-2"><Label htmlFor="licenseNumber">{isArabic ? "رقم الترخيص" : "License number"}</Label><Input id="licenseNumber" value={profile.professional.licenseNumber} readOnly dir="ltr" className="app-surface-muted app-text-muted" /><FieldHint>{isArabic ? "لتغيير رقم الترخيص تواصل مع الدعم حفاظًا على حالة التحقق." : "Contact support to change a license number without compromising verification."}</FieldHint></div>
          <div className="sm:col-span-2"><Label htmlFor="bio">{isArabic ? "نبذة مهنية" : "Professional bio"}</Label><textarea id="bio" name="bio" rows={5} maxLength={2000} defaultValue={profile.professional.bio} className="app-surface app-text app-border w-full rounded-xl border px-4 py-3 outline-none focus:border-[var(--ring)] focus:ring-4 focus:ring-[color:var(--ring)]/10" /></div>
          <label className="flex items-center gap-3 text-sm font-bold text-slate-700"><input type="checkbox" name="available" defaultChecked={profile.professional.available} className="size-4 accent-brand-700" />{isArabic ? "متاح لاستقبال فرص جديدة" : "Available for new opportunities"}</label>
        </fieldset>
      )}

      {profile.organization && (
        <fieldset className="grid gap-5 border-t border-slate-100 pt-7 sm:grid-cols-2" disabled={pending || !["owner", "manager"].includes(profile.organization.memberRole)}>
          <legend className="mb-5 text-lg font-black">{isArabic ? "بيانات المنشأة" : "Organization details"}</legend>
          <div className="sm:col-span-2"><Label htmlFor="organizationName">{isArabic ? "اسم المنشأة" : "Organization name"}</Label><Input id="organizationName" name="organizationName" defaultValue={profile.organization.name} required /></div>
          <div><Label htmlFor="organizationType">{isArabic ? "نوع المنشأة" : "Organization type"}</Label><Select id="organizationType" name="organizationType" defaultValue={profile.organization.type}><option value="hospital">{isArabic ? "مستشفى" : "Hospital"}</option><option value="clinic">{isArabic ? "عيادة / مجمع" : "Clinic"}</option><option value="home_care">{isArabic ? "رعاية منزلية" : "Home care"}</option><option value="other">{isArabic ? "أخرى" : "Other"}</option></Select></div>
          <div><Label htmlFor="organizationLicense">{isArabic ? "رقم الترخيص" : "License number"}</Label><Input id="organizationLicense" value={profile.organization.licenseNumber} readOnly dir="ltr" className="app-surface-muted app-text-muted" /></div>
        </fieldset>
      )}

      {result && <div role={result.ok ? "status" : "alert"} className={`flex items-start gap-3 rounded-xl p-4 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{result.ok ? <CheckCircle2 className="mt-0.5 size-4" /> : <AlertCircle className="mt-0.5 size-4" />}{result.message}</div>}
      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto sm:justify-self-end">{pending ? <LoaderCircle className="size-5 animate-spin" /> : <Save className="size-5" />}{pending ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ التغييرات" : "Save changes")}</Button>
    </form>
  );
}
