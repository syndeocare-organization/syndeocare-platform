import "server-only";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const adminSchema = z.object({
  url: z.url(),
  serviceRoleKey: z.string().min(20),
});

export function createAdminClient() {
  const { url, serviceRoleKey } = adminSchema.parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
