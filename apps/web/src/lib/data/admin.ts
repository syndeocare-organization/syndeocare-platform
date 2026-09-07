import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminReviewData = {
  profiles: Array<{ id: string; fullName: string | null; role: string; city: string | null; status: string; createdAt: string }>;
  organizations: Array<{ id: string; name: string; type: string; licenseNumber: string; city: string; status: string; createdAt: string; createdBy: string | null }>;
  documents: Array<{ id: string; ownerId: string; ownerName: string | null; type: string; filename: string; status: string; expiresOn: string | null; reviewNote: string | null; createdAt: string }>;
};

export async function getAdminReviewData(): Promise<AdminReviewData> {
  const supabase = await createClient();
  const [profilesResult, organizationsResult, documentsResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, city, verification_status, created_at").in("verification_status", ["pending", "rejected"]).order("created_at"),
    supabase.from("organizations").select("id, name, type, license_number, city, status, created_at, created_by").in("status", ["pending", "suspended"]).order("created_at"),
    supabase.from("documents").select("id, owner_id, type, original_filename, status, expires_on, review_note, created_at, profiles!documents_owner_id_fkey(full_name)").in("status", ["pending", "rejected"]).order("created_at"),
  ]);
  return {
    profiles: (profilesResult.data ?? []).map((profile) => ({ id: profile.id, fullName: profile.full_name, role: profile.role, city: profile.city, status: profile.verification_status, createdAt: profile.created_at })),
    organizations: (organizationsResult.data ?? []).map((organization) => ({ id: organization.id, name: organization.name, type: organization.type, licenseNumber: organization.license_number, city: organization.city, status: organization.status, createdAt: organization.created_at, createdBy: organization.created_by })),
    documents: (documentsResult.data ?? []).map((document) => {
      const relation = document.profiles as { full_name: string | null } | Array<{ full_name: string | null }> | null;
      const owner = Array.isArray(relation) ? relation[0] : relation;
      return { id: document.id, ownerId: document.owner_id, ownerName: owner?.full_name ?? null, type: document.type, filename: document.original_filename, status: document.status, expiresOn: document.expires_on, reviewNote: document.review_note, createdAt: document.created_at };
    }),
  };
}
