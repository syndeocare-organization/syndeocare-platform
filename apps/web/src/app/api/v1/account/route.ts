import { accountDeletionSchema } from "@syndeocare/contracts";
import type { NextRequest } from "next/server";
import { apiError, validationError } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTrustedMutation } from "@/lib/request-security";

export async function DELETE(request: NextRequest) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);

  const body = await request.json().catch(() => null);
  const parsed = accountDeletionSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(context.viewer.id);
    if (error) return apiError("DELETE_FAILED", "The account could not be deleted.", 503);
    return new Response(null, { status: 204 });
  } catch {
    return apiError("SERVICE_UNAVAILABLE", "Account deletion is temporarily unavailable.", 503);
  }
}
