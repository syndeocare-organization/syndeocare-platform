import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "@/lib/env";

describe("site URL resolution", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the current Vercel preview URL for auth callbacks", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "syndeocare-feature.example.vercel.app");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://syndeocare.ai");

    expect(getSiteUrl()).toBe("https://syndeocare-feature.example.vercel.app");
  });

  it("uses the configured canonical URL in production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "syndeocare-build.example.vercel.app");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://syndeocare.ai/");

    expect(getSiteUrl()).toBe("https://syndeocare.ai");
  });
});
