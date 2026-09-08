import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, validationError } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";
import { isTrustedMutation } from "@/lib/request-security";

const reviewSchema = z.object({
  resource: z.enum(["profile", "organization", "document"]),
  id: z.uuid(),
  decision: z.enum(["approve", "reject", "suspend"]),
  note: z.string().trim().max(1000).optional(),
});

export async function PATCH(request: NextRequest) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  if (context.viewer.role !== "admin") return apiError("FORBIDDEN", "Administrator access is required.", 403);
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { resource, id, decision, note } = parsed.data;

  if (resource === "profile") {
    const status = decision === "approve" ? "verified" : "rejected";
    const { error } = await context.supabase.from("profiles").update({ verification_status: status }).eq("id", id);
    if (error) return apiError("UPDATE_FAILED", "The profile could not be reviewed.", 409);
    await context.supabase.from("notifications").insert({ user_id: id, kind: "verification.updated", title: "Verification updated", body: status === "verified" ? "Your SyndeoCare profile has been verified." : (note || "Your profile needs updated information."), data: { status } });
  }

  if (resource === "organization") {
    const status = decision === "approve" ? "active" : decision === "suspend" ? "suspended" : "pending";
    const { data: organization, error } = await context.supabase.from("organizations").update({ status }).eq("id", id).select("created_by").single();
    if (error) return apiError("UPDATE_FAILED", "The organization could not be reviewed.", 409);
    if (organization.created_by) await context.supabase.from("notifications").insert({ user_id: organization.created_by, kind: "organization.updated", title: "Organization review updated", body: status === "active" ? "Your organization is approved and can publish shifts." : (note || "Your organization review needs attention."), data: { organizationId: id, status } });
  }

  if (resource === "document") {
    const status = decision === "approve" ? "approved" : "rejected";
    const { data: document, error } = await context.supabase.from("documents").update({ status, reviewer_id: context.viewer.id, review_note: note || null }).eq("id", id).select("owner_id").single();
    if (error) return apiError("UPDATE_FAILED", "The document could not be reviewed.", 409);
    await context.supabase.from("notifications").insert({ user_id: document.owner_id, kind: "document.updated", title: "Document review updated", body: status === "approved" ? "A verification document was approved." : (note || "A verification document needs to be replaced."), data: { documentId: id, status } });
  }

  await context.supabase.from("audit_events").insert({ actor_id: context.viewer.id, action: `${resource}.${decision}`, resource_type: resource, resource_id: id, metadata: { note: note || null } });
  return apiSuccess({ updated: true });
}
