import { applicationCreateSchema } from "@syndeocare/contracts";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";
import { isTrustedMutation } from "@/lib/request-security";

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  if (context.viewer.role !== "professional") return apiError("FORBIDDEN", "A professional account is required.", 403);

  const body = await request.json().catch(() => null);
  const parsed = applicationCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { data, error } = await context.supabase.from("applications").insert({ shift_id: parsed.data.shiftId, professional_id: context.viewer.id, note: parsed.data.note, status: "applied" }).select("id, status, created_at").single();
  if (error) return apiError("APPLICATION_FAILED", "The application could not be submitted.", 409);
  return apiSuccess(data, { status: 201 });
}
