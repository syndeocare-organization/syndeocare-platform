"use client";

import { AlertTriangle, CheckCircle2, LoaderCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { localePath, type Locale } from "@/lib/i18n";

export function DeleteAccountPanel({ locale }: { locale: Locale }) {
  const isArabic = locale === "ar";
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<"deleted" | "unauthorized" | "error" | null>(null);

  async function removeAccount() {
    setPending(true);
    setResult(null);
    try {
      const response = await fetch("/api/v1/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) });
      if (response.status === 401) setResult("unauthorized");
      else if (response.status === 204) setResult("deleted");
      else setResult("error");
    } catch {
      setResult("error");
    } finally {
      setPending(false);
    }
  }

  if (result === "deleted") return <div role="status" className="rounded-2xl bg-emerald-50 p-6 text-emerald-800"><CheckCircle2 className="size-6" /><h2 className="mt-4 text-xl font-black">{isArabic ? "تم حذف الحساب" : "Account deleted"}</h2><p className="mt-2 text-sm leading-7">{isArabic ? "تم حذف هوية الدخول والبيانات المرتبطة وفق سياسة الاحتفاظ." : "Your sign-in identity and associated data were deleted subject to our retention policy."}</p></div>;

  return (
    <div>
      <div className="flex gap-4 rounded-2xl bg-amber-50 p-5 text-amber-950"><AlertTriangle className="mt-0.5 size-5 shrink-0" /><p className="text-sm leading-7">{isArabic ? "هذا إجراء نهائي. ستفقد الوصول إلى ملفك وطلباتك ورسائلك. قد نحتفظ بسجلات محدودة عندما يفرض النظام ذلك." : "This is permanent. You will lose access to your profile, applications, and messages. Limited records may be retained where legally required."}</p></div>
      <div className="mt-6"><Label htmlFor="confirmation">{isArabic ? "اكتب DELETE للتأكيد" : "Type DELETE to confirm"}</Label><Input id="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} dir="ltr" autoComplete="off" /></div>
      {result === "unauthorized" && <div role="alert" className="mt-5 rounded-xl bg-brand-50 p-4 text-sm text-brand-900">{isArabic ? "يجب تسجيل الدخول إلى الحساب الذي تريد حذفه." : "Sign in to the account you want to delete."}<Link className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-3 w-full`} href={localePath(locale, "/auth/login?next=/" + locale + "/delete-account")}>{isArabic ? "تسجيل الدخول" : "Sign in"}</Link></div>}
      {result === "error" && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{isArabic ? "تعذر حذف الحساب الآن. تواصل مع الدعم للمساعدة." : "The account could not be deleted. Contact support for help."}</p>}
      <Button variant="danger" size="lg" className="mt-6 w-full" disabled={confirmation !== "DELETE" || pending} onClick={removeAccount}>{pending ? <LoaderCircle className="size-5 animate-spin" /> : <Trash2 className="size-5" />}{pending ? (isArabic ? "جارٍ الحذف..." : "Deleting...") : (isArabic ? "حذف حسابي نهائيًا" : "Permanently delete my account")}</Button>
    </div>
  );
}
