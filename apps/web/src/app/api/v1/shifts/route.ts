import { shiftCreateSchema } from "@syndeocare/contracts";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";
import { isTrustedMutation } from "@/lib/request-security";

export async function GET(request: NextRequest) {
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);

  const city = request.nextUrl.searchParams.get("city")?.trim();
  const specialty = request.nextUrl.searchParams.get("specialty")?.trim();
  const cursor = request.nextUrl.searchParams.get("after");
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit")) || 20, 1), 50);

  let query = context.supabase
    .from("shifts")
    .select("id, organization_id, title, specialty, city, starts_at, ends_at, needed_count, hourly_rate, currency, requirements, status")
    .order("starts_at")
    .limit(limit);

  if (context.viewer.role === "professional") query = query.eq("status", "published").gte("starts_at", new Date().toISOString());
  if (city) query = query.ilike("city", city);
  if (specialty) query = query.ilike("specialty", specialty);
  if (cursor) query = query.gt("starts_at", cursor);

  const { data, error } = await query;
  if (error) return apiError("QUERY_FAILED", "Shifts could not be loaded.", 500);
  return apiSuccess({ items: data, nextCursor: data.length === limit ? data.at(-1)?.starts_at ?? null : null });
}

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  if (context.viewer.role !== "organization" && context.viewer.role !== "admin") return apiError("FORBIDDEN", "An organization account is required.", 403);

  const body = await request.json().catch(() => null);
  const parsed = shiftCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { data: membership, error: membershipError } = await context.supabase.from("organization_members").select("organization_id, role").eq("user_id", context.viewer.id).in("role", ["owner", "manager", "recruiter"]).limit(1).maybeSingle();
  if (membershipError) console.error("Managed organization lookup failed", { code: membershipError.code, message: membershipError.message });
  if (!membership) return apiError("FORBIDDEN", "No managed organization was found.", 403);

  if (parsed.data.publish) {
    const { data: organization } = await context.supabase.from("organizations").select("status").eq("id", membership.organization_id).single();
    if (organization?.status !== "active") {
      return apiError("ORGANIZATION_NOT_ACTIVE", "The organization must be approved before publishing shifts.", 403);
    }
  }

  const { data, error } = await context.supabase.from("shifts").insert({
    organization_id: membership.organization_id,
    created_by: context.viewer.id,
    title: parsed.data.title,
    specialty: parsed.data.specialty,
    city: parsed.data.city,
    starts_at: parsed.data.startsAt,
    ends_at: parsed.data.endsAt,
    needed_count: parsed.data.neededCount,
    hourly_rate: parsed.data.hourlyRate ?? null,
    currency: parsed.data.currency,
    requirements: parsed.data.requirements,
    status: parsed.data.publish ? "published" : "draft",
  }).select("id, status").single();

  if (error) {
    console.error("Shift creation failed", { code: error.code, message: error.message, details: error.details, hint: error.hint });
    return apiError("CREATE_FAILED", "The shift could not be created.", 409);
  }
  return apiSuccess(data, { status: 201 });
}
