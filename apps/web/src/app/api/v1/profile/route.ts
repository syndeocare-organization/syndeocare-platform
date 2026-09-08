import { profileUpdateSchema } from "@syndeocare/contracts";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";
import { isTrustedMutation } from "@/lib/request-security";

export async function PATCH(request: NextRequest) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  if (parsed.data.role !== context.viewer.role) return apiError("ROLE_MISMATCH", "The account role cannot be changed here.", 403);

  const profileResult = await context.supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      city: parsed.data.city,
      country_code: parsed.data.countryCode,
      locale: parsed.data.locale,
    })
    .eq("id", context.viewer.id);
  if (profileResult.error) return apiError("UPDATE_FAILED", "The profile could not be updated.", 409);

  if (context.viewer.role === "professional") {
    if (!parsed.data.specialty || parsed.data.yearsExperience == null) {
      return apiError("VALIDATION_ERROR", "Professional details are required.", 422);
    }
    const { error } = await context.supabase
      .from("professional_profiles")
      .update({
        specialty: parsed.data.specialty,
        years_experience: parsed.data.yearsExperience,
        bio: parsed.data.bio || null,
        available: parsed.data.available ?? false,
      })
      .eq("user_id", context.viewer.id);
    if (error) return apiError("UPDATE_FAILED", "Professional details could not be updated.", 409);
  }

  if (context.viewer.role === "organization" && parsed.data.organizationName && parsed.data.organizationType) {
    const { data: membership } = await context.supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", context.viewer.id)
      .limit(1)
      .maybeSingle();
    if (membership && ["owner", "manager"].includes(membership.role)) {
      const { error } = await context.supabase
        .from("organizations")
        .update({
          name: parsed.data.organizationName,
          type: parsed.data.organizationType,
          city: parsed.data.city,
          country_code: parsed.data.countryCode,
        })
        .eq("id", membership.organization_id);
      if (error) return apiError("UPDATE_FAILED", "Organization details could not be updated.", 409);
    }
  }

  return apiSuccess({ updated: true });
}
