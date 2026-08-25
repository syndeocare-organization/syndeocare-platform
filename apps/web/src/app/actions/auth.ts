"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSiteUrl } from "@/lib/env";
import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { safePath } from "@/lib/utils";

export type AuthState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const signInSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(128),
  locale: z.enum(["ar", "en"]),
  next: z.string().optional(),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2).max(100),
  password: z.string().min(10).max(128),
  role: z.enum(["professional", "organization"]),
  acceptedTerms: z.literal("on"),
});

function message(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

export async function signIn(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const locale = formData.get("locale") === "en" ? "en" : "ar";
    return {
      status: "error",
      message: message(locale, "تحقق من البريد وكلمة المرور.", "Check your email and password."),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password, locale, next } = parsed.data;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return {
        status: "error",
        message: message(locale, "بيانات الدخول غير صحيحة أو الحساب غير مفعّل.", "Your credentials are invalid or the account is not active."),
      };
    }
  } catch {
    return {
      status: "error",
      message: message(locale, "خدمة الدخول غير مهيأة بعد. حاول لاحقًا.", "Sign-in is not configured yet. Please try again later."),
    };
  }

  revalidatePath("/", "layout");
  redirect(safePath(next, `/${locale}/dashboard`) as ReturnType<typeof localePath>);
}

export async function signUp(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  const fallbackLocale: Locale = formData.get("locale") === "en" ? "en" : "ar";

  if (!parsed.success) {
    return {
      status: "error",
      message: message(fallbackLocale, "أكمل الحقول المطلوبة وتحقق من كلمة المرور.", "Complete the required fields and check your password."),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password, fullName, role, locale } = parsed.data;
  let hasSession = false;
  try {
    const supabase = await createClient();
    const next = `/${locale}/onboarding`;
    const callback = new URL("/auth/callback", getSiteUrl());
    callback.searchParams.set("next", next);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callback.toString(),
        data: { full_name: fullName, role, locale },
      },
    });

    if (error) {
      return {
        status: "error",
        message: message(locale, "تعذر إنشاء الحساب. قد يكون البريد مستخدمًا مسبقًا.", "We could not create the account. The email may already be in use."),
      };
    }

    hasSession = Boolean(data.session);

    if (!hasSession) {
      return {
        status: "success",
        message: message(locale, "أرسلنا رابط التحقق إلى بريدك. افتحه لإكمال التسجيل.", "We sent a verification link to your email. Open it to continue."),
      };
    }
  } catch {
    return {
      status: "error",
      message: message(locale, "خدمة التسجيل غير مهيأة بعد. حاول لاحقًا.", "Registration is not configured yet. Please try again later."),
    };
  }

  if (hasSession) redirect(localePath(locale, "/onboarding"));
  return { status: "idle" };
}

export async function signOut(formData: FormData) {
  const localeValue = String(formData.get("locale") ?? "ar");
  const locale = isLocale(localeValue) ? localeValue : "ar";
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(localePath(locale));
}
