// @vitest-environment node

import { describe, expect, it } from "vitest";
import { hasExpectedFileSignature } from "@/lib/file-signatures";

describe("hasExpectedFileSignature", () => {
  it("accepts genuine PDF, PNG, and JPEG signatures", async () => {
    expect(await hasExpectedFileSignature(new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], "id.pdf", { type: "application/pdf" }))).toBe(true);
    expect(await hasExpectedFileSignature(new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "id.png", { type: "image/png" }))).toBe(true);
    expect(await hasExpectedFileSignature(new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "id.jpg", { type: "image/jpeg" }))).toBe(true);
  });

  it("rejects a renamed or mismatched file", async () => {
    expect(await hasExpectedFileSignature(new File(["not a pdf"], "id.pdf", { type: "application/pdf" }))).toBe(false);
    expect(await hasExpectedFileSignature(new File([new Uint8Array([0xff, 0xd8, 0xff])], "id.png", { type: "image/png" }))).toBe(false);
  });
});
