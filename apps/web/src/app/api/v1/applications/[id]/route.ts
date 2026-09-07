import { applicationStatusSchema } from "@syndeocare/contracts";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";
import { isTrustedMutation } from "@/lib/request-security";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);

  const body = await request.json().catch(() => null);
  const parsed = applicationStatusSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { id } = await params;

  const { data: current, error: lookupError } = await context.supabase
    .from("applications")
    .select("id, professional_id, status, shift_id, shifts(organization_id, needed_count)")
    .eq("id", id)
    .maybeSingle();
  if (lookupError || !current) return apiError("NOT_FOUND", "The application was not found.", 404);

  const target = parsed.data.status;
  if (context.viewer.role === "professional") {
    if (current.professional_id !== context.viewer.id || target !== "withdrawn") {
      return apiError("FORBIDDEN", "You cannot perform this application action.", 403);
    }
  } else if (context.viewer.role === "organization") {
    if (!["shortlisted", "accepted", "rejected", "cancelled", "completed"].includes(target)) {
      return apiError("FORBIDDEN", "The requested status is not available to organizations.", 403);
    }
  }

  const { data, error } = await context.supabase
    .from("applications")
    .update({ status: target })
    .eq("id", id)
    .select("id, shift_id, status, updated_at")
    .single();

  if (error) {
    const conflict = error.code === "23514";
    return apiError(
      conflict ? "INVALID_TRANSITION" : "UPDATE_FAILED",
      conflict ? "This application cannot move to that status." : "The application could not be updated.",
      conflict ? 409 : 400,
    );
  }

  if (target === "accepted") {
    const shiftRelation = current.shifts as { needed_count: number } | Array<{ needed_count: number }> | null;
    const shift = Array.isArray(shiftRelation) ? shiftRelation[0] : shiftRelation;
    const { count } = await context.supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("shift_id", current.shift_id)
      .eq("status", "accepted");
    if (shift && (count ?? 0) >= shift.needed_count) {
      await context.supabase.from("shifts").update({ status: "filled" }).eq("id", current.shift_id).eq("status", "published");
    }
  }

  return apiSuccess(data);
}
