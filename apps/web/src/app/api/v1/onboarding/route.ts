import { onboardingSchema } from "@syndeocare/contracts";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";
import { isTrustedMutation } from "@/lib/request-security";

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);

  const body = await request.json().catch(() => null);
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  if (parsed.data.role !== context.viewer.role) return apiError("ROLE_MISMATCH", "The profile role cannot be changed.", 403);

  const common = {
    full_name_input: parsed.data.fullName,
    phone_input: parsed.data.phone,
    city_input: parsed.data.city,
    country_code_input: parsed.data.countryCode,
    locale_input: parsed.data.locale,
  };
  const result = parsed.data.role === "professional"
    ? await context.supabase.rpc("complete_professional_onboarding", { ...common, specialty_input: parsed.data.specialty, license_number_input: parsed.data.licenseNumber, years_experience_input: parsed.data.yearsExperience })
    : await context.supabase.rpc("complete_organization_onboarding", { ...common, organization_name_input: parsed.data.organizationName, organization_type_input: parsed.data.organizationType, license_number_input: parsed.data.licenseNumber });

  if (result.error) return apiError("ONBOARDING_FAILED", "The profile could not be saved.", 409);
  return apiSuccess({ completed: true });
}
