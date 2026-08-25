import { describe, expect, it } from "vitest";
import { alternateLocale, direction, getCopy, isLocale } from "@/lib/i18n";

describe("locale helpers", () => {
  it("recognizes supported locales", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("sets Arabic direction and complete copy", () => {
    expect(direction("ar")).toBe("rtl");
    expect(alternateLocale("ar")).toBe("en");
    expect(getCopy("ar").hero.titleAccent.length).toBeGreaterThan(3);
  });
});
