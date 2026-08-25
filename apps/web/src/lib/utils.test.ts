import { describe, expect, it } from "vitest";
import { initials, safePath } from "@/lib/utils";

describe("navigation safety", () => {
  it("allows local paths", () => {
    expect(safePath("/en/dashboard")).toBe("/en/dashboard");
  });

  it("blocks protocol-relative redirects", () => {
    expect(safePath("//malicious.example", "/ar")).toBe("/ar");
  });
});

describe("initials", () => {
  it("uses at most two words", () => {
    expect(initials("Sara Mohammed Ali")).toBe("SM");
  });
});
