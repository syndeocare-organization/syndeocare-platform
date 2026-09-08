import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safePath } from "@/lib/utils";

const emailOtpTypes = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const rawType = request.nextUrl.searchParams.get("type");
  const next = safePath(request.nextUrl.searchParams.get("next"), "/ar/dashboard");

  try {
    const supabase = await createClient();
    const result = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && rawType && emailOtpTypes.has(rawType as EmailOtpType)
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: rawType as EmailOtpType })
        : { error: new Error("Missing authentication token") };

    if (!result.error) {
      const response = NextResponse.redirect(new URL(next, request.url));
      response.cookies.delete("syndeocare_pending_email");
      return response;
    }
  } catch {
    // The localized redirect below avoids exposing provider details.
  }

  const locale = next.startsWith("/en/") ? "en" : "ar";
  return NextResponse.redirect(new URL(`/${locale}/auth/login?error=callback`, request.url));
}
