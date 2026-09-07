import "server-only";

import type { Viewer } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type ShiftListItem = {
  id: string;
  title: string;
  specialty: string;
  city: string;
  startsAt: string;
  endsAt: string;
  hourlyRate: number | null;
  currency: string;
  neededCount: number;
  status: string;
  organizationName: string | null;
  applicationStatus: string | null;
  applicationCount: number;
};

export async function getShiftsForViewer(
  viewer: Viewer,
  filters: { city?: string; specialty?: string } = {},
): Promise<ShiftListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("shifts")
    .select("id, title, specialty, city, starts_at, ends_at, hourly_rate, currency, needed_count, status, organization_id, organizations(name)")
    .order("starts_at", { ascending: true })
    .limit(50);

  if (viewer.role === "professional") {
    query = query.eq("status", "published").gte("starts_at", new Date().toISOString());
    if (filters.city) query = query.ilike("city", `%${filters.city}%`);
    if (filters.specialty) query = query.ilike("specialty", `%${filters.specialty}%`);
  } else if (viewer.role === "organization") {
    const { data: membership } = await supabase.from("organization_members").select("organization_id").eq("user_id", viewer.id).limit(1).maybeSingle();
    if (!membership) return [];
    query = query.eq("organization_id", membership.organization_id);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const applicationStatuses = new Map<string, string>();
  const applicationCounts = new Map<string, number>();
  if (viewer.role === "professional" && data.length) {
    const { data: applications } = await supabase.from("applications").select("shift_id, status").eq("professional_id", viewer.id).in("shift_id", data.map((shift) => shift.id));
    (applications ?? []).forEach((application) => applicationStatuses.set(application.shift_id, application.status));
  } else if (data.length) {
    const { data: applications } = await supabase.from("applications").select("shift_id").in("shift_id", data.map((shift) => shift.id));
    for (const application of applications ?? []) applicationCounts.set(application.shift_id, (applicationCounts.get(application.shift_id) ?? 0) + 1);
  }

  return data.map((shift) => {
    const organization = shift.organizations as { name: string } | Array<{ name: string }> | null;
    return {
      id: shift.id,
      title: shift.title,
      specialty: shift.specialty,
      city: shift.city,
      startsAt: shift.starts_at,
      endsAt: shift.ends_at,
      hourlyRate: shift.hourly_rate,
      currency: shift.currency,
      neededCount: shift.needed_count,
      status: shift.status,
      organizationName: Array.isArray(organization) ? organization[0]?.name ?? null : organization?.name ?? null,
      applicationStatus: applicationStatuses.get(shift.id) ?? null,
      applicationCount: applicationCounts.get(shift.id) ?? 0,
    };
  });
}
