"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import type { Locale } from "@/lib/i18n";

export function CreateShiftForm({ locale, canPublish }: { locale: Locale; canPublish: boolean }) {
  const isArabic = locale === "ar";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
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
          currency: form.get("currency"),
          requirements,
          publish: form.get("publish") === "on",
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: { code?: string } } | null;
        if (payload?.error?.code === "ORGANIZATION_NOT_ACTIVE") {
          setResult({
            ok: false,
            message: isArabic
              ? "يمكنك حفظ المناوبة كمسودة الآن. يتاح النشر بعد اعتماد المنشأة."
              : "You can save this shift as a draft. Publishing is available after the organization is approved.",
          });
          return;
        }
        if (payload?.error?.code === "UNAUTHORIZED") {
          setResult({ ok: false, message: isArabic ? "انتهت الجلسة. سجّل الدخول ثم حاول مجددًا." : "Your session expired. Sign in and try again." });
          return;
        }
        if (payload?.error?.code === "FORBIDDEN") {
          setResult({ ok: false, message: isArabic ? "لا توجد منشأة مُدارة مرتبطة بهذا الحساب." : "No managed organization is linked to this account." });
          return;
        }
        if (payload?.error?.code === "VALIDATION_ERROR") {
          setResult({ ok: false, message: isArabic ? "تحقق من أوقات المناوبة والحقول المطلوبة." : "Check the shift times and required fields." });
          return;
        }
        throw new Error("request_failed");
      }
      formElement.reset();
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
        <div><Label htmlFor="hourlyRate">{isArabic ? "الأجر بالساعة" : "Hourly rate"}</Label><Input id="hourlyRate" name="hourlyRate" type="number" min="1" step="0.01" /></div>
        <div><Label htmlFor="currency">{isArabic ? "العملة" : "Currency"}</Label><Select id="currency" name="currency" defaultValue="YER"><option value="YER">YER — {isArabic ? "ريال يمني" : "Yemeni rial"}</option><option value="SAR">SAR — {isArabic ? "ريال سعودي" : "Saudi riyal"}</option><option value="AED">AED — {isArabic ? "درهم إماراتي" : "UAE dirham"}</option><option value="BHD">BHD — {isArabic ? "دينار بحريني" : "Bahraini dinar"}</option><option value="KWD">KWD — {isArabic ? "دينار كويتي" : "Kuwaiti dinar"}</option><option value="OMR">OMR — {isArabic ? "ريال عُماني" : "Omani rial"}</option><option value="QAR">QAR — {isArabic ? "ريال قطري" : "Qatari riyal"}</option></Select></div>
        <div className="sm:col-span-2"><Label htmlFor="requirements">{isArabic ? "المتطلبات — سطر لكل متطلب" : "Requirements — one per line"}</Label><textarea id="requirements" name="requirements" rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10" /></div>
      </div>
      <div>
        <label className={`flex items-center gap-3 text-sm font-bold ${canPublish ? "text-slate-700" : "text-slate-400"}`}>
          <input type="checkbox" name="publish" disabled={!canPublish} className="size-4 accent-brand-700" />
          {isArabic ? "نشر المناوبة مباشرة" : "Publish immediately"}
        </label>
        {!canPublish && <p className="mt-2 text-xs text-slate-500">{isArabic ? "يمكنك حفظ مسودة الآن، وسيُتاح النشر بعد اعتماد المنشأة." : "Save a draft now; publishing unlocks after the organization is approved."}</p>}
      </div>
      {result && <div role={result.ok ? "status" : "alert"} className={`flex items-center gap-3 rounded-xl p-4 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{result.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}{result.message}</div>}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:justify-self-end">{pending ? <LoaderCircle className="size-5 animate-spin" /> : <Plus className="size-5" />}{pending ? (isArabic ? "جارٍ الإنشاء..." : "Creating...") : (isArabic ? "إنشاء المناوبة" : "Create shift")}</Button>
    </form>
  );
}
