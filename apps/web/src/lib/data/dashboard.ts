import "server-only";

import type { Viewer } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type DashboardSummary = {
  primaryCount: number;
  secondaryCount: number;
  tertiaryCount: number;
  recentShifts: Array<{
    id: string;
    title: string;
    city: string;
    startsAt: string;
    status: string;
  }>;
};

export async function getDashboardSummary(viewer: Viewer): Promise<DashboardSummary> {
  const supabase = await createClient();

  if (viewer.role === "professional") {
    const [openShifts, applications, accepted, recent] = await Promise.all([
      supabase.from("shifts").select("id", { count: "exact", head: true }).eq("status", "published").gte("starts_at", new Date().toISOString()),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("professional_id", viewer.id),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("professional_id", viewer.id).eq("status", "accepted"),
      supabase.from("shifts").select("id, title, city, starts_at, status").eq("status", "published").gte("starts_at", new Date().toISOString()).order("starts_at").limit(4),
    ]);

    return {
      primaryCount: openShifts.count ?? 0,
      secondaryCount: applications.count ?? 0,
      tertiaryCount: accepted.count ?? 0,
      recentShifts: (recent.data ?? []).map((shift) => ({ id: shift.id, title: shift.title, city: shift.city, startsAt: shift.starts_at, status: shift.status })),
    };
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", viewer.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return { primaryCount: 0, secondaryCount: 0, tertiaryCount: 0, recentShifts: [] };

  const organizationId = membership.organization_id;
  const [published, applications, members, recent] = await Promise.all([
    supabase.from("shifts").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "published"),
    supabase.from("applications").select("id, shifts!inner(organization_id)", { count: "exact", head: true }).eq("shifts.organization_id", organizationId),
    supabase.from("organization_members").select("user_id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("shifts").select("id, title, city, starts_at, status").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(4),
  ]);

  return {
    primaryCount: published.count ?? 0,
    secondaryCount: applications.count ?? 0,
    tertiaryCount: members.count ?? 0,
    recentShifts: (recent.data ?? []).map((shift) => ({ id: shift.id, title: shift.title, city: shift.city, startsAt: shift.starts_at, status: shift.status })),
  };
}
