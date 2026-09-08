import type { ZodError } from "zod";
import type { Locale } from "@/lib/i18n";

type MessagePair = readonly [ar: string, en: string];

export function localizedFieldErrors(
  error: ZodError,
  locale: Locale,
  messages: Record<string, MessagePair>,
  fallback: MessagePair,
) {
  const fieldErrors = error.flatten().fieldErrors;
  return Object.fromEntries(
    Object.keys(fieldErrors).map((field) => {
      const pair = messages[field] ?? fallback;
      return [field, [pair[locale === "ar" ? 0 : 1]]];
    }),
  );
}
