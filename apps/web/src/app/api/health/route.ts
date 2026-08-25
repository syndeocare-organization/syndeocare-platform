import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseConfig, hasSupabaseConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ status: "degraded", checkedAt, services: { web: "up", database: "not_configured" } }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const { url, publishableKey } = getSupabaseConfig();
    const supabase = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await supabase.from("profiles").select("id").limit(1);
    return NextResponse.json(
      { status: error ? "degraded" : "ok", checkedAt, services: { web: "up", database: error ? "down" : "up" }, version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local" },
      { status: error ? 503 : 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ status: "degraded", checkedAt, services: { web: "up", database: "down" } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
