"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import type { Locale } from "@/lib/i18n";

export function ContactForm({ locale }: { locale: Locale }) {
  const isArabic = locale === "ar";
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          subject: data.get("subject"),
          message: data.get("message"),
          website: data.get("website"),
          locale,
        }),
      });
      if (!response.ok) throw new Error("request_failed");
      form.reset();
      setResult({ ok: true, message: isArabic ? "وصلتنا رسالتك. سيتواصل معك فريقنا قريبًا." : "We received your message. Our team will be in touch soon." });
    } catch {
      setResult({ ok: false, message: isArabic ? "تعذر إرسال الرسالة الآن. راسلنا مباشرة عبر البريد." : "We could not send your message. Please email us directly." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="absolute -start-[10000px]" aria-hidden="true"><Label htmlFor="website">Website</Label><Input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><Label htmlFor="name">{isArabic ? "الاسم" : "Name"}</Label><Input id="name" name="name" autoComplete="name" required /></div>
        <div><Label htmlFor="email">{isArabic ? "البريد الإلكتروني" : "Email"}</Label><Input id="email" name="email" type="email" dir="ltr" autoComplete="email" required /></div>
      </div>
      <div><Label htmlFor="subject">{isArabic ? "الموضوع" : "Subject"}</Label><Input id="subject" name="subject" required minLength={3} /></div>
      <div><Label htmlFor="message">{isArabic ? "كيف يمكننا مساعدتك؟" : "How can we help?"}</Label><textarea id="message" name="message" rows={6} minLength={10} required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10" /></div>
      {result && <div role={result.ok ? "status" : "alert"} className={`flex items-start gap-3 rounded-xl p-4 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{result.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}{result.message}</div>}
      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto sm:justify-self-end">{pending ? <LoaderCircle className="size-5 animate-spin" /> : <Send className="size-5" />}{pending ? (isArabic ? "جارٍ الإرسال..." : "Sending...") : (isArabic ? "إرسال الرسالة" : "Send message")}</Button>
    </form>
  );
}
