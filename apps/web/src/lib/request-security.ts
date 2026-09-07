import type { NextRequest } from "next/server";

export function isTrustedMutation(request: NextRequest) {
  if (request.headers.get("authorization")?.startsWith("Bearer ")) return true;
  const origin = request.headers.get("origin");
  // Native clients and trusted server-to-server callers do not always send an
  // Origin header. They are safe here only when they are not carrying a
  // browser cookie. Cookie-authenticated mutations must prove same-origin.
  if (!origin) return !request.headers.has("cookie");

  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}
