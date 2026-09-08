"use client";

import { AlertCircle, ArrowLeft, ArrowRight, Building2, LoaderCircle, Stethoscope } from "lucide-react";
import { useActionState } from "react";
import { completeOnboarding, type OnboardingState } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/field";
import type { Viewer } from "@/lib/auth/dal";
import type { Locale } from "@/lib/i18n";

export function OnboardingForm({ locale, viewer, teamMember = false }: { locale: Locale; viewer: Viewer; teamMember?: boolean }) {
  const [state, action, pending] = useActionState(completeOnboarding, { status: "idle" } satisfies OnboardingState);
  const isArabic = locale === "ar";
  const isProfessional = viewer.role === "professional";
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="role" value={teamMember ? "organization_member" : viewer.role} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="fullName">{isArabic ? "الاسم الكامل" : "Full name"}</Label>
          <Input id="fullName" name="fullName" defaultValue={viewer.fullName ?? ""} autoComplete="name" aria-invalid={Boolean(state.fieldErrors?.fullName)} aria-describedby={state.fieldErrors?.fullName ? "full-name-error" : undefined} required />
          <FieldError id="full-name-error">{state.fieldErrors?.fullName?.[0]}</FieldError>
        </div>
        <div>
          <Label htmlFor="phone">{isArabic ? "رقم الجوال" : "Mobile number"}</Label>
          <Input id="phone" name="phone" type="tel" dir="ltr" placeholder="+967 / +966" autoComplete="tel" aria-invalid={Boolean(state.fieldErrors?.phone)} aria-describedby={state.fieldErrors?.phone ? "phone-error" : undefined} required />
          <FieldError id="phone-error">{state.fieldErrors?.phone?.[0]}</FieldError>
        </div>
        <div>
          <Label htmlFor="city">{isArabic ? "المدينة" : "City"}</Label>
          <Input id="city" name="city" autoComplete="address-level2" aria-invalid={Boolean(state.fieldErrors?.city)} aria-describedby={state.fieldErrors?.city ? "city-error" : undefined} required />
          <FieldError id="city-error">{state.fieldErrors?.city?.[0]}</FieldError>
        </div>
        <div>
          <Label htmlFor="countryCode">{isArabic ? "الدولة" : "Country"}</Label>
          <Select id="countryCode" name="countryCode" defaultValue="YE" aria-invalid={Boolean(state.fieldErrors?.countryCode)} aria-describedby={state.fieldErrors?.countryCode ? "country-error" : undefined}>
            <option value="YE">{isArabic ? "اليمن" : "Yemen"}</option>
            <option value="SA">{isArabic ? "السعودية" : "Saudi Arabia"}</option>
            <option value="AE">{isArabic ? "الإمارات" : "United Arab Emirates"}</option>
            <option value="BH">{isArabic ? "البحرين" : "Bahrain"}</option>
            <option value="KW">{isArabic ? "الكويت" : "Kuwait"}</option>
            <option value="OM">{isArabic ? "عُمان" : "Oman"}</option>
            <option value="QA">{isArabic ? "قطر" : "Qatar"}</option>
          </Select>
          <FieldError id="country-error">{state.fieldErrors?.countryCode?.[0]}</FieldError>
        </div>

        {isProfessional ? (
          <>
            <div>
              <Label htmlFor="specialty">{isArabic ? "التخصص" : "Specialty"}</Label>
              <Input id="specialty" name="specialty" placeholder={isArabic ? "مثال: تمريض عناية مركزة" : "e.g. Critical care nursing"} aria-invalid={Boolean(state.fieldErrors?.specialty)} aria-describedby={state.fieldErrors?.specialty ? "specialty-error" : undefined} required />
              <FieldError id="specialty-error">{state.fieldErrors?.specialty?.[0]}</FieldError>
            </div>
            <div>
              <Label htmlFor="licenseNumber">{isArabic ? "رقم الترخيص المهني" : "Professional license number"}</Label>
              <Input id="licenseNumber" name="licenseNumber" dir="ltr" aria-invalid={Boolean(state.fieldErrors?.licenseNumber)} aria-describedby={state.fieldErrors?.licenseNumber ? "license-error" : undefined} required />
              <FieldError id="license-error">{state.fieldErrors?.licenseNumber?.[0]}</FieldError>
            </div>
            <div>
              <Label htmlFor="yearsExperience">{isArabic ? "سنوات الخبرة" : "Years of experience"}</Label>
              <Input id="yearsExperience" name="yearsExperience" type="number" min="0" max="70" defaultValue="0" aria-invalid={Boolean(state.fieldErrors?.yearsExperience)} aria-describedby={state.fieldErrors?.yearsExperience ? "experience-error" : undefined} required />
              <FieldError id="experience-error">{state.fieldErrors?.yearsExperience?.[0]}</FieldError>
            </div>
          </>
        ) : teamMember ? null : (
          <>
            <div className="sm:col-span-2">
              <Label htmlFor="organizationName">{isArabic ? "اسم المنشأة" : "Organization name"}</Label>
              <Input id="organizationName" name="organizationName" autoComplete="organization" aria-invalid={Boolean(state.fieldErrors?.organizationName)} aria-describedby={state.fieldErrors?.organizationName ? "organization-name-error" : undefined} required />
              <FieldError id="organization-name-error">{state.fieldErrors?.organizationName?.[0]}</FieldError>
            </div>
            <div>
              <Label htmlFor="organizationType">{isArabic ? "نوع المنشأة" : "Organization type"}</Label>
              <Select id="organizationType" name="organizationType" defaultValue="clinic" aria-invalid={Boolean(state.fieldErrors?.organizationType)} aria-describedby={state.fieldErrors?.organizationType ? "organization-type-error" : undefined}>
                <option value="hospital">{isArabic ? "مستشفى" : "Hospital"}</option>
                <option value="clinic">{isArabic ? "عيادة / مجمع" : "Clinic"}</option>
                <option value="home_care">{isArabic ? "رعاية منزلية" : "Home care"}</option>
                <option value="other">{isArabic ? "أخرى" : "Other"}</option>
              </Select>
              <FieldError id="organization-type-error">{state.fieldErrors?.organizationType?.[0]}</FieldError>
            </div>
            <div>
              <Label htmlFor="licenseNumber">{isArabic ? "رقم ترخيص المنشأة" : "Organization license number"}</Label>
              <Input id="licenseNumber" name="licenseNumber" dir="ltr" aria-invalid={Boolean(state.fieldErrors?.licenseNumber)} aria-describedby={state.fieldErrors?.licenseNumber ? "license-error" : undefined} required />
              <FieldError id="license-error">{state.fieldErrors?.licenseNumber?.[0]}</FieldError>
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
        {teamMember
          ? (isArabic ? "ستنضم إلى المنشأة التي دعتك فور حفظ بياناتك الأساسية." : "You will join the inviting organization after saving your core details.")
          : (isArabic ? "ستتم مراجعة بيانات الترخيص قبل إظهار حالة موثّق." : "License details are reviewed before a verified status is shown.")}
      </div>
    </form>
  );
}
