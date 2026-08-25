import { describe, expect, it } from "vitest";
import { contactSchema, onboardingSchema, shiftCreateSchema } from "./index";

describe("public contracts", () => {
  it("accepts a complete professional profile", () => {
    expect(onboardingSchema.safeParse({
      role: "professional",
      fullName: "Sara Mohammed",
      phone: "+966500000000",
      city: "Riyadh",
      countryCode: "sa",
      locale: "ar",
      specialty: "Critical care",
      licenseNumber: "SCFHS-123",
      yearsExperience: 7,
    }).success).toBe(true);
  });

  it("rejects a shift that ends before it starts", () => {
    const result = shiftCreateSchema.safeParse({
      title: "Night shift",
      specialty: "Nursing",
      city: "Riyadh",
      startsAt: "2026-08-25T20:00:00+03:00",
      endsAt: "2026-08-25T08:00:00+03:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects the contact-form honeypot", () => {
    const result = contactSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      subject: "Support request",
      message: "Please help with this account issue.",
      website: "spam.example",
    });
    expect(result.success).toBe(false);
  });
});
