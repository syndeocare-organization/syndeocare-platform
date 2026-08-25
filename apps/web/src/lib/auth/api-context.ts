import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { Viewer } from "@/lib/auth/dal";
import { getSupabaseConfig } from "@/lib/env";
import { createClient as createCookieClient } from "@/lib/supabase/server";

export async function getApiContext(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  const supabase = token
    ? createSupabaseClient(getSupabaseConfig().url, getSupabaseConfig().publishableKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : await createCookieClient();

  const userResult = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();
  const user = userResult.data.user;
  if (userResult.error || !user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role, onboarding_complete, verification_status")
    .eq("id", user.id)
    .single();
  if (error || !profile) return null;

  const viewer: Viewer = {
    id: user.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    role: profile.role,
    onboardingComplete: profile.onboarding_complete,
    verificationStatus: profile.verification_status,
  };

  return { viewer, supabase };
}
