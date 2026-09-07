"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import type { Locale } from "@/lib/i18n";

export function TeamInviteForm({ locale, canInvite, canInviteManager }: { locale: Locale; canInvite: boolean; canInviteManager: boolean }) {
  const isArabic = locale === "ar";
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPending(true);
    setResult(null);
    const response = await fetch("/api/v1/team/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), role: form.get("role"), locale }) }).catch(() => null);
    setPending(false);
    if (!response?.ok) {
      const payload = await response?.json().catch(() => null) as { error?: { code?: string } } | undefined;
      const code = payload?.error?.code;
      setResult({ ok: false, message: code === "ROLE_CONFLICT" ? (isArabic ? "هذا البريد مرتبط بحساب مقدم رعاية؛ استخدم بريد حساب منشأة." : "This email belongs to a professional account; use an organization account.") : (isArabic ? "تعذر إرسال الدعوة. تحقق من البريد أو حاول لاحقًا." : "The invitation could not be sent. Check the email or try later.") });
      return;
    }
    const payload = await response.json() as { data?: { status?: string } };
    formElement.reset();
    setResult({ ok: true, message: payload.data?.status === "added" ? (isArabic ? "تمت إضافة الحساب الموجود إلى الفريق." : "The existing account was added to the team.") : (isArabic ? "أُرسلت دعوة آمنة إلى البريد." : "A secure invitation was sent by email.") });
  }
  return (
    <form onSubmit={submit} className="grid gap-5">
      <div><Label htmlFor="inviteEmail">{isArabic ? "بريد عضو الفريق" : "Team member email"}</Label><Input id="inviteEmail" name="email" type="email" dir="ltr" placeholder="team@example.com" required disabled={!canInvite || pending} /></div>
      <div><Label htmlFor="inviteRole">{isArabic ? "الصلاحية" : "Access level"}</Label><Select id="inviteRole" name="role" defaultValue="recruiter" disabled={!canInvite || pending}><option value="recruiter">{isArabic ? "مسؤول توظيف" : "Recruiter"}</option><option value="viewer">{isArabic ? "مشاهدة فقط" : "Viewer"}</option>{canInviteManager && <option value="manager">{isArabic ? "مدير" : "Manager"}</option>}</Select></div>
      <Button type="submit" disabled={!canInvite || pending} className="w-full">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />}{pending ? (isArabic ? "جارٍ الإرسال..." : "Sending...") : (isArabic ? "دعوة عضو" : "Invite member")}</Button>
      {!canInvite && <p className="text-xs text-slate-500">{isArabic ? "دعوة الأعضاء متاحة للمالك والمدير." : "Inviting members is available to owners and managers."}</p>}
      {result && <p role={result.ok ? "status" : "alert"} className={`flex items-start gap-2 rounded-xl p-3 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{result.ok ? <CheckCircle2 className="mt-0.5 size-4" /> : <AlertCircle className="mt-0.5 size-4" />}{result.message}</p>}
    </form>
  );
}
