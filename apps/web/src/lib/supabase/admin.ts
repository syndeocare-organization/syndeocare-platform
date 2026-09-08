import "server-only";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const adminSchema = z.object({
  url: z.url(),
  secretKey: z.string().min(20),
});

export function createAdminClient() {
  const { url, secretKey } = adminSchema.parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    secretKey:
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
