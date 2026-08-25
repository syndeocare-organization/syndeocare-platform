"use client";

import { AlertCircle, ArrowLeft, ArrowRight, Building2, LoaderCircle, Stethoscope } from "lucide-react";
import { useActionState } from "react";
import { completeOnboarding, type OnboardingState } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import type { Viewer } from "@/lib/auth/dal";
import type { Locale } from "@/lib/i18n";

export function OnboardingForm({ locale, viewer }: { locale: Locale; viewer: Viewer }) {
  const [state, action, pending] = useActionState(completeOnboarding, { status: "idle" } satisfies OnboardingState);
  const isArabic = locale === "ar";
  const isProfessional = viewer.role === "professional";
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <form action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="role" value={viewer.role} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="fullName">{isArabic ? "الاسم الكامل" : "Full name"}</Label>
          <Input id="fullName" name="fullName" defaultValue={viewer.fullName ?? ""} autoComplete="name" required />
        </div>
        <div>
          <Label htmlFor="phone">{isArabic ? "رقم الجوال" : "Mobile number"}</Label>
          <Input id="phone" name="phone" type="tel" dir="ltr" placeholder="+966 5X XXX XXXX" autoComplete="tel" required />
        </div>
        <div>
          <Label htmlFor="city">{isArabic ? "المدينة" : "City"}</Label>
          <Input id="city" name="city" autoComplete="address-level2" required />
        </div>
        <div>
          <Label htmlFor="countryCode">{isArabic ? "الدولة" : "Country"}</Label>
          <Select id="countryCode" name="countryCode" defaultValue="SA">
            <option value="SA">{isArabic ? "السعودية" : "Saudi Arabia"}</option>
            <option value="AE">{isArabic ? "الإمارات" : "United Arab Emirates"}</option>
            <option value="BH">{isArabic ? "البحرين" : "Bahrain"}</option>
            <option value="KW">{isArabic ? "الكويت" : "Kuwait"}</option>
            <option value="OM">{isArabic ? "عُمان" : "Oman"}</option>
            <option value="QA">{isArabic ? "قطر" : "Qatar"}</option>
          </Select>
        </div>

        {isProfessional ? (
          <>
            <div>
              <Label htmlFor="specialty">{isArabic ? "التخصص" : "Specialty"}</Label>
              <Input id="specialty" name="specialty" placeholder={isArabic ? "مثال: تمريض عناية مركزة" : "e.g. Critical care nursing"} required />
            </div>
            <div>
              <Label htmlFor="licenseNumber">{isArabic ? "رقم الترخيص المهني" : "Professional license number"}</Label>
              <Input id="licenseNumber" name="licenseNumber" dir="ltr" required />
            </div>
            <div>
              <Label htmlFor="yearsExperience">{isArabic ? "سنوات الخبرة" : "Years of experience"}</Label>
              <Input id="yearsExperience" name="yearsExperience" type="number" min="0" max="70" defaultValue="0" required />
            </div>
          </>
        ) : (
          <>
            <div className="sm:col-span-2">
              <Label htmlFor="organizationName">{isArabic ? "اسم المنشأة" : "Organization name"}</Label>
              <Input id="organizationName" name="organizationName" autoComplete="organization" required />
            </div>
            <div>
              <Label htmlFor="organizationType">{isArabic ? "نوع المنشأة" : "Organization type"}</Label>
              <Select id="organizationType" name="organizationType" defaultValue="clinic">
                <option value="hospital">{isArabic ? "مستشفى" : "Hospital"}</option>
                <option value="clinic">{isArabic ? "عيادة / مجمع" : "Clinic"}</option>
                <option value="home_care">{isArabic ? "رعاية منزلية" : "Home care"}</option>
                <option value="other">{isArabic ? "أخرى" : "Other"}</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="licenseNumber">{isArabic ? "رقم ترخيص المنشأة" : "Organization license number"}</Label>
              <Input id="licenseNumber" name="licenseNumber" dir="ltr" required />
            </div>
          </>
        )}
      </div>

      {state.message && (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{state.message}
        </div>
      )}

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto sm:justify-self-end">
        {pending ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <Arrow className="size-4" aria-hidden="true" />}
        {pending ? (isArabic ? "جارٍ حفظ الملف..." : "Saving profile...") : (isArabic ? "حفظ ومتابعة" : "Save and continue")}
      </Button>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-5 text-xs text-slate-500">
        {isProfessional ? <Stethoscope className="size-4 text-brand-600" aria-hidden="true" /> : <Building2 className="size-4 text-brand-600" aria-hidden="true" />}
        {isArabic ? "ستتم مراجعة بيانات الترخيص قبل إظهار حالة موثّق." : "License details are reviewed before a verified status is shown."}
      </div>
    </form>
  );
}
