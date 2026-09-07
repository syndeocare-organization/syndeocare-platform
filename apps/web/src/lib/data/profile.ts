import "server-only";

import type { Viewer } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type ProfileDetails = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  countryCode: string;
  locale: "ar" | "en";
  role: Viewer["role"];
  verificationStatus: Viewer["verificationStatus"];
  createdAt: string;
  professional: {
    specialty: string;
    licenseNumber: string;
    yearsExperience: number;
    bio: string;
    available: boolean;
  } | null;
  organization: {
    id: string;
    name: string;
    type: "hospital" | "clinic" | "home_care" | "other";
    licenseNumber: string;
    city: string;
    countryCode: string;
    status: string;
    memberRole: string;
  } | null;
};

export async function getProfileDetails(viewer: Viewer): Promise<ProfileDetails | null> {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, phone, city, country_code, locale, verification_status, created_at")
    .eq("id", viewer.id)
    .single();
  if (error || !profile) return null;

  let professional: ProfileDetails["professional"] = null;
  let organization: ProfileDetails["organization"] = null;

  if (viewer.role === "professional") {
    const { data } = await supabase
      .from("professional_profiles")
      .select("specialty, license_number, years_experience, bio, available")
      .eq("user_id", viewer.id)
      .maybeSingle();
    if (data) {
      professional = {
        specialty: data.specialty,
        licenseNumber: data.license_number,
        yearsExperience: data.years_experience,
        bio: data.bio ?? "",
        available: data.available,
      };
    }
  } else if (viewer.role === "organization") {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role, organizations(id, name, type, license_number, city, country_code, status)")
      .eq("user_id", viewer.id)
      .limit(1)
      .maybeSingle();
    const relation = membership?.organizations as {
      id: string;
      name: string;
      type: "hospital" | "clinic" | "home_care" | "other";
      license_number: string;
      city: string;
      country_code: string;
      status: string;
    } | Array<{
      id: string;
      name: string;
      type: "hospital" | "clinic" | "home_care" | "other";
      license_number: string;
      city: string;
      country_code: string;
      status: string;
    }> | null;
    const item = Array.isArray(relation) ? relation[0] : relation;
    if (membership && item) {
      organization = {
        id: item.id,
        name: item.name,
        type: item.type,
        licenseNumber: item.license_number,
        city: item.city,
        countryCode: item.country_code,
        status: item.status,
        memberRole: membership.role,
      };
    }
  }

  return {
    fullName: profile.full_name ?? "",
    email: viewer.email,
    phone: profile.phone ?? "",
    city: profile.city ?? "",
    countryCode: profile.country_code ?? "SA",
    locale: profile.locale === "en" ? "en" : "ar",
    role: viewer.role,
    verificationStatus: profile.verification_status,
    createdAt: profile.created_at,
    professional,
    organization,
  };
}
