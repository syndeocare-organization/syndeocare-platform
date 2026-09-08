import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";
import { isTrustedMutation } from "@/lib/request-security";

async function documentForViewer(request: NextRequest, id: string) {
  const context = await getApiContext(request);
  if (!context) return { response: apiError("UNAUTHORIZED", "Authentication is required.", 401) } as const;
  const { data, error } = await context.supabase
    .from("documents")
    .select("id, owner_id, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (error || !data || (data.owner_id !== context.viewer.id && context.viewer.role !== "admin")) {
    return { response: apiError("NOT_FOUND", "The document was not found.", 404) } as const;
  }
  return { context, document: data } as const;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await documentForViewer(request, id);
  if ("response" in result) return result.response;
  const { data, error } = await result.context.supabase.storage
    .from("verification-documents")
    .createSignedUrl(result.document.storage_path, 60);
  if (error || !data) return apiError("DOWNLOAD_FAILED", "A download link could not be created.", 500);
  return NextResponse.redirect(data.signedUrl);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const { id } = await params;
  const result = await documentForViewer(request, id);
  if ("response" in result) return result.response;
  const storageDelete = await result.context.supabase.storage.from("verification-documents").remove([result.document.storage_path]);
  if (storageDelete.error) return apiError("DELETE_FAILED", "The stored file could not be deleted.", 409);
  const { error } = await result.context.supabase.from("documents").delete().eq("id", id);
  if (error) return apiError("DELETE_FAILED", "The document record could not be deleted.", 409);
  return apiSuccess({ deleted: true });
}
