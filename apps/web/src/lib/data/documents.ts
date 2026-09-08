import "server-only";

import { createClient } from "@/lib/supabase/server";

export type VerificationDocument = {
  id: string;
  type: string;
  originalFilename: string;
  mimeType: string;
  expiresOn: string | null;
  status: string;
  reviewNote: string | null;
  createdAt: string;
};

export async function getDocuments(ownerId: string): Promise<VerificationDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, type, original_filename, mime_type, expires_on, status, review_note, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((document) => ({
    id: document.id,
    type: document.type,
    originalFilename: document.original_filename,
    mimeType: document.mime_type,
    expiresOn: document.expires_on,
    status: document.status,
    reviewNote: document.review_note,
    createdAt: document.created_at,
  }));
}
