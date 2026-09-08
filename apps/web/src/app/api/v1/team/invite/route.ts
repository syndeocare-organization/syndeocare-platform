import { teamInviteSchema } from "@syndeocare/contracts";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";
import { getSiteUrl } from "@/lib/env";
import { isTrustedMutation } from "@/lib/request-security";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  if (context.viewer.role !== "organization" && context.viewer.role !== "admin") return apiError("FORBIDDEN", "An organization account is required.", 403);
  const parsed = teamInviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const { data: membership } = await context.supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", context.viewer.id)
    .limit(1)
    .maybeSingle();
  if (!membership || !["owner", "manager"].includes(membership.role)) return apiError("FORBIDDEN", "Only owners and managers can invite members.", 403);
  if (membership.role === "manager" && parsed.data.role === "manager") return apiError("FORBIDDEN", "Only owners can add another manager.", 403);

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("SERVICE_NOT_CONFIGURED", "Team invitations are not configured.", 503);
  }

  const { data: userPage, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) return apiError("LOOKUP_FAILED", "The account lookup failed.", 503);
  const existing = userPage.users.find((user) => user.email?.toLowerCase() === parsed.data.email);

  if (existing) {
    const { data: existingProfile } = await admin.from("profiles").select("role").eq("id", existing.id).maybeSingle();
    if (existingProfile?.role === "professional") return apiError("ROLE_CONFLICT", "This email belongs to a professional account.", 409);
    const { error } = await admin.from("organization_members").upsert({ organization_id: membership.organization_id, user_id: existing.id, role: parsed.data.role });
    if (error) return apiError("INVITE_FAILED", "The member could not be added.", 409);
    await admin.from("notifications").insert({ user_id: existing.id, kind: "team.joined", title: "Organization access added", body: "You were added to an organization team.", data: { organizationId: membership.organization_id } });
    return apiSuccess({ status: "added" });
  }

  const redirectTo = new URL("/auth/confirm", getSiteUrl());
  redirectTo.searchParams.set("next", `/${parsed.data.locale}/team/accept`);
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: redirectTo.toString(),
    data: { role: "organization", locale: parsed.data.locale },
  });
  if (inviteError || !invited.user) return apiError("INVITE_FAILED", "The invitation email could not be sent.", 409);
  const { error: metadataError } = await admin.auth.admin.updateUserById(invited.user.id, {
    app_metadata: { invited_org_id: membership.organization_id, invited_org_role: parsed.data.role },
  });
  if (metadataError) return apiError("INVITE_FAILED", "The invitation could not be completed.", 409);
  return apiSuccess({ status: "invited" }, { status: 201 });
}
