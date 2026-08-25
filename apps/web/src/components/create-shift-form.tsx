"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import type { Locale } from "@/lib/i18n";

export function CreateShiftForm({ locale }: { locale: Locale }) {
  const isArabic = locale === "ar";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    const form = new FormData(event.currentTarget);
    const startsAt = new Date(String(form.get("startsAt")));
    const endsAt = new Date(String(form.get("endsAt")));
    const requirements = String(form.get("requirements") ?? "").split("\n").map((item) => item.trim()).filter(Boolean);

    try {
      const response = await fetch("/api/v1/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          specialty: form.get("specialty"),
          city: form.get("city"),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          neededCount: Number(form.get("neededCount")),
          hourlyRate: form.get("hourlyRate") ? Number(form.get("hourlyRate")) : undefined,
          currency: "SAR",
          requirements,
          publish: form.get("publish") === "on",
        }),
      });
      if (!response.ok) throw new Error("request_failed");
      event.currentTarget.reset();
      setResult({ ok: true, message: isArabic ? "تم إنشاء المناوبة بنجاح." : "Shift created successfully." });
      router.refresh();
    } catch {
      setResult({ ok: false, message: isArabic ? "تعذر إنشاء المناوبة. راجع البيانات وحاول مجددًا." : "The shift could not be created. Review the details and try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label htmlFor="title">{isArabic ? "عنوان المناوبة" : "Shift title"}</Label><Input id="title" name="title" required minLength={3} /></div>
        <div><Label htmlFor="specialty">{isArabic ? "التخصص المطلوب" : "Required specialty"}</Label><Input id="specialty" name="specialty" required /></div>
        <div><Label htmlFor="city">{isArabic ? "المدينة" : "City"}</Label><Input id="city" name="city" required /></div>
        <div><Label htmlFor="startsAt">{isArabic ? "البداية" : "Starts"}</Label><Input id="startsAt" name="startsAt" type="datetime-local" required /></div>
        <div><Label htmlFor="endsAt">{isArabic ? "النهاية" : "Ends"}</Label><Input id="endsAt" name="endsAt" type="datetime-local" required /></div>
        <div><Label htmlFor="neededCount">{isArabic ? "العدد المطلوب" : "People needed"}</Label><Input id="neededCount" name="neededCount" type="number" min="1" max="100" defaultValue="1" required /></div>
        <div><Label htmlFor="hourlyRate">{isArabic ? "الأجر بالساعة (ر.س.)" : "Hourly rate (SAR)"}</Label><Input id="hourlyRate" name="hourlyRate" type="number" min="1" step="0.01" /></div>
        <div className="sm:col-span-2"><Label htmlFor="requirements">{isArabic ? "المتطلبات — سطر لكل متطلب" : "Requirements — one per line"}</Label><textarea id="requirements" name="requirements" rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10" /></div>
      </div>
      <label className="flex items-center gap-3 text-sm font-bold text-slate-700"><input type="checkbox" name="publish" className="size-4 accent-brand-700" />{isArabic ? "نشر المناوبة مباشرة" : "Publish immediately"}</label>
      {result && <div role={result.ok ? "status" : "alert"} className={`flex items-center gap-3 rounded-xl p-4 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{result.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}{result.message}</div>}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:justify-self-end">{pending ? <LoaderCircle className="size-5 animate-spin" /> : <Plus className="size-5" />}{pending ? (isArabic ? "جارٍ الإنشاء..." : "Creating...") : (isArabic ? "إنشاء المناوبة" : "Create shift")}</Button>
    </form>
  );
}
