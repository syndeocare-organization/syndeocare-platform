import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api";
import { getApiContext } from "@/lib/auth/api-context";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = await getApiContext(request);
  if (!context) return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  return apiSuccess(context.viewer, { headers: { "Cache-Control": "private, no-store" } });
}
