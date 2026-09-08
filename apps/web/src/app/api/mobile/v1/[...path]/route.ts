import { type NextRequest } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/auth/api-context";
import { getSiteUrl } from "@/lib/env";
import {
  createMobileAuthClient,
  mapNotificationToMobile,
  mapShiftToMobile,
  mobileError,
  mobileJson,
  mobilePrincipal,
  mobileRole,
  mobileSessionPayload,
  mobileVerification,
} from "@/lib/mobile-api";
import { isTrustedMutation } from "@/lib/request-security";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Context = NonNullable<Awaited<ReturnType<typeof getApiContext>>>;

const organizationTypes = new Set(["hospital", "clinic", "home_care", "other"]);
const uploadTypes = {
  "uploads/verification-document": new Map([
    ["application/pdf", "pdf"],
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
  ]),
  "uploads/profile-image": new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ]),
  "uploads/chat-media": new Map([
    ["application/pdf", "pdf"],
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["video/mp4", "mp4"],
    ["video/quicktime", "mov"],
    ["video/webm", "webm"],
  ]),
} as const;

function organizationType(value: unknown) {
  return typeof value === "string" && organizationTypes.has(value) ? value : "other";
}

async function storedObject(context: Context, bucket: string, storageKey: string) {
  const separator = storageKey.lastIndexOf("/");
  if (separator < 1 || separator === storageKey.length - 1) return null;
  const folder = storageKey.slice(0, separator);
  const fileName = storageKey.slice(separator + 1);
  const { data, error } = await context.supabase.storage
    .from(bucket)
    .list(folder, { limit: 10, search: fileName });
  if (error) return null;
  return data.find((file) => file.name === fileName) ?? null;
}

function key(path: string[]) {
  return path.join("/");
}

async function jsonBody(request: NextRequest) {
  return request.json().catch(() => null) as Promise<Record<string, unknown> | null>;
}

function mutationAllowed(request: NextRequest) {
  return isTrustedMutation(request) || request.headers.get("authorization")?.startsWith("Bearer ");
}

async function requireContext(request: NextRequest) {
  const context = await getApiContext(request);
  return context ?? null;
}

async function authSignIn(request: NextRequest) {
  const body = await jsonBody(request);
  const parsed = z.object({ email: z.email(), password: z.string().min(6) }).safeParse(body);
  if (!parsed.success) return mobileError("AUTH_INVALID_INPUT", "Enter a valid email and password.", 422);
  const supabase = createMobileAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email.trim().toLowerCase(), password: parsed.data.password });
  if (error || !data.user || !data.session) {
    return mobileError(error?.code === "email_not_confirmed" ? "AUTH_EMAIL_NOT_VERIFIED" : "AUTH_INVALID_CREDENTIALS", error?.code === "email_not_confirmed" ? "Verify your email before signing in." : "Email or password is incorrect.", 401);
  }
  const payload = await mobileSessionPayload(supabase, data.user, data.session, false);
  return payload ? mobileJson(payload) : mobileError("PROFILE_NOT_FOUND", "Your profile could not be loaded.", 409);
}

async function authSignUp(request: NextRequest) {
  const body = await jsonBody(request);
  const parsed = z.object({
    displayName: z.string().trim().min(2).max(100),
    email: z.email(),
    password: z.string().min(10).max(128).regex(/\p{L}/u).regex(/\p{N}/u),
    role: z.enum(["professional", "clinic"]),
  }).safeParse(body);
  if (!parsed.success) return mobileError("AUTH_INVALID_INPUT", "Review the account details and password.", 422);
  const supabase = createMobileAuthClient();
  const role = parsed.data.role === "clinic" ? "organization" : "professional";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email.trim().toLowerCase(),
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/confirm?next=/ar/onboarding`,
      data: { full_name: parsed.data.displayName, role, locale: "ar" },
    },
  });
  if (error || !data.user) return mobileError("AUTH_SIGNUP_FAILED", error?.code === "over_email_send_rate_limit" ? "A verification email was sent recently. Wait a minute and try again." : "The account could not be created.", 409);
  if (!data.session) return mobileJson({ requiresEmailConfirmation: true, email: parsed.data.email.trim().toLowerCase() }, 202);
  const payload = await mobileSessionPayload(supabase, data.user, data.session, true);
  return payload ? mobileJson(payload, 201) : mobileError("PROFILE_NOT_FOUND", "Your profile could not be loaded.", 409);
}

async function authRefresh(request: NextRequest) {
  const body = await jsonBody(request);
  const parsed = z.object({ refreshToken: z.string().min(20) }).safeParse(body);
  if (!parsed.success) return mobileError("AUTH_REFRESH_INVALID", "The refresh token is invalid.", 422);
  const supabase = createMobileAuthClient();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: parsed.data.refreshToken });
  if (error || !data.user || !data.session) return mobileError("AUTH_SESSION_EXPIRED", "Please sign in again.", 401);
  const payload = await mobileSessionPayload(supabase, data.user, data.session, false);
  return payload ? mobileJson(payload) : mobileError("PROFILE_NOT_FOUND", "Your profile could not be loaded.", 409);
}

async function authMail(request: NextRequest, kind: "recovery" | "signup") {
  const body = await jsonBody(request);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!z.email().safeParse(email).success) return mobileError("AUTH_INVALID_EMAIL", "Enter a valid email address.", 422);
  const supabase = createMobileAuthClient();
  const redirectTo = `${getSiteUrl()}/auth/confirm?next=/ar/${kind === "recovery" ? "auth/reset-password" : "onboarding"}`;
  const { error } = kind === "recovery"
    ? await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    : await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectTo } });
  if (error) return mobileError("AUTH_EMAIL_FAILED", "The email could not be sent. Try again later.", 429);
  return mobileJson({ delivered: true });
}

async function me(request: NextRequest) {
  const context = await requireContext(request);
  if (!context) return mobileError("UNAUTHORIZED", "Please sign in again.", 401);
  const { data } = await context.supabase.auth.getUser();
  if (!data.user) return mobileError("UNAUTHORIZED", "Please sign in again.", 401);
  const principal = await mobilePrincipal(context.supabase, data.user, {
    full_name: context.viewer.fullName,
    role: context.viewer.role,
    onboarding_complete: context.viewer.onboardingComplete,
    verification_status: context.viewer.verificationStatus,
  });
  return principal ? mobileJson(principal) : mobileError("PROFILE_NOT_FOUND", "Your profile could not be loaded.", 404);
}

const requiredDocuments: Record<string, string[]> = {
  professional: ["identity", "professional_license"],
  organization: ["identity", "professional_license"],
  admin: [],
};

async function onboardingStatus(request: NextRequest, submit: boolean) {
  const context = await requireContext(request);
  if (!context) return mobileError("UNAUTHORIZED", "Please sign in again.", 401);
  const { data: existingMembership } = context.viewer.role === "organization"
    ? await context.supabase.from("organization_members").select("organization_id, role").eq("user_id", context.viewer.id).limit(1).maybeSingle()
    : { data: null };
  const { data: documents } = await context.supabase.from("documents").select("type, storage_path, created_at").eq("owner_id", context.viewer.id);
  const invitedTeamMember = Boolean(existingMembership && !context.viewer.onboardingComplete);
  const required = invitedTeamMember ? [] : requiredDocuments[context.viewer.role] ?? [];
  const uploaded = (documents ?? []).map((document) => ({ documentType: document.type, bucket: "verification-documents", key: document.storage_path, uploadedAt: document.created_at }));
  const uploadedTypes = new Set(uploaded.map((document) => document.documentType));
  const missingDocuments = required.filter((document) => !uploadedTypes.has(document));
  if (submit) {
    if (!context.viewer.onboardingComplete) return mobileError("ONBOARDING_INCOMPLETE", "Complete your profile before submitting it for review.", 409);
    if (missingDocuments.length) return mobileError("DOCUMENTS_REQUIRED", "Upload the required verification documents first.", 409);
    const { error } = await context.supabase.from("profiles").update({ verification_status: "pending" }).eq("id", context.viewer.id).neq("verification_status", "verified");
    if (error) return mobileError("SUBMIT_FAILED", "The profile could not be submitted for review.", 409);
  }
  return mobileJson({
    role: mobileRole(context.viewer.role),
    onboardingCompleted: context.viewer.onboardingComplete,
    verificationStatus: mobileVerification(context.viewer.verificationStatus),
    requiredDocuments: required,
    missingDocuments,
    uploadedDocuments: uploaded,
    nextAction: context.viewer.onboardingComplete ? "Awaiting verification review" : "Complete your profile",
  });
}

const catalog: Record<string, Array<{ name: string; nameAr: string; required?: boolean }>> = {
  specialty: [
    { name: "Nursing", nameAr: "تمريض" }, { name: "General practice", nameAr: "طب عام" }, { name: "Emergency care", nameAr: "طوارئ" }, { name: "Laboratory", nameAr: "مختبر" }, { name: "Pharmacy", nameAr: "صيدلة" }, { name: "Physiotherapy", nameAr: "علاج طبيعي" },
  ],
  job_role: [
    { name: "Registered nurse", nameAr: "ممرض/ة مسجل/ة" }, { name: "General practitioner", nameAr: "طبيب عام" }, { name: "Laboratory technician", nameAr: "فني مختبر" }, { name: "Pharmacist", nameAr: "صيدلي" },
  ],
  certification: [
    { name: "Basic Life Support", nameAr: "الإنعاش القلبي الأساسي" }, { name: "Advanced Cardiac Life Support", nameAr: "دعم الحياة القلبي المتقدم" },
  ],
  document_type: [
    { name: "Identity", nameAr: "الهوية", required: true }, { name: "Professional License", nameAr: "الترخيص المهني", required: true }, { name: "Certificate", nameAr: "الشهادة" }, { name: "Insurance", nameAr: "التأمين" },
  ],
};

function catalogItems(kind: string) {
  const values = catalog[kind];
  if (!values) return mobileError("INVALID_CATALOG", "The requested catalog does not exist.", 404);
  return mobileJson({ items: values.map((item, index) => ({ id: `${kind}-${index + 1}`, kind, name: item.name, nameAr: item.nameAr, abbreviation: null, description: null, isActive: true, isRequired: item.required ?? false, appliesTo: "all", allowedExtensions: kind === "document_type" ? ["pdf", "jpg", "png"] : [], maxSizeMb: 10, displayOrder: index + 1, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" })) });
}

async function professionalProfile(context: Context) {
  const { data: profile } = await context.supabase.from("profiles").select("full_name, phone, city, region, country_code, latitude, longitude, verification_status, onboarding_complete, avatar_path").eq("id", context.viewer.id).single();
  const { data: professional } = await context.supabase.from("professional_profiles").select("specialty, headline, bio, license_number, years_experience, languages, available, location_radius_km, rating").eq("user_id", context.viewer.id).maybeSingle();
  if (!profile) return null;
  const config = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return {
    id: context.viewer.id,
    fullName: profile.full_name ?? "",
    specialty: professional?.specialty ?? "Pending onboarding",
    headline: professional?.headline ?? undefined,
    bio: professional?.bio ?? undefined,
    licenseNumber: professional?.license_number ?? undefined,
    primaryPhone: profile.phone ?? undefined,
    yearsExperience: professional?.years_experience ?? 0,
    languages: professional?.languages ?? ["ar"],
    rating: Number(professional?.rating ?? 0),
    verificationStatus: mobileVerification(profile.verification_status),
    onboardingCompleted: profile.onboarding_complete,
    profileImageUrl: profile.avatar_path ? `${config}/storage/v1/object/public/avatars/${profile.avatar_path}` : undefined,
    city: profile.city ?? "",
    region: profile.region ?? profile.city ?? "",
    latitude: profile.latitude,
    longitude: profile.longitude,
    availability: { status: professional?.available === false ? "unavailable" : "available", locationRadiusKm: professional?.location_radius_km ?? 25 },
  };
}

async function clinicProfile(context: Context) {
  const { data: profile } = await context.supabase.from("profiles").select("phone, city, region, latitude, longitude, verification_status, onboarding_complete, avatar_path").eq("id", context.viewer.id).single();
  const { data: membership } = await context.supabase.from("organization_members").select("organization_id, role").eq("user_id", context.viewer.id).limit(1).maybeSingle();
  const { data: organization } = membership ? await context.supabase.from("organizations").select("id, name, type, license_number, description, contact_phone, website_url, services, city, region, latitude, longitude, status, logo_path, rating").eq("id", membership.organization_id).single() : { data: null };
  if (!profile) return null;
  const { count } = organization ? await context.supabase.from("shifts").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).in("status", ["draft", "published", "filled"]) : { count: 0 };
  const config = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const canManageOrganization = !membership || ["owner", "manager"].includes(membership.role);
  const organizationLogo = organization?.logo_path ? `${config}/storage/v1/object/public/organization-assets/${organization.logo_path}` : undefined;
  const memberAvatar = profile.avatar_path ? `${config}/storage/v1/object/public/avatars/${profile.avatar_path}` : undefined;
  return {
    id: organization?.id ?? context.viewer.id,
    organizationName: organization?.name ?? context.viewer.fullName ?? "",
    facilityType: organization?.type ?? "pending onboarding",
    licenseNumber: organization?.license_number ?? undefined,
    memberRole: membership?.role ?? undefined,
    canManageOrganization,
    description: organization?.description ?? undefined,
    contactPhone: organization?.contact_phone ?? profile.phone ?? undefined,
    websiteUrl: organization?.website_url ?? undefined,
    services: organization?.services ?? [],
    city: organization?.city ?? profile.city ?? "",
    region: organization?.region ?? profile.region ?? profile.city ?? "",
    latitude: organization?.latitude ?? profile.latitude,
    longitude: organization?.longitude ?? profile.longitude,
    verificationStatus: mobileVerification(profile.verification_status),
    onboardingCompleted: profile.onboarding_complete,
    logoUrl: organizationLogo ?? memberAvatar,
    openRoles: count ?? 0,
    rating: Number(organization?.rating ?? 0),
  };
}

async function getProfile(request: NextRequest, kind: "professional" | "clinic") {
  const context = await requireContext(request);
  if (!context) return mobileError("UNAUTHORIZED", "Please sign in again.", 401);
  const data = kind === "professional" ? await professionalProfile(context) : await clinicProfile(context);
  return data ? mobileJson(data) : mobileError("PROFILE_NOT_FOUND", "The profile was not found.", 404);
}

async function updateProfessional(request: NextRequest) {
  const context = await requireContext(request);
  if (!context) return mobileError("UNAUTHORIZED", "Please sign in again.", 401);
  if (context.viewer.role !== "professional") return mobileError("FORBIDDEN", "A professional account is required.", 403);
  const body = await jsonBody(request);
  if (!body) return mobileError("VALIDATION_ERROR", "Profile data is required.", 422);
  const location = body.location as Record<string, unknown> | undefined;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const specialty = typeof body.specialty === "string" ? body.specialty.trim() : "";
  const licenseNumber = typeof body.licenseNumber === "string" ? body.licenseNumber.trim() : "";
  const phone = typeof body.primaryPhone === "string" ? body.primaryPhone.trim() : "";
  const city = typeof location?.city === "string" ? location.city : "";
  const yearsExperience = Number(body.yearsExperience ?? 0);
  if (!fullName || !specialty || !phone || !city || !licenseNumber) return mobileError("VALIDATION_ERROR", "Complete the required profile fields.", 422);
  if (!context.viewer.onboardingComplete) {
    const { error } = await context.supabase.rpc("complete_professional_onboarding", { full_name_input: fullName, phone_input: phone, city_input: city, country_code_input: "YE", locale_input: "ar", specialty_input: specialty, license_number_input: licenseNumber, years_experience_input: yearsExperience });
    if (error) return mobileError("UPDATE_FAILED", "The profile could not be completed.", 409);
  } else {
    const { error } = await context.supabase.from("profiles").update({ full_name: fullName, phone, city, region: location?.region, latitude: location?.latitude, longitude: location?.longitude }).eq("id", context.viewer.id);
    if (error) return mobileError("UPDATE_FAILED", "The profile could not be updated.", 409);
  }
  const availability = body.availability as Record<string, unknown> | undefined;
  const { error: professionalError } = await context.supabase.from("professional_profiles").update({ specialty, headline: body.headline, bio: body.bio, years_experience: yearsExperience, languages: Array.isArray(body.languages) ? body.languages : ["ar"], available: availability?.status !== "unavailable", location_radius_km: Number(availability?.locationRadiusKm ?? 25) }).eq("user_id", context.viewer.id);
  if (professionalError) return mobileError("UPDATE_FAILED", "The professional details could not be updated.", 409);
  const refreshed = { ...context, viewer: { ...context.viewer, onboardingComplete: true } };
  return mobileJson(await professionalProfile(refreshed));
}

async function updateClinic(request: NextRequest) {
  const context = await requireContext(request);
  if (!context) return mobileError("UNAUTHORIZED", "Please sign in again.", 401);
  if (context.viewer.role !== "organization") return mobileError("FORBIDDEN", "An organization account is required.", 403);
  const body = await jsonBody(request);
  const location = body?.location as Record<string, unknown> | undefined;
  const name = typeof body?.organizationName === "string" ? body.organizationName.trim() : "";
  const phone = typeof body?.contactPhone === "string" ? body.contactPhone.trim() : "";
  const city = typeof location?.city === "string" ? location.city : "";
  const licenseNumber = typeof body?.licenseNumber === "string" ? body.licenseNumber.trim() : "";
  const facilityType = organizationType(body?.facilityType);
  if (!name || !phone || !city) return mobileError("VALIDATION_ERROR", "Complete the required organization fields.", 422);
  let { data: membership } = await context.supabase.from("organization_members").select("organization_id, role").eq("user_id", context.viewer.id).limit(1).maybeSingle();
  if (!context.viewer.onboardingComplete) {
    const common = { full_name_input: context.viewer.fullName || name, phone_input: phone, city_input: city, country_code_input: "YE", locale_input: "ar" };
    if (membership) {
      const { error } = await context.supabase.rpc("complete_organization_member_onboarding", common);
      if (error) return mobileError("UPDATE_FAILED", "The team profile could not be completed.", 409);
    } else {
      if (licenseNumber.length < 3) return mobileError("VALIDATION_ERROR", "Enter a valid organization license number.", 422);
      const { error } = await context.supabase.rpc("complete_organization_onboarding", { ...common, organization_name_input: name, organization_type_input: facilityType, license_number_input: licenseNumber });
      if (error) return mobileError("UPDATE_FAILED", "The organization profile could not be completed.", 409);
      const membershipResult = await context.supabase.from("organization_members").select("organization_id, role").eq("user_id", context.viewer.id).limit(1).maybeSingle();
      membership = membershipResult.data;
    }
  }
  if (!membership) return mobileError("ORGANIZATION_NOT_FOUND", "The organization was not found.", 404);
  const { error: profileError } = await context.supabase.from("profiles").update({ phone, city, region: location?.region, latitude: location?.latitude, longitude: location?.longitude }).eq("id", context.viewer.id);
  if (profileError) return mobileError("UPDATE_FAILED", "The account contact details could not be updated.", 409);
  if (["owner", "manager"].includes(membership.role)) {
    const { error } = await context.supabase.from("organizations").update({ name, type: facilityType, description: body?.description, contact_phone: phone, website_url: body?.websiteUrl, services: Array.isArray(body?.services) ? body.services : [], city, region: location?.region, latitude: location?.latitude, longitude: location?.longitude }).eq("id", membership.organization_id);
    if (error) return mobileError("UPDATE_FAILED", "The organization profile could not be updated.", 409);
  }
  const refreshed = { ...context, viewer: { ...context.viewer, onboardingComplete: true } };
  return mobileJson(await clinicProfile(refreshed));
}

async function listProfessionals(request: NextRequest) {
  const context = await requireContext(request);
  if (!context) return mobileError("UNAUTHORIZED", "Please sign in again.", 401);
  if (context.viewer.role !== "organization" && context.viewer.role !== "admin") return mobileError("FORBIDDEN", "Organization access is required.", 403);
  if (context.viewer.role === "organization") {
    if (!context.viewer.onboardingComplete || context.viewer.verificationStatus !== "verified") return mobileError("VERIFICATION_REQUIRED", "Organization verification is required before browsing professionals.", 403);
    const { data: membership } = await context.supabase.from("organization_members").select("organization_id, organizations(status)").eq("user_id", context.viewer.id).limit(1).maybeSingle();
    const organizationRelation = membership?.organizations as { status?: string } | Array<{ status?: string }> | null;
    const organization = Array.isArray(organizationRelation) ? organizationRelation[0] : organizationRelation;
    if (!membership || organization?.status !== "active") return mobileError("ORGANIZATION_NOT_ACTIVE", "The organization must be approved before browsing professionals.", 403);
  }
  const { data: profiles, error } = await context.supabase.from("profiles").select("id, full_name, phone, city, region, latitude, longitude, verification_status, onboarding_complete, avatar_path, professional_profiles(specialty, headline, bio, license_number, years_experience, languages, available, location_radius_km, rating)").eq("role", "professional").eq("verification_status", "verified").limit(100);
  if (error) return mobileError("QUERY_FAILED", "Professionals could not be loaded.", 500);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const items = (profiles ?? []).map((profile) => {
    const relation = profile.professional_profiles as Record<string, unknown> | Array<Record<string, unknown>> | null;
    const professional = Array.isArray(relation) ? relation[0] : relation;
    return { id: profile.id, fullName: profile.full_name ?? "", specialty: professional?.specialty ?? "", headline: professional?.headline, bio: professional?.bio, licenseNumber: professional?.license_number, primaryPhone: profile.phone, yearsExperience: Number(professional?.years_experience ?? 0), languages: professional?.languages ?? ["ar"], rating: Number(professional?.rating ?? 0), verificationStatus: mobileVerification(profile.verification_status), onboardingCompleted: profile.onboarding_complete, profileImageUrl: profile.avatar_path ? `${base}/storage/v1/object/public/avatars/${profile.avatar_path}` : undefined, city: profile.city ?? "", region: profile.region ?? profile.city ?? "", latitude: profile.latitude, longitude: profile.longitude, availability: { status: professional?.available === false ? "unavailable" : "available", locationRadiusKm: Number(professional?.location_radius_km ?? 25) } };
  });
  return mobileJson({ items, total: items.length });
}

async function protectedAuthMutation(request: NextRequest, action: "password" | "account") {
  const context = await requireContext(request);
  if (!context) return mobileError("UNAUTHORIZED", "Please sign in again.", 401);
  if (action === "account") {
    try {
      const admin = createAdminClient();
      const { error } = await admin.auth.admin.deleteUser(context.viewer.id);
      return error ? mobileError("DELETE_FAILED", "The account could not be deleted.", 409) : mobileJson({ deleted: true });
    } catch {
      return mobileError("SERVICE_NOT_CONFIGURED", "Account deletion is not configured.", 503);
    }
  }
  const body = await jsonBody(request);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < 10 || !/\p{L}/u.test(password) || !/\p{N}/u.test(password)) {
    return mobileError("VALIDATION_ERROR", "Use at least 10 characters with a letter and number.", 422);
  }
  const verifier = createMobileAuthClient();
  const { error: signInError } = await verifier.auth.signInWithPassword({ email: context.viewer.email, password: currentPassword });
  if (signInError) return mobileError("AUTH_INVALID_CREDENTIALS", "The current password is incorrect.", 401);
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(context.viewer.id, { password });
    return error ? mobileError("UPDATE_FAILED", "The password could not be updated.", 409) : mobileJson({ updated: true });
  } catch {
    return mobileError("SERVICE_NOT_CONFIGURED", "Password updates are not configured.", 503);
  }
}

async function logout(request: NextRequest) {
  const body = await jsonBody(request);
  if (typeof body?.refreshToken !== "string") return mobileJson({ loggedOut: true });
  const supabase = createMobileAuthClient();
  await supabase.auth.setSession({ access_token: request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "", refresh_token: body.refreshToken }).catch(() => null);
  await supabase.auth.signOut().catch(() => null);
  return mobileJson({ loggedOut: true });
}

async function dispatchGet(request: NextRequest, path: string[]) {
  const route = key(path);
  if (route === "me") return me(request);
  if (route === "onboarding/status") return onboardingStatus(request, false);
  if (route === "catalog") return catalogItems(request.nextUrl.searchParams.get("kind") ?? "");
  if (route === "profiles/me") return getProfile(request, "professional");
  if (route === "clinics/me") return getProfile(request, "clinic");
  if (route === "profiles") return listProfessionals(request);
  return mobileDataGet(request, path);
}

async function dispatchPost(request: NextRequest, path: string[]) {
  const route = key(path);
  if (!mutationAllowed(request)) return mobileError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  if (route === "auth/signin") return authSignIn(request);
  if (route === "auth/signup") return authSignUp(request);
  if (route === "auth/refresh") return authRefresh(request);
  if (route === "auth/logout") return logout(request);
  if (route === "auth/password-reset/request") return authMail(request, "recovery");
  if (route === "auth/email-verification/request") return authMail(request, "signup");
  if (route === "auth/password") return protectedAuthMutation(request, "password");
  return mobileDataPost(request, path);
}

async function dispatchPatch(request: NextRequest, path: string[]) {
  if (!mutationAllowed(request)) return mobileError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const route = key(path);
  if (route === "onboarding/status") return onboardingStatus(request, true);
  if (route === "profiles/me") return updateProfessional(request);
  if (route === "clinics/me") return updateClinic(request);
  return mobileDataPatch(request, path);
}

async function dispatchDelete(request: NextRequest, path: string[]) {
  if (!mutationAllowed(request)) return mobileError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  if (key(path) === "auth/account") return protectedAuthMutation(request, "account");
  return mobileDataDelete(request, path);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return dispatchGet(request, (await params).path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return dispatchPost(request, (await params).path);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return dispatchPatch(request, (await params).path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return dispatchDelete(request, (await params).path);
}

// The data dispatchers are kept below the auth/profile surface so their
// mappings can evolve without changing the mobile authentication contract.
async function mobileDataGet(request: NextRequest, path: string[]) {
  const route = key(path);
  const context = await requireContext(request);
  if (!context) return mobileError("UNAUTHORIZED", "Please sign in again.", 401);

  if (route === "jobs" || route === "jobs/mine" || (path[0] === "jobs" && path.length === 2)) {
    let query = context.supabase
      .from("shifts")
      .select("id, organization_id, title, specialty, city, starts_at, ends_at, needed_count, hourly_rate, currency, requirements, status, organizations(name, region, latitude, longitude)")
      .order("starts_at")
      .limit(100);
    if (route === "jobs") query = query.eq("status", "published").gte("starts_at", new Date().toISOString());
    if (route === "jobs/mine") {
      const { data: membership } = await context.supabase.from("organization_members").select("organization_id").eq("user_id", context.viewer.id).limit(1).maybeSingle();
      if (!membership) return mobileJson({ items: [], total: 0 });
      query = query.eq("organization_id", membership.organization_id);
    }
    if (path[0] === "jobs" && path.length === 2) query = query.eq("id", path[1]);
    const { data, error } = await query;
    if (error) return mobileError("QUERY_FAILED", "Shifts could not be loaded.", 500);
    const items = (data ?? []).map((shift) => mapShiftToMobile(shift));
    if (path[0] === "jobs" && path.length === 2) return items[0] ? mobileJson(items[0]) : mobileError("NOT_FOUND", "The shift was not found.", 404);
    return mobileJson({ items, total: items.length });
  }

  if (route === "bookings" || (path[0] === "bookings" && path.length === 2)) {
    let query = context.supabase
      .from("applications")
      .select("id, shift_id, professional_id, note, status, created_at, confirmed_at, checked_in_at, checked_out_at, completed_at, shifts(id, title, organization_id, city, starts_at, ends_at, hourly_rate, currency, organizations(name, region, latitude, longitude)), profiles!applications_professional_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (context.viewer.role === "professional") query = query.eq("professional_id", context.viewer.id);
    if (path.length === 2) query = query.eq("id", path[1]);
    const { data, error } = await query;
    if (error) return mobileError("QUERY_FAILED", "Bookings could not be loaded.", 500);
    const items = (data ?? []).flatMap((application) => {
      const shiftRelation = application.shifts as Record<string, unknown> | Array<Record<string, unknown>> | null;
      const shift = Array.isArray(shiftRelation) ? shiftRelation[0] : shiftRelation;
      if (!shift) return [];
      const organizationRelation = shift.organizations as Record<string, unknown> | Array<Record<string, unknown>> | null;
      const organization = Array.isArray(organizationRelation) ? organizationRelation[0] : organizationRelation;
      const profileRelation = application.profiles as { full_name: string | null } | Array<{ full_name: string | null }> | null;
      const profile = Array.isArray(profileRelation) ? profileRelation[0] : profileRelation;
      const status = application.status === "completed" ? "completed" : ["withdrawn", "rejected", "cancelled"].includes(application.status) ? "cancelled" : application.checked_out_at ? "checked_out" : application.checked_in_at ? "checked_in" : application.confirmed_at ? "confirmed" : application.status === "accepted" ? "accepted" : "requested";
      return [{ id: application.id, jobId: application.shift_id, jobTitle: String(shift.title ?? "Shift"), status, clinicId: String(shift.organization_id ?? ""), clinicName: String(organization?.name ?? "SyndeoCare facility"), professionalId: application.professional_id, professionalName: profile?.full_name ?? "Care professional", startsAt: String(shift.starts_at), endsAt: typeof shift.ends_at === "string" ? shift.ends_at : undefined, checkInTime: application.checked_in_at ?? undefined, checkOutTime: application.checked_out_at ?? undefined, location: { city: String(shift.city ?? ""), region: String(organization?.region ?? shift.city ?? ""), latitude: typeof organization?.latitude === "number" ? organization.latitude : null, longitude: typeof organization?.longitude === "number" ? organization.longitude : null }, compensation: { amount: Number(shift.hourly_rate ?? 0), currency: String(shift.currency ?? "YER"), unit: "hour" }, notes: application.note ?? undefined }];
    });
    if (path.length === 2) return items[0] ? mobileJson(items[0]) : mobileError("NOT_FOUND", "The booking was not found.", 404);
    return mobileJson({ items, total: items.length });
  }

  if (route === "conversations") {
    const { data: memberships, error } = await context.supabase.from("conversation_members").select("conversation_id, last_read_at, conversations(id, updated_at, shifts(title))").eq("user_id", context.viewer.id);
    if (error) return mobileError("QUERY_FAILED", "Conversations could not be loaded.", 500);
    const ids = (memberships ?? []).map((membership) => membership.conversation_id);
    if (!ids.length) return mobileJson({ items: [], total: 0 });
    const [membersResult, messagesResult] = await Promise.all([
      context.supabase.from("conversation_members").select("conversation_id, user_id, profiles(full_name, role)").in("conversation_id", ids),
      context.supabase.from("messages").select("conversation_id, body, created_at").in("conversation_id", ids).order("created_at", { ascending: false }).limit(300),
    ]);
    const items = (memberships ?? []).map((membership) => {
      const conversationRelation = membership.conversations as Record<string, unknown> | Array<Record<string, unknown>> | null;
      const conversation = Array.isArray(conversationRelation) ? conversationRelation[0] : conversationRelation;
      const shiftRelation = conversation?.shifts as Record<string, unknown> | Array<Record<string, unknown>> | null;
      const shift = Array.isArray(shiftRelation) ? shiftRelation[0] : shiftRelation;
      const counterpart = (membersResult.data ?? []).find((member) => member.conversation_id === membership.conversation_id && member.user_id !== context.viewer.id);
      const profileRelation = counterpart?.profiles as Record<string, unknown> | Array<Record<string, unknown>> | null;
      const profile = Array.isArray(profileRelation) ? profileRelation[0] : profileRelation;
      const latest = (messagesResult.data ?? []).find((message) => message.conversation_id === membership.conversation_id);
      const unreadCount = (messagesResult.data ?? []).filter((message) => message.conversation_id === membership.conversation_id && (!membership.last_read_at || message.created_at > membership.last_read_at)).length;
      return { id: membership.conversation_id, kind: "standard", displayName: String(profile?.full_name ?? shift?.title ?? "SyndeoCare"), counterpartRole: mobileRole(String(profile?.role ?? (context.viewer.role === "professional" ? "organization" : "professional"))), lastMessageAt: latest?.created_at ?? String(conversation?.updated_at ?? new Date().toISOString()), unreadCount, lastMessage: latest?.body ?? null };
    });
    return mobileJson({ items, total: items.length });
  }

  if (path[0] === "conversations" && path[2] === "messages" && path.length === 3) {
    const conversationId = path[1];
    const { data, error } = await context.supabase.from("messages").select("id, conversation_id, author_id, body, file_path, file_type, file_name, file_size, created_at, profiles(role)").eq("conversation_id", conversationId).order("created_at").limit(300);
    if (error) return mobileError("NOT_FOUND", "The conversation was not found.", 404);
    await context.supabase.from("conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conversationId).eq("user_id", context.viewer.id);
    const items = (data ?? []).map((message) => {
      const profileRelation = message.profiles as { role: string } | Array<{ role: string }> | null;
      const profile = Array.isArray(profileRelation) ? profileRelation[0] : profileRelation;
      return { id: message.id, conversationId: message.conversation_id, senderActorId: message.author_id ?? "", senderRole: mobileRole(profile?.role ?? "professional"), content: message.body, isRead: true, fileUrl: message.file_path, fileType: message.file_type, fileName: message.file_name, fileSize: message.file_size, createdAt: message.created_at };
    });
    return mobileJson({ items, total: items.length });
  }

  if (route === "notifications") {
    const { data, error } = await context.supabase.from("notifications").select("id, user_id, kind, title, body, data, read_at, created_at").eq("user_id", context.viewer.id).order("created_at", { ascending: false }).limit(100);
    if (error) return mobileError("QUERY_FAILED", "Notifications could not be loaded.", 500);
    const items = (data ?? []).map(mapNotificationToMobile);
    return mobileJson({ items, total: items.length });
  }

  return mobileError("NOT_FOUND", "The mobile endpoint was not found.", 404);
}

async function mobileDataPost(request: NextRequest, path: string[]) {
  const route = key(path);
  const context = await requireContext(request);
  if (!context) return mobileError("UNAUTHORIZED", "Please sign in again.", 401);
  const body = await jsonBody(request);

  if (route === "jobs") {
    if (context.viewer.role !== "organization") return mobileError("FORBIDDEN", "An organization account is required.", 403);
    const { data: membership } = await context.supabase.from("organization_members").select("organization_id, role").eq("user_id", context.viewer.id).in("role", ["owner", "manager", "recruiter"]).limit(1).maybeSingle();
    if (!membership) return mobileError("FORBIDDEN", "No managed organization was found.", 403);
    const location = body?.location as Record<string, unknown> | undefined;
    const compensation = body?.compensation as Record<string, unknown> | undefined;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const specialty = typeof body?.specialty === "string" ? body.specialty.trim() : "";
    const startsAt = typeof body?.startsAt === "string" ? body.startsAt : "";
    const endsAt = typeof body?.endsAt === "string" ? body.endsAt : "";
    if (!title || !specialty || !startsAt || !endsAt || !location?.city) return mobileError("VALIDATION_ERROR", "Complete the required shift details.", 422);
    const { data: organization } = await context.supabase.from("organizations").select("status").eq("id", membership.organization_id).single();
    const publish = organization?.status === "active" && context.viewer.verificationStatus === "verified";
    const requirements = Array.isArray(body?.requirements) ? body.requirements.filter((item): item is string => typeof item === "string") : [];
    const { data, error } = await context.supabase.from("shifts").insert({ organization_id: membership.organization_id, created_by: context.viewer.id, title, specialty, city: String(location.city), starts_at: startsAt, ends_at: endsAt, needed_count: Number(body?.maxApplicants ?? 1), hourly_rate: Number(compensation?.amount ?? 0) || null, currency: typeof compensation?.currency === "string" ? compensation.currency.slice(0, 3).toUpperCase() : "YER", requirements, status: publish ? "published" : "draft" }).select("id, organization_id, title, specialty, city, starts_at, ends_at, needed_count, hourly_rate, currency, requirements, status, organizations(name, region, latitude, longitude)").single();
    if (error || !data) return mobileError("CREATE_FAILED", "The shift could not be created.", 409);
    return mobileJson(mapShiftToMobile(data), 201);
  }

  if (route === "bookings") {
    if (context.viewer.role !== "professional") return mobileError("FORBIDDEN", "A professional account is required.", 403);
    const jobId = typeof body?.jobId === "string" ? body.jobId : "";
    if (!z.uuid().safeParse(jobId).success) return mobileError("VALIDATION_ERROR", "Choose a valid shift.", 422);
    const { data, error } = await context.supabase.from("applications").insert({ shift_id: jobId, professional_id: context.viewer.id, note: typeof body?.notes === "string" ? body.notes.slice(0, 1000) : null, status: "applied" }).select("id").single();
    if (error || !data) return mobileError("BOOKING_FAILED", "The application could not be submitted.", 409);
    const response = await mobileDataGet(request, ["bookings", data.id]);
    return response.status === 200 ? mobileJson(await response.json(), 201) : response;
  }

  if (route === "conversations") {
    if (context.viewer.role !== "organization" && context.viewer.role !== "admin") return mobileError("FORBIDDEN", "Organization access is required.", 403);
    const clinicId = typeof body?.clinicId === "string" ? body.clinicId : "";
    const professionalId = typeof body?.professionalId === "string" ? body.professionalId : "";
    if (!z.uuid().safeParse(clinicId).success || !z.uuid().safeParse(professionalId).success) return mobileError("VALIDATION_ERROR", "Choose a valid organization and professional.", 422);
    if (context.viewer.role === "organization") {
      const { data: membership } = await context.supabase.from("organization_members").select("organization_id").eq("organization_id", clinicId).eq("user_id", context.viewer.id).in("role", ["owner", "manager", "recruiter"]).maybeSingle();
      if (!membership) return mobileError("FORBIDDEN", "You cannot start conversations for this organization.", 403);
    }
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.rpc("create_direct_conversation", {
        actor_id_input: context.viewer.id,
        organization_id_input: clinicId,
        professional_id_input: professionalId,
      });
      const conversation = Array.isArray(data) ? data[0] : data;
      if (error || !conversation?.conversation_id) return mobileError("CREATE_FAILED", "The conversation could not be created.", 409);
      const { data: professional } = await admin.from("profiles").select("full_name").eq("id", professionalId).maybeSingle();
      return mobileJson({ id: conversation.conversation_id, kind: "standard", displayName: professional?.full_name ?? "Care professional", counterpartRole: "professional", lastMessageAt: conversation.updated_at, unreadCount: 0, lastMessage: null }, 201);
    } catch {
      return mobileError("SERVICE_NOT_CONFIGURED", "Messaging is not configured.", 503);
    }
  }

  if (path[0] === "conversations" && path[2] === "messages" && path.length === 3) {
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const filePath = typeof body?.fileUrl === "string" ? body.fileUrl : null;
    if (!content && !filePath) return mobileError("VALIDATION_ERROR", "Write a message or attach a file before sending.", 422);
    let fileType: string | null = null;
    let fileSize: number | null = null;
    if (filePath) {
      const expectedPrefix = `${path[1]}/${context.viewer.id}/`;
      if (!filePath.startsWith(expectedPrefix)) return mobileError("FORBIDDEN", "The attachment does not belong to this conversation.", 403);
      const object = await storedObject(context, "chat-media", filePath);
      if (!object) return mobileError("UPLOAD_NOT_FOUND", "Finish uploading the attachment before sending it.", 409);
      const metadata = object.metadata as Record<string, unknown> | null;
      fileType = typeof metadata?.mimetype === "string" ? metadata.mimetype : typeof body?.fileType === "string" ? body.fileType : null;
      fileSize = typeof metadata?.size === "number" ? metadata.size : typeof body?.fileSize === "number" ? body.fileSize : null;
    }
    const { data, error } = await context.supabase.from("messages").insert({ conversation_id: path[1], author_id: context.viewer.id, body: content.slice(0, 5000) || "Attachment", file_path: filePath, file_type: fileType, file_name: typeof body?.fileName === "string" ? body.fileName.slice(0, 255) : null, file_size: fileSize }).select("id, conversation_id, author_id, body, file_path, file_type, file_name, file_size, created_at").single();
    if (error || !data) return mobileError("SEND_FAILED", "The message could not be sent.", 403);
    return mobileJson({ id: data.id, conversationId: data.conversation_id, senderActorId: data.author_id ?? context.viewer.id, senderRole: mobileRole(context.viewer.role), content: data.body, isRead: true, fileUrl: data.file_path, fileType: data.file_type, fileName: data.file_name, fileSize: data.file_size, createdAt: data.created_at }, 201);
  }

  if (route === "notifications/push-tokens") {
    const token = typeof body?.token === "string" ? body.token : "";
    const provider = body?.provider === "expo" ? "expo" : null;
    const platform = ["android", "ios", "web"].includes(String(body?.platform)) ? String(body?.platform) : null;
    if (!token || !provider || !platform) return mobileError("VALIDATION_ERROR", "A valid push token is required.", 422);
    const { error } = await context.supabase.from("push_tokens").upsert({ user_id: context.viewer.id, token, provider, platform, device_id: body?.deviceId, device_name: body?.deviceName, app_version: body?.appVersion }, { onConflict: "token" });
    return error ? mobileError("REGISTER_FAILED", "The push token could not be registered.", 409) : mobileJson({ registered: true });
  }

  if (["uploads/verification-document", "uploads/profile-image", "uploads/chat-media"].includes(route)) {
    const contentType = typeof body?.contentType === "string" ? body.contentType : "";
    const supported = uploadTypes[route as keyof typeof uploadTypes] as ReadonlyMap<string, string>;
    const extension = supported.get(contentType) ?? "";
    if (!extension) return mobileError("UNSUPPORTED_FILE", "This file type is not supported.", 415);
    let bucket = "verification-documents";
    let assetType = "verification-document";
    let storageKey = `${context.viewer.id}/${crypto.randomUUID()}.${extension}`;
    if (route === "uploads/profile-image") {
      bucket = "avatars";
      assetType = "profile-image";
      if (context.viewer.role === "organization") {
        const { data: membership } = await context.supabase.from("organization_members").select("organization_id, role").eq("user_id", context.viewer.id).in("role", ["owner", "manager"]).limit(1).maybeSingle();
        if (membership) {
          bucket = "organization-assets";
          storageKey = `${membership.organization_id}/${crypto.randomUUID()}.${extension}`;
        }
      }
    }
    if (route === "uploads/chat-media") {
      const conversationId = typeof body?.conversationId === "string" ? body.conversationId : request.nextUrl.searchParams.get("conversationId");
      if (!conversationId || !z.uuid().safeParse(conversationId).success) return mobileError("VALIDATION_ERROR", "A conversation is required for this upload.", 422);
      bucket = "chat-media";
      assetType = "chat-media";
      storageKey = `${conversationId}/${context.viewer.id}/${crypto.randomUUID()}.${extension}`;
    }
    const { data, error } = await context.supabase.storage.from(bucket).createSignedUploadUrl(storageKey);
    if (error || !data) return mobileError("UPLOAD_FAILED", "An upload URL could not be created.", 409);
    return mobileJson({ assetType, bucket, expiresIn: 7200, key: storageKey, uploadHeaders: { "content-type": contentType }, uploadMethod: "PUT", uploadUrl: data.signedUrl });
  }

  if (route === "uploads/verification-document/complete") {
    if (body?.bucket !== "verification-documents") return mobileError("VALIDATION_ERROR", "The verification bucket is invalid.", 422);
    const storageKey = typeof body?.key === "string" ? body.key : "";
    if (!storageKey.startsWith(`${context.viewer.id}/`)) return mobileError("FORBIDDEN", "The upload does not belong to this account.", 403);
    const object = await storedObject(context, "verification-documents", storageKey);
    if (!object) return mobileError("UPLOAD_NOT_FOUND", "Finish uploading the document before saving it.", 409);
    const rawType = typeof body?.documentType === "string" ? body.documentType.toLowerCase() : "other";
    const type = rawType.includes("identity") ? "identity" : rawType.includes("license") ? "professional_license" : rawType.includes("insurance") ? "insurance" : rawType.includes("certificate") ? "certificate" : "other";
    const metadata = object.metadata as Record<string, unknown> | null;
    const fallbackMime = storageKey.endsWith(".pdf") ? "application/pdf" : storageKey.endsWith(".png") ? "image/png" : "image/jpeg";
    const mimeType = typeof metadata?.mimetype === "string" ? metadata.mimetype : fallbackMime;
    const allowedMimeTypes = uploadTypes["uploads/verification-document"] as ReadonlyMap<string, string>;
    if (!allowedMimeTypes.has(mimeType)) return mobileError("UNSUPPORTED_FILE", "This document type is not supported.", 415);
    const originalFilename = typeof body?.originalFilename === "string" ? body.originalFilename.trim().slice(0, 255) : storageKey.split("/").at(-1) ?? "document";
    const { data, error } = await context.supabase.from("documents").insert({ owner_id: context.viewer.id, type, storage_path: storageKey, original_filename: originalFilename, mime_type: mimeType, status: "pending" }).select("id").single();
    return error ? mobileError("SAVE_FAILED", "The uploaded document could not be saved.", 409) : mobileJson({ persisted: true, resource: "verification-document", id: data.id });
  }

  if (route === "uploads/profile-image/complete") {
    const bucket = body?.bucket === "organization-assets" ? "organization-assets" : body?.bucket === "avatars" ? "avatars" : null;
    if (!bucket) return mobileError("VALIDATION_ERROR", "The image bucket is invalid.", 422);
    const storageKey = typeof body?.key === "string" ? body.key : "";
    const object = await storedObject(context, bucket, storageKey);
    if (!object) return mobileError("UPLOAD_NOT_FOUND", "Finish uploading the image before saving it.", 409);
    let error: { message?: string } | null = null;
    if (bucket === "avatars") {
      if (!storageKey.startsWith(`${context.viewer.id}/`)) return mobileError("FORBIDDEN", "The upload does not belong to this account.", 403);
      ({ error } = await context.supabase.from("profiles").update({ avatar_path: storageKey }).eq("id", context.viewer.id));
    } else {
      const organizationId = storageKey.split("/")[0] ?? "";
      const { data: membership } = await context.supabase.from("organization_members").select("organization_id").eq("organization_id", organizationId).eq("user_id", context.viewer.id).in("role", ["owner", "manager"]).maybeSingle();
      if (!membership) return mobileError("FORBIDDEN", "Only organization managers can change the logo.", 403);
      ({ error } = await context.supabase.from("organizations").update({ logo_path: storageKey }).eq("id", organizationId));
    }
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return error ? mobileError("SAVE_FAILED", "The image could not be saved.", 409) : mobileJson({ assetType: "profile-image", assetUrl: `${base}/storage/v1/object/public/${bucket}/${storageKey}`, persisted: true, resource: context.viewer.role === "organization" ? "clinic-profile" : "professional-profile" });
  }

  if (route === "uploads/chat-media/complete") {
    if (body?.bucket !== "chat-media") return mobileError("VALIDATION_ERROR", "The attachment bucket is invalid.", 422);
    const storageKey = typeof body?.key === "string" ? body.key : "";
    const [conversationId, ownerId] = storageKey.split("/");
    if (!z.uuid().safeParse(conversationId).success || ownerId !== context.viewer.id) return mobileError("FORBIDDEN", "The upload does not belong to this account.", 403);
    if (!(await storedObject(context, "chat-media", storageKey))) return mobileError("UPLOAD_NOT_FOUND", "Finish uploading the attachment before saving it.", 409);
    return mobileJson({ assetType: "chat-media", fileUrl: storageKey, persisted: true, resource: "conversation-message" });
  }

  if (route === "uploads/chat-media/access") {
    const conversationId = typeof body?.conversationId === "string" ? body.conversationId : "";
    const storageKey = typeof body?.fileUrl === "string" ? body.fileUrl : "";
    if (!z.uuid().safeParse(conversationId).success || !storageKey.startsWith(`${conversationId}/`)) return mobileError("FORBIDDEN", "The attachment does not belong to this conversation.", 403);
    const { data, error } = await context.supabase.storage.from("chat-media").createSignedUrl(storageKey, 300);
    return error || !data ? mobileError("ACCESS_FAILED", "The file could not be opened.", 403) : mobileJson({ expiresIn: 300, signedUrl: data.signedUrl });
  }

  return mobileError("NOT_FOUND", "The mobile endpoint was not found.", 404);
}

async function mobileDataPatch(request: NextRequest, path: string[]) {
  const context = await requireContext(request);
  if (!context) return mobileError("UNAUTHORIZED", "Please sign in again.", 401);
  const body = await jsonBody(request);

  if (path[0] === "jobs" && path.length === 2) {
    if (context.viewer.role !== "organization" && context.viewer.role !== "admin") return mobileError("FORBIDDEN", "Organization access is required.", 403);
    const updates: Record<string, unknown> = {};
    if (typeof body?.title === "string") updates.title = body.title.trim();
    if (typeof body?.specialty === "string") updates.specialty = body.specialty.trim();
    if (typeof body?.startsAt === "string") updates.starts_at = body.startsAt;
    if (typeof body?.endsAt === "string") updates.ends_at = body.endsAt;
    if (Array.isArray(body?.requirements)) updates.requirements = body.requirements;
    if (typeof body?.maxApplicants === "number") updates.needed_count = body.maxApplicants;
    const location = body?.location as Record<string, unknown> | undefined;
    if (typeof location?.city === "string") updates.city = location.city;
    const compensation = body?.compensation as Record<string, unknown> | undefined;
    if (typeof compensation?.amount === "number") updates.hourly_rate = compensation.amount;
    if (typeof compensation?.currency === "string") updates.currency = compensation.currency.slice(0, 3).toUpperCase();
    if (typeof body?.status === "string") updates.status = body.status === "open" ? "published" : body.status === "filled" ? "filled" : "cancelled";
    if (!Object.keys(updates).length) return mobileError("VALIDATION_ERROR", "No changes were provided.", 422);
    const { data, error } = await context.supabase.from("shifts").update(updates).eq("id", path[1]).select("id, organization_id, title, specialty, city, starts_at, ends_at, needed_count, hourly_rate, currency, requirements, status, organizations(name, region, latitude, longitude)").single();
    return error || !data ? mobileError("UPDATE_FAILED", "The shift could not be updated.", 409) : mobileJson(mapShiftToMobile(data));
  }

  if (path[0] === "bookings" && path.length === 2) {
    const requested = typeof body?.status === "string" ? body.status : "";
    const { data: current, error: lookupError } = await context.supabase.from("applications").select("id, professional_id, status").eq("id", path[1]).maybeSingle();
    if (lookupError || !current) return mobileError("NOT_FOUND", "The booking was not found.", 404);
    const changes: Record<string, unknown> = {};
    if (requested === "accepted") changes.status = "accepted";
    else if (requested === "confirmed") changes.confirmed_at = new Date().toISOString();
    else if (requested === "checked_in") changes.checked_in_at = new Date().toISOString();
    else if (requested === "checked_out") changes.checked_out_at = new Date().toISOString();
    else if (requested === "completed") { changes.status = "completed"; changes.completed_at = new Date().toISOString(); }
    else if (requested === "cancelled") changes.status = context.viewer.role === "professional" ? "withdrawn" : "cancelled";
    else return mobileError("VALIDATION_ERROR", "The booking status is invalid.", 422);
    const { error } = await context.supabase.from("applications").update(changes).eq("id", path[1]);
    if (error) return mobileError("UPDATE_FAILED", "The booking could not be updated.", 409);
    return mobileDataGet(request, ["bookings", path[1]]);
  }

  if (key(path) === "notifications/read-all") {
    const { data, error } = await context.supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", context.viewer.id).is("read_at", null).select("id");
    return error ? mobileError("UPDATE_FAILED", "Notifications could not be updated.", 409) : mobileJson({ updated: data?.length ?? 0 });
  }

  if (path[0] === "notifications" && path[2] === "read" && path.length === 3) {
    const { data, error } = await context.supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", path[1]).eq("user_id", context.viewer.id).select("id, user_id, kind, title, body, data, read_at, created_at").single();
    return error || !data ? mobileError("NOT_FOUND", "The notification was not found.", 404) : mobileJson(mapNotificationToMobile(data));
  }

  return mobileError("NOT_FOUND", "The mobile endpoint was not found.", 404);
}

async function mobileDataDelete(request: NextRequest, path: string[]) {
  const context = await requireContext(request);
  if (!context) return mobileError("UNAUTHORIZED", "Please sign in again.", 401);

  if (path[0] === "conversations" && path[2] === "messages" && path.length === 4) {
    const { data: message } = await context.supabase.from("messages").select("file_path").eq("id", path[3]).eq("conversation_id", path[1]).eq("author_id", context.viewer.id).maybeSingle();
    const { error } = await context.supabase.from("messages").delete().eq("id", path[3]).eq("conversation_id", path[1]).eq("author_id", context.viewer.id);
    if (error) return mobileError("DELETE_FAILED", "The message could not be deleted.", 409);
    if (message?.file_path) await context.supabase.storage.from("chat-media").remove([message.file_path]);
    return mobileJson({ deleted: 1, id: path[3], ok: true });
  }

  if (path[0] === "notifications" && path.length === 2) {
    const { data, error } = await context.supabase.from("notifications").delete().eq("id", path[1]).eq("user_id", context.viewer.id).select("id");
    return error ? mobileError("DELETE_FAILED", "The notification could not be deleted.", 409) : mobileJson({ deleted: data?.length ?? 0 });
  }

  if (key(path) === "notifications/push-tokens") {
    const body = await jsonBody(request);
    let query = context.supabase.from("push_tokens").delete().eq("user_id", context.viewer.id);
    if (typeof body?.token === "string") query = query.eq("token", body.token);
    const { data, error } = await query.select("id");
    return error ? mobileError("DELETE_FAILED", "The push token could not be removed.", 409) : mobileJson({ deleted: data?.length ?? 0 });
  }

  return mobileError("NOT_FOUND", "The mobile endpoint was not found.", 404);
}
