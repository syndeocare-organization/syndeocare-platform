import { describe, expect, it } from "vitest";
import { z } from "zod";
import { localizedFieldErrors } from "@/lib/form-errors";

describe("localized field errors", () => {
  it("returns one safe localized message per invalid field", () => {
    const result = z.object({ email: z.email() }).safeParse({ email: "invalid" });
    if (result.success) throw new Error("Expected validation to fail");

    expect(localizedFieldErrors(result.error, "ar", { email: ["بريد غير صحيح", "Invalid email"] }, ["قيمة غير صحيحة", "Invalid value"])).toEqual({
      email: ["بريد غير صحيح"],
    });
  });
});
