import { messageCreateSchema } from "@syndeocare/contracts";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";
import { isTrustedMutation } from "@/lib/request-security";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  const { id } = await params;
  const { data, error } = await context.supabase
    .from("messages")
    .select("id, conversation_id, author_id, body, created_at")
    .eq("conversation_id", id)
    .order("created_at")
    .limit(250);
  if (error) return apiError("NOT_FOUND", "The conversation was not found.", 404);
  await context.supabase.from("conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", id).eq("user_id", context.viewer.id);
  return apiSuccess({ items: data });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  const body = await request.json().catch(() => null);
  const parsed = messageCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { id } = await params;
  const { data, error } = await context.supabase.from("messages").insert({
    conversation_id: id,
    author_id: context.viewer.id,
    body: parsed.data.body,
  }).select("id, conversation_id, author_id, body, created_at").single();
  if (error) return apiError("SEND_FAILED", "The message could not be sent.", 403);
  await context.supabase.from("conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", id).eq("user_id", context.viewer.id);
  return apiSuccess(data, { status: 201 });
}
