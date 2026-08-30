import { describe, expect, it } from "vitest";
import { initials, safePath } from "@/lib/utils";

describe("navigation safety", () => {
  it("allows local paths", () => {
    expect(safePath("/en/dashboard")).toBe("/en/dashboard");
  });

  it("blocks protocol-relative redirects", () => {
    expect(safePath("//malicious.example", "/ar")).toBe("/ar");
  });

  it("blocks backslash-based cross-origin redirects", () => {
    expect(safePath("/\\malicious.example", "/ar")).toBe("/ar");
  });

  it("blocks absolute and malformed URLs", () => {
    expect(safePath("https://malicious.example", "/en")).toBe("/en");
    expect(safePath("/%", "/en")).toBe("/en");
  });
});

describe("initials", () => {
  it("uses at most two words", () => {
    expect(initials("Sara Mohammed Ali")).toBe("SM");
  });
});
