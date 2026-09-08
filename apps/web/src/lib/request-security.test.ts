import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { isTrustedMutation } from "@/lib/request-security";

function request(headers: Record<string, string> = {}) {
  return new NextRequest("https://preview.syndeocare.ai/api/v1/profile", {
    headers,
    method: "POST",
  });
}

describe("isTrustedMutation", () => {
  it("accepts same-origin browser requests", () => {
    expect(isTrustedMutation(request({ origin: "https://preview.syndeocare.ai" }))).toBe(true);
  });

  it("rejects cross-origin browser requests", () => {
    expect(isTrustedMutation(request({ cookie: "session=value", origin: "https://example.com" }))).toBe(false);
  });

  it("rejects cookie mutations with a missing origin", () => {
    expect(isTrustedMutation(request({ cookie: "session=value" }))).toBe(false);
  });

  it("accepts native requests without cookies and bearer requests", () => {
    expect(isTrustedMutation(request())).toBe(true);
    expect(isTrustedMutation(request({ authorization: "Bearer token", origin: "https://example.com" }))).toBe(true);
  });
});
