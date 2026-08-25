import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Viewer = {
  id: string;
  email: string;
  fullName: string | null;
  role: "professional" | "organization" | "admin";
  onboardingComplete: boolean;
  verificationStatus: "not_started" | "pending" | "verified" | "rejected";
};

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, onboarding_complete, verification_status")
    .eq("id", userId)
    .single();

  if (profileError || !profile) return null;

  return {
    id: userId,
    email: typeof claimsData.claims.email === "string" ? claimsData.claims.email : "",
    fullName: profile.full_name,
    role: profile.role,
    onboardingComplete: profile.onboarding_complete,
    verificationStatus: profile.verification_status,
  };
});
