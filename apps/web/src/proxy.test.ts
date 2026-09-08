import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";
import { config } from "./proxy";

describe("proxy matcher", () => {
  it.each([
    "/manifest.webmanifest",
    "/robots.txt",
    "/sitemap.xml",
    "/icon.png",
    "/brand/syndeocare-logo.png",
  ])("does not localize metadata and static assets at %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
  });

  it.each(["/ar", "/en/auth/login", "/api/health"])(
    "continues to cover application requests at %s",
    (url) => {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(true);
    },
  );
});
