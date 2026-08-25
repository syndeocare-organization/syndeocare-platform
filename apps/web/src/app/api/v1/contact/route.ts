import { contactSchema } from "@syndeocare/contracts";
import type { NextRequest } from "next/server";
import { after } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api";
import { sendSupportNotification } from "@/lib/mail";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTrustedMutation } from "@/lib/request-security";

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request)) return apiError("INVALID_ORIGIN", "The request origin is not allowed.", 403);
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
      locale: parsed.data.locale,
    });
    if (error) return apiError("MESSAGE_FAILED", "Your message could not be saved.", 503);

    after(async () => {
      const delivery = await sendSupportNotification(parsed.data);
      if (!delivery.sent) console.error("Support notification delivery failed", { reason: delivery.reason });
    });
    return apiSuccess({ received: true, notification: "queued" }, { status: 202 });
  } catch {
    return apiError("SERVICE_UNAVAILABLE", "Support is temporarily unavailable.", 503);
  }
}
