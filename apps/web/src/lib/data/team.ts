import "server-only";

import type { Viewer } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type TeamData = {
  organizationId: string;
  organizationName: string;
  organizationStatus: string;
  viewerMemberRole: string;
  members: Array<{
    userId: string;
    fullName: string | null;
    city: string | null;
    memberRole: string;
    verificationStatus: string;
    joinedAt: string;
  }>;
};

export async function getTeamData(viewer: Viewer): Promise<TeamData | null> {
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(name, status)")
    .eq("user_id", viewer.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return null;
  const organizationRelation = membership.organizations as { name: string; status: string } | Array<{ name: string; status: string }> | null;
  const organization = Array.isArray(organizationRelation) ? organizationRelation[0] : organizationRelation;
  if (!organization) return null;
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, role, created_at, profiles(full_name, city, verification_status)")
    .eq("organization_id", membership.organization_id)
    .order("created_at");

  return {
    organizationId: membership.organization_id,
    organizationName: organization.name,
    organizationStatus: organization.status,
    viewerMemberRole: membership.role,
    members: (members ?? []).map((member) => {
      const relation = member.profiles as { full_name: string | null; city: string | null; verification_status: string } | Array<{ full_name: string | null; city: string | null; verification_status: string }> | null;
      const profile = Array.isArray(relation) ? relation[0] : relation;
      return { userId: member.user_id, fullName: profile?.full_name ?? null, city: profile?.city ?? null, memberRole: member.role, verificationStatus: profile?.verification_status ?? "pending", joinedAt: member.created_at };
    }),
  };
}
