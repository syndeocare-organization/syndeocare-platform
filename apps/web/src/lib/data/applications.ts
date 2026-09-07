import "server-only";

import type { Viewer } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type ApplicationListItem = {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  shift: {
    id: string;
    title: string;
    specialty: string;
    city: string;
    startsAt: string;
    endsAt: string;
    organizationName: string | null;
  };
  professional: {
    id: string;
    fullName: string | null;
    city: string | null;
    verificationStatus: string;
    specialty: string | null;
    yearsExperience: number | null;
  } | null;
};

type RawApplication = {
  id: string;
  professional_id: string;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  shifts: {
    id: string;
    title: string;
    specialty: string;
    city: string;
    starts_at: string;
    ends_at: string;
    organizations: { name: string } | Array<{ name: string }> | null;
  } | Array<{
    id: string;
    title: string;
    specialty: string;
    city: string;
    starts_at: string;
    ends_at: string;
    organizations: { name: string } | Array<{ name: string }> | null;
  }>;
  profiles: {
    full_name: string | null;
    city: string | null;
    verification_status: string;
    professional_profiles: { specialty: string; years_experience: number } | Array<{ specialty: string; years_experience: number }> | null;
  } | Array<{
    full_name: string | null;
    city: string | null;
    verification_status: string;
    professional_profiles: { specialty: string; years_experience: number } | Array<{ specialty: string; years_experience: number }> | null;
  }> | null;
};

export async function getApplicationsForViewer(viewer: Viewer): Promise<ApplicationListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("applications")
    .select(`
      id, professional_id, status, note, created_at, updated_at,
      shifts!inner(id, title, specialty, city, starts_at, ends_at, organization_id, organizations(name)),
      profiles!applications_professional_id_fkey(full_name, city, verification_status, professional_profiles(specialty, years_experience))
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (viewer.role === "professional") {
    query = query.eq("professional_id", viewer.id);
  } else if (viewer.role === "organization") {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", viewer.id)
      .limit(1)
      .maybeSingle();
    if (!membership) return [];
    query = query.eq("shifts.organization_id", membership.organization_id);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("Applications query failed", { code: error?.code, message: error?.message });
    return [];
  }

  return (data as unknown as RawApplication[]).flatMap((application) => {
    const shift = Array.isArray(application.shifts) ? application.shifts[0] : application.shifts;
    if (!shift) return [];
    const organization = Array.isArray(shift.organizations) ? shift.organizations[0] : shift.organizations;
    const profile = Array.isArray(application.profiles) ? application.profiles[0] : application.profiles;
    const professionalProfile = profile
      ? Array.isArray(profile.professional_profiles)
        ? profile.professional_profiles[0]
        : profile.professional_profiles
      : null;

    return [{
      id: application.id,
      status: application.status,
      note: application.note,
      createdAt: application.created_at,
      updatedAt: application.updated_at,
      shift: {
        id: shift.id,
        title: shift.title,
        specialty: shift.specialty,
        city: shift.city,
        startsAt: shift.starts_at,
        endsAt: shift.ends_at,
        organizationName: organization?.name ?? null,
      },
      professional: profile ? {
        id: application.professional_id,
        fullName: profile.full_name,
        city: profile.city,
        verificationStatus: profile.verification_status,
        specialty: professionalProfile?.specialty ?? null,
        yearsExperience: professionalProfile?.years_experience ?? null,
      } : null,
    }];
  });
}
