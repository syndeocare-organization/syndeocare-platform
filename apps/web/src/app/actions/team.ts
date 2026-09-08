"use server";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/dal";
import { localePath, type Locale } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const roles = new Set(["manager", "recruiter", "viewer"]);

export async function acceptTeamInvitation(formData: FormData) {
  const locale: Locale = formData.get("locale") === "en" ? "en" : "ar";
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, "/auth/login"));
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const organizationId = user?.app_metadata?.invited_org_id;
  const memberRole = user?.app_metadata?.invited_org_role;
  if (!user || typeof organizationId !== "string" || !/^[0-9a-f-]{36}$/i.test(organizationId) || typeof memberRole !== "string" || !roles.has(memberRole)) {
    redirect(localePath(locale, "/dashboard"));
  }

  const admin = createAdminClient();
  const { error } = await admin.from("organization_members").upsert({ organization_id: organizationId, user_id: user.id, role: memberRole });
  if (error) redirect(localePath(locale, "/team/accept?error=1"));
  const nextMetadata = { ...user.app_metadata };
  delete nextMetadata.invited_org_id;
  delete nextMetadata.invited_org_role;
  await admin.auth.admin.updateUserById(user.id, { app_metadata: nextMetadata });
  redirect(localePath(locale, viewer.onboardingComplete ? "/team" : "/onboarding"));
}
