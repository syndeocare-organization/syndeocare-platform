import { describe, expect, it } from "vitest";
import { applicationStatusLabel, shiftStatusLabel } from "@/lib/status-labels";

describe("localized workflow labels", () => {
  it("localizes known statuses", () => {
    expect(shiftStatusLabel("published", "ar")).toBe("منشورة");
    expect(applicationStatusLabel("accepted", "en")).toBe("Accepted");
  });

  it("keeps an unknown status visible", () => {
    expect(shiftStatusLabel("custom", "ar")).toBe("custom");
  });
});
