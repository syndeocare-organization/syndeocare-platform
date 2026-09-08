import { shiftStatusSchema } from "@syndeocare/contracts";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";
import { isTrustedMutation } from "@/lib/request-security";

const transitions: Record<string, string[]> = {
  draft: ["published", "cancelled"],
  published: ["filled", "cancelled", "completed"],
  filled: ["completed", "cancelled"],
  cancelled: [],
  completed: [],
};

async function managedShift(request: NextRequest, id: string) {
  const context = await getApiContext(request);
  if (!context) return { response: apiError("UNAUTHORIZED", "Authentication is required.", 401) } as const;
  if (context.viewer.role === "professional") return { response: apiError("FORBIDDEN", "An organization account is required.", 403) } as const;
  const { data, error } = await context.supabase.from("shifts").select("id, organization_id, status").eq("id", id).maybeSingle();
  if (error || !data) return { response: apiError("NOT_FOUND", "The shift was not found.", 404) } as const;
  return { context, shift: data } as const;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const { id } = await params;
  const result = await managedShift(request, id);
  if ("response" in result) return result.response;
  const body = await request.json().catch(() => null);
  const parsed = shiftStatusSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  if (!transitions[result.shift.status]?.includes(parsed.data.status)) return apiError("INVALID_TRANSITION", "This shift cannot move to that status.", 409);

  if (parsed.data.status === "published") {
    const { data: organization } = await result.context.supabase.from("organizations").select("status").eq("id", result.shift.organization_id).single();
    if (organization?.status !== "active" || result.context.viewer.verificationStatus !== "verified") {
      return apiError("ORGANIZATION_NOT_ACTIVE", "Verification is required before publishing.", 403);
    }
  }

  const { data, error } = await result.context.supabase.from("shifts").update({ status: parsed.data.status }).eq("id", id).select("id, status, updated_at").single();
  if (error) return apiError("UPDATE_FAILED", "The shift could not be updated.", 409);
  return apiSuccess(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const { id } = await params;
  const result = await managedShift(request, id);
  if ("response" in result) return result.response;
  if (!["draft", "cancelled"].includes(result.shift.status)) return apiError("SHIFT_LOCKED", "Only draft or cancelled shifts can be deleted.", 409);
  const { count } = await result.context.supabase.from("applications").select("id", { count: "exact", head: true }).eq("shift_id", id);
  if ((count ?? 0) > 0) return apiError("SHIFT_HAS_APPLICATIONS", "A shift with applications cannot be deleted.", 409);
  const { error } = await result.context.supabase.from("shifts").delete().eq("id", id);
  if (error) return apiError("DELETE_FAILED", "The shift could not be deleted.", 409);
  return apiSuccess({ deleted: true });
}
