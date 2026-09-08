import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";
import { isTrustedMutation } from "@/lib/request-security";

export async function PATCH(request: NextRequest) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);

  const { error } = await context.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", context.viewer.id)
    .is("read_at", null);

  if (error) return apiError("UPDATE_FAILED", "Notifications could not be updated.", 503);
  return apiSuccess({ read: true });
}
