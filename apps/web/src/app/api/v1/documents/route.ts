import { documentCreateSchema } from "@syndeocare/contracts";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";
import { hasExpectedFileSignature } from "@/lib/file-signatures";
import { isTrustedMutation } from "@/lib/request-security";

const MAX_SIZE = 10 * 1024 * 1024;
const allowedTypes = new Map([
  ["application/pdf", "pdf"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
]);

export async function GET(request: NextRequest) {
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  const { data, error } = await context.supabase
    .from("documents")
    .select("id, type, original_filename, mime_type, expires_on, status, review_note, created_at")
    .eq("owner_id", context.viewer.id)
    .order("created_at", { ascending: false });
  if (error) return apiError("QUERY_FAILED", "Documents could not be loaded.", 500);
  return apiSuccess({ items: data });
}

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);

  const form = await request.formData().catch(() => null);
  if (!form) return apiError("VALIDATION_ERROR", "The upload form is invalid.", 422);
  const file = form.get("file");
  const parsed = documentCreateSchema.safeParse({
    type: form.get("type"),
    expiresOn: form.get("expiresOn") || undefined,
  });
  if (!parsed.success) return validationError(parsed.error);
  if (!(file instanceof File)) return apiError("FILE_REQUIRED", "Choose a file to upload.", 422);
  const extension = allowedTypes.get(file.type);
  if (!extension) return apiError("UNSUPPORTED_FILE", "Only PDF, JPG, and PNG files are supported.", 415);
  if (file.size < 1 || file.size > MAX_SIZE) return apiError("FILE_TOO_LARGE", "The file must be smaller than 10 MB.", 413);
  if (!(await hasExpectedFileSignature(file))) return apiError("INVALID_FILE_CONTENT", "The file content does not match its declared type.", 415);

  const storagePath = `${context.viewer.id}/${crypto.randomUUID()}.${extension}`;
  const upload = await context.supabase.storage
    .from("verification-documents")
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (upload.error) return apiError("UPLOAD_FAILED", "The file could not be uploaded.", 409);

  const { data, error } = await context.supabase.from("documents").insert({
    owner_id: context.viewer.id,
    type: parsed.data.type,
    storage_path: storagePath,
    original_filename: file.name.slice(0, 255),
    mime_type: file.type,
    expires_on: parsed.data.expiresOn ?? null,
    status: "pending",
  }).select("id, type, original_filename, status, created_at").single();

  if (error) {
    await context.supabase.storage.from("verification-documents").remove([storagePath]);
    return apiError("SAVE_FAILED", "The document could not be registered.", 409);
  }
  return apiSuccess(data, { status: 201 });
}
