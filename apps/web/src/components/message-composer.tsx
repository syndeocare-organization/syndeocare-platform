"use client";

import { LoaderCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

export function MessageComposer({ conversationId, locale }: { conversationId: string; locale: Locale }) {
  const router = useRouter();
  const isArabic = locale === "ar";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const body = String(form.get("body") ?? "").trim();
    if (!body) return;
    setPending(true);
    setError(false);
    try {
      const response = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!response.ok) throw new Error("send_failed");
      formElement.reset();
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="app-border app-surface border-t p-4 sm:p-5">
      <div className="flex items-end gap-3">
        <label className="sr-only" htmlFor="message-body">{isArabic ? "اكتب رسالة" : "Write a message"}</label>
        <textarea id="message-body" name="body" rows={2} maxLength={5000} required placeholder={isArabic ? "اكتب رسالة واضحة..." : "Write a clear message..."} className="app-border app-surface-muted app-text min-h-12 flex-1 resize-none rounded-2xl border px-4 py-3 text-sm outline-none focus:border-[var(--ring)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[color:var(--ring)]/10" />
        <Button type="submit" size="icon" disabled={pending} aria-label={isArabic ? "إرسال" : "Send"}>{pending ? <LoaderCircle className="size-5 animate-spin" /> : <Send className="size-5" />}</Button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-bold text-[var(--danger)]">{isArabic ? "تعذر إرسال الرسالة. حاول مجددًا." : "The message could not be sent. Try again."}</p>}
    </form>
  );
}
