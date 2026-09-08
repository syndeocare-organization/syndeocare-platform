import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";

export async function GET(request: NextRequest) {
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  const { data: memberships, error } = await context.supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at, conversations(id, shift_id, updated_at, shifts(title))")
    .eq("user_id", context.viewer.id);
  if (error) return apiError("QUERY_FAILED", "Conversations could not be loaded.", 500);
  return apiSuccess({ items: memberships ?? [] });
}
