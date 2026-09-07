"use server";

import { onboardingSchema } from "@syndeocare/contracts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localizedFieldErrors } from "@/lib/form-errors";
import { localePath } from "@/lib/i18n";

export type OnboardingState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const onboardingFieldMessages = {
  fullName: ["أدخل الاسم الكامل.", "Enter your full name."],
  phone: ["أدخل رقم جوال صحيحًا مع مفتاح الدولة.", "Enter a valid mobile number with the country code."],
  city: ["أدخل المدينة.", "Enter your city."],
  countryCode: ["اختر الدولة.", "Choose your country."],
  specialty: ["أدخل التخصص المهني.", "Enter your professional specialty."],
  licenseNumber: ["أدخل رقم ترخيص صحيحًا.", "Enter a valid license number."],
  yearsExperience: ["أدخل سنوات الخبرة بين 0 و70.", "Enter years of experience between 0 and 70."],
  organizationName: ["أدخل اسم المنشأة.", "Enter the organization name."],
  organizationType: ["اختر نوع المنشأة.", "Choose the organization type."],
} as const;

export async function completeOnboarding(_previous: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const input = Object.fromEntries(formData);
  const parsed = onboardingSchema.safeParse(input);
  const locale = input.locale === "en" ? "en" : "ar";

  if (!parsed.success) {
    return {
      status: "error",
      message: locale === "ar" ? "راجع الحقول المطلوبة ثم حاول مرة أخرى." : "Review the required fields and try again.",
      fieldErrors: localizedFieldErrors(
        parsed.error,
        locale,
        onboardingFieldMessages,
        ["تحقق من هذا الحقل.", "Check this field."],
      ),
    };
  }

  try {
    const supabase = await createClient();
    const common = {
      full_name_input: parsed.data.fullName,
      phone_input: parsed.data.phone,
      city_input: parsed.data.city,
      country_code_input: parsed.data.countryCode,
      locale_input: parsed.data.locale,
    };

    const result = parsed.data.role === "professional"
      ? await supabase.rpc("complete_professional_onboarding", {
          ...common,
          specialty_input: parsed.data.specialty,
          license_number_input: parsed.data.licenseNumber,
          years_experience_input: parsed.data.yearsExperience,
        })
      : parsed.data.role === "organization_member"
        ? await supabase.rpc("complete_organization_member_onboarding", common)
        : await supabase.rpc("complete_organization_onboarding", {
          ...common,
          organization_name_input: parsed.data.organizationName,
          organization_type_input: parsed.data.organizationType,
          license_number_input: parsed.data.licenseNumber,
          });

    if (result.error) {
      return {
        status: "error",
        message: locale === "ar" ? "تعذر حفظ الملف. تحقق من رقم الترخيص أو حاول لاحقًا." : "We could not save your profile. Check the license number or try again.",
      };
    }
  } catch {
    return {
      status: "error",
      message: locale === "ar" ? "الخدمة غير متاحة مؤقتًا. حاول لاحقًا." : "The service is temporarily unavailable. Try again later.",
    };
  }

  revalidatePath("/", "layout");
  redirect(localePath(locale, "/dashboard"));
}
