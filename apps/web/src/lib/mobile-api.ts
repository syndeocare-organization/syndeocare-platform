import "server-only";

import { createClient as createSupabaseClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Viewer } from "@/lib/auth/dal";
import { getSupabaseConfig } from "@/lib/env";

export function mobileJson<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function mobileError(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

export function createMobileAuthClient() {
  const config = getSupabaseConfig();
  return createSupabaseClient(config.url, config.publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export function mobileRole(role: Viewer["role"] | string) {
  return role === "organization" ? "clinic" : role;
}

export function mobileVerification(status: Viewer["verificationStatus"] | string) {
  if (status === "verified") return "approved";
  if (status === "pending") return "pending_review";
  return status;
}

export async function mobilePrincipal(
  supabase: SupabaseClient,
  user: User,
  profile?: {
    full_name: string | null;
    role: string;
    onboarding_complete: boolean;
    verification_status: string;
    avatar_path?: string | null;
  } | null,
) {
  let resolved = profile;
  if (!resolved) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role, onboarding_complete, verification_status, avatar_path")
      .eq("id", user.id)
      .maybeSingle();
    resolved = data;
  }
  if (!resolved) return null;
  const { data: membership } = resolved.role === "organization"
    ? await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1).maybeSingle()
    : { data: null };
  const config = getSupabaseConfig();
  const profileImageUrl = resolved.avatar_path
    ? `${config.url}/storage/v1/object/public/avatars/${resolved.avatar_path}`
    : undefined;
  return {
    sub: user.id,
    actorId: user.id,
    email: user.email,
    emailVerified: Boolean(user.email_confirmed_at),
    role: mobileRole(resolved.role),
    permissions: [],
    clinicId: membership?.organization_id,
    profileId: user.id,
    onboardingCompleted: resolved.onboarding_complete,
    verificationStatus: mobileVerification(resolved.verification_status),
    displayName: resolved.full_name ?? undefined,
    profileImageUrl,
  };
}

export async function mobileSessionPayload(
  supabase: SupabaseClient,
  user: User,
  session: Session,
  isNewUser: boolean,
) {
  const principal = await mobilePrincipal(supabase, user);
  if (!principal) return null;
  return {
    principal,
    tokens: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      tokenType: session.token_type,
      expiresIn: session.expires_in,
      refreshExpiresIn: 60 * 60 * 24 * 30,
      scope: "authenticated",
    },
    isNewUser,
  };
}

export function mobileShiftStatus(status: string) {
  if (status === "published" || status === "draft") return "open";
  if (status === "filled") return "filled";
  return "closed";
}

export function mapShiftToMobile(shift: {
  id: string;
  organization_id: string;
  title: string;
  specialty: string;
  city: string;
  starts_at: string;
  ends_at: string;
  needed_count: number;
  hourly_rate: number | null;
  currency: string;
  requirements: string[];
  status: string;
  organizations?: unknown;
}) {
  const relation = shift.organizations as {
    name?: string;
    region?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | Array<{
    name?: string;
    region?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }> | null;
  const organization = Array.isArray(relation) ? relation[0] : relation;
  return {
    id: shift.id,
    title: shift.title,
    specialty: shift.specialty,
    employmentType: "temporary_shift" as const,
    status: mobileShiftStatus(shift.status),
    clinicId: shift.organization_id,
    clinicName: organization?.name ?? "SyndeoCare facility",
    location: {
      city: shift.city,
      region: organization?.region ?? shift.city,
      latitude: organization?.latitude ?? null,
      longitude: organization?.longitude ?? null,
    },
    startsAt: shift.starts_at,
    endsAt: shift.ends_at,
    compensation: { amount: Number(shift.hourly_rate ?? 0), currency: shift.currency, unit: "hour" as const },
    verificationRequired: true,
    summary: shift.requirements[0] ?? shift.title,
    description: shift.requirements.join("\n"),
    requirements: shift.requirements,
    languages: ["ar", "en"],
    maxApplicants: shift.needed_count,
  };
}

export function mapNotificationToMobile(notification: {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}) {
  return {
    id: notification.id,
    recipientExternalUserId: notification.user_id,
    type: notification.kind,
    title: notification.title,
    message: notification.body,
    data: notification.data,
    isRead: Boolean(notification.read_at),
    createdAt: notification.created_at,
  };
}
