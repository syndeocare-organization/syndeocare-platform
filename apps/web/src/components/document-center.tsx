"use client";

import { AlertCircle, CheckCircle2, Download, FileText, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import type { VerificationDocument } from "@/lib/data/documents";
import type { Locale } from "@/lib/i18n";

function labels(value: string, locale: Locale) {
  const all: Record<string, [string, string]> = {
    identity: ["الهوية", "Identity"],
    professional_license: ["الترخيص المهني", "Professional license"],
    certificate: ["شهادة", "Certificate"],
    insurance: ["التأمين", "Insurance"],
    other: ["مستند آخر", "Other document"],
    pending: ["قيد المراجعة", "In review"],
    approved: ["معتمد", "Approved"],
    rejected: ["يحتاج تحديثًا", "Needs update"],
    expired: ["منتهي", "Expired"],
  };
  return all[value]?.[locale === "ar" ? 0 : 1] ?? value;
}

function statusTone(status: string) {
  if (status === "approved") return "bg-emerald-100 text-emerald-800";
  if (status === "rejected" || status === "expired") return "bg-red-50 text-red-700";
  return "bg-amber-100 text-amber-800";
}

export function DocumentCenter({ locale, documents }: { locale: Locale; documents: VerificationDocument[] }) {
  const isArabic = locale === "ar";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    const formElement = event.currentTarget;
    try {
      const response = await fetch("/api/v1/documents", { method: "POST", body: new FormData(formElement) });
      const payload = await response.json().catch(() => null) as { error?: { code?: string } } | null;
      if (!response.ok) {
        const code = payload?.error?.code;
        setResult({ ok: false, message: code === "FILE_TOO_LARGE" ? (isArabic ? "الحد الأقصى 10 ميجابايت." : "The maximum size is 10 MB.") : code === "UNSUPPORTED_FILE" ? (isArabic ? "ارفع PDF أو JPG أو PNG فقط." : "Upload only PDF, JPG, or PNG.") : (isArabic ? "تعذر رفع المستند." : "The document could not be uploaded.") });
        return;
      }
      formElement.reset();
      setResult({ ok: true, message: isArabic ? "تم رفع المستند وإرساله للمراجعة." : "Document uploaded and sent for review." });
      router.refresh();
    } catch {
      setResult({ ok: false, message: isArabic ? "تعذر الاتصال بالخدمة." : "Could not connect to the service." });
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(isArabic ? "هل تريد حذف هذا المستند؟" : "Delete this document?")) return;
    setDeleting(id);
    const response = await fetch(`/api/v1/documents/${id}`, { method: "DELETE" }).catch(() => null);
    setDeleting(null);
    if (!response?.ok) {
      setResult({ ok: false, message: isArabic ? "تعذر حذف المستند." : "The document could not be deleted." });
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
      <form onSubmit={upload} className="h-fit rounded-[1.75rem] border border-brand-950/8 bg-white p-6 shadow-sm sm:p-7">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand-100 text-brand-700"><UploadCloud className="size-6" /></span>
        <h2 className="mt-6 text-xl font-black">{isArabic ? "رفع مستند" : "Upload a document"}</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">{isArabic ? "ملفاتك خاصة ولا يراها إلا أنت وفريق التحقق." : "Your files are private and visible only to you and the verification team."}</p>
        <div className="mt-6 grid gap-5">
          <div><Label htmlFor="documentType">{isArabic ? "نوع المستند" : "Document type"}</Label><Select id="documentType" name="type" defaultValue="professional_license"><option value="identity">{labels("identity", locale)}</option><option value="professional_license">{labels("professional_license", locale)}</option><option value="certificate">{labels("certificate", locale)}</option><option value="insurance">{labels("insurance", locale)}</option><option value="other">{labels("other", locale)}</option></Select></div>
          <div><Label htmlFor="documentFile">{isArabic ? "الملف" : "File"}</Label><Input id="documentFile" name="file" type="file" accept="application/pdf,image/jpeg,image/png" required className="py-2 file:me-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-black file:text-brand-700" /><p className="mt-2 text-xs text-slate-500">PDF, JPG, PNG · {isArabic ? "حتى 10 ميجابايت" : "up to 10 MB"}</p></div>
          <div><Label htmlFor="expiresOn">{isArabic ? "تاريخ الانتهاء (اختياري)" : "Expiry date (optional)"}</Label><Input id="expiresOn" name="expiresOn" type="date" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}{pending ? (isArabic ? "جارٍ الرفع..." : "Uploading...") : (isArabic ? "رفع وإرسال للمراجعة" : "Upload for review")}</Button>
          {result && <p role={result.ok ? "status" : "alert"} className={`flex items-start gap-2 rounded-xl p-3 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{result.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}{result.message}</p>}
        </div>
      </form>

      <section className="grid content-start gap-4" aria-label={isArabic ? "المستندات المرفوعة" : "Uploaded documents"}>
        {documents.length ? documents.map((document) => (
          <article key={document.id} className="rounded-[1.5rem] border border-brand-950/8 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600"><FileText className="size-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{labels(document.type, locale)}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusTone(document.status)}`}>{labels(document.status, locale)}</span></div><p className="mt-1 truncate text-sm text-slate-500" dir="auto">{document.originalFilename}</p><p className="mt-2 text-xs text-slate-400">{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium" }).format(new Date(document.createdAt))}{document.expiresOn ? ` · ${isArabic ? "ينتهي" : "expires"} ${document.expiresOn}` : ""}</p></div></div>
              <div className="flex shrink-0 gap-2"><a href={`/api/v1/documents/${document.id}`} className={buttonVariants({ variant: "secondary", size: "icon" })} aria-label={isArabic ? "تنزيل المستند" : "Download document"}><Download className="size-4" /></a><Button type="button" variant="ghost" size="icon" onClick={() => remove(document.id)} disabled={deleting === document.id} aria-label={isArabic ? "حذف المستند" : "Delete document"}>{deleting === document.id ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4 text-red-600" />}</Button></div>
            </div>
            {document.reviewNote && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900"><strong>{isArabic ? "ملاحظة المراجعة:" : "Review note:"}</strong> {document.reviewNote}</p>}
          </article>
        )) : <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center"><FileText className="mx-auto size-10 text-slate-300" /><h2 className="mt-5 font-black text-slate-700">{isArabic ? "لم ترفع مستندات بعد" : "No documents uploaded"}</h2><p className="mt-2 text-sm text-slate-500">{isArabic ? "ابدأ بالهوية والترخيص المهني لتسريع التحقق." : "Start with your ID and license to speed up verification."}</p></div>}
      </section>
    </div>
  );
}
