"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSiteUrl } from "@/lib/env";
import { localizedFieldErrors } from "@/lib/form-errors";
import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { safePath } from "@/lib/utils";

export type AuthState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const PENDING_EMAIL_COOKIE = "syndeocare_pending_email";

function authCallback(locale: Locale, next: string) {
  const callback = new URL("/auth/confirm", getSiteUrl());
  callback.searchParams.set("next", `/${locale}${next}`);
  return callback.toString();
}

async function rememberPendingEmail(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(PENDING_EMAIL_COOKIE, email, {
    httpOnly: true,
    maxAge: 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: getSiteUrl().startsWith("https://"),
  });
}

function authErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const code = "code" in error ? error.code : "";
  return typeof code === "string" ? code : "";
}

const signInSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(6).max(128),
  locale: z.enum(["ar", "en"]),
  next: z.string().optional(),
});

const passwordSchema = z
  .string()
  .min(10)
  .max(128)
  .regex(/\p{L}/u)
  .regex(/\p{N}/u);

const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2).max(100),
  password: passwordSchema,
  role: z.enum(["professional", "organization"]),
  acceptedTerms: z.literal("on"),
});

const recoveryRequestSchema = z.object({
  email: z.email().max(254),
  locale: z.enum(["ar", "en"]),
});

const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
    locale: z.enum(["ar", "en"]),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

function message(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

const authFieldMessages = {
  email: ["أدخل بريدًا إلكترونيًا صحيحًا.", "Enter a valid email address."],
  password: ["تحقق من متطلبات كلمة المرور.", "Check the password requirements."],
  confirmPassword: ["يجب أن تتطابق كلمتا المرور.", "The passwords must match."],
  fullName: ["أدخل الاسم الكامل كما يظهر في الهوية.", "Enter your full name as shown on your ID."],
  role: ["اختر نوع الحساب.", "Choose an account type."],
  acceptedTerms: ["يجب الموافقة على الشروط وسياسة الخصوصية.", "Accept the Terms and Privacy Policy to continue."],
} as const;

function fieldErrors(error: z.ZodError, locale: Locale) {
  return localizedFieldErrors(
    error,
    locale,
    authFieldMessages,
    ["تحقق من هذا الحقل.", "Check this field."],
  );
}

export async function signIn(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const locale = formData.get("locale") === "en" ? "en" : "ar";
    return {
      status: "error",
      message: message(locale, "تحقق من البريد وكلمة المرور.", "Check your email and password."),
      fieldErrors: fieldErrors(parsed.error, locale),
    };
  }

  const { password, locale, next } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  let needsConfirmation = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (authErrorCode(error) === "email_not_confirmed") {
        await rememberPendingEmail(email);
        needsConfirmation = true;
      } else {
        return {
          status: "error",
          message: message(locale, "البريد الإلكتروني أو كلمة المرور غير صحيحة.", "Your email or password is incorrect."),
        };
      }
    }
  } catch {
    return {
      status: "error",
      message: message(locale, "خدمة الدخول غير مهيأة بعد. حاول لاحقًا.", "Sign-in is not configured yet. Please try again later."),
    };
  }

  if (needsConfirmation) {
    redirect(localePath(locale, "/auth/check-email?reason=unconfirmed"));
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
      fieldErrors: fieldErrors(parsed.error, fallbackLocale),
    };
  }

  const { password, fullName, role, locale } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  let hasSession = false;
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authCallback(locale, "/onboarding"),
        data: { full_name: fullName, role, locale },
      },
    });

    if (error) {
      const code = authErrorCode(error);
      return {
        status: "error",
        message: code === "over_email_send_rate_limit"
          ? message(locale, "تم إرسال رسالة قبل قليل. انتظر دقيقة ثم أعد المحاولة.", "An email was sent recently. Wait a minute, then try again.")
          : code === "signup_disabled"
            ? message(locale, "إنشاء الحسابات متوقف مؤقتًا. تواصل مع الدعم.", "Account creation is temporarily paused. Contact support.")
            : message(locale, "تعذر إنشاء الحساب الآن. راجع البيانات وحاول مرة أخرى.", "We could not create the account. Review the details and try again."),
      };
    }

    hasSession = Boolean(data.session);

    if (!hasSession) {
      await rememberPendingEmail(email);
    }
  } catch {
    return {
      status: "error",
      message: message(locale, "خدمة التسجيل غير مهيأة بعد. حاول لاحقًا.", "Registration is not configured yet. Please try again later."),
    };
  }

  redirect(localePath(locale, hasSession ? "/onboarding" : "/auth/check-email"));
}

export async function resendSignupConfirmation(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale: Locale = formData.get("locale") === "en" ? "en" : "ar";
  const cookieStore = await cookies();
  const email = cookieStore.get(PENDING_EMAIL_COOKIE)?.value?.trim().toLowerCase();

  if (!email || !z.email().safeParse(email).success) {
    return {
      status: "error",
      message: message(locale, "ابدأ التسجيل من جديد لتأكيد البريد الصحيح.", "Start registration again to confirm the correct email."),
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: authCallback(locale, "/onboarding") },
    });

    if (error) {
      return {
        status: "error",
        message: authErrorCode(error) === "over_email_send_rate_limit"
          ? message(locale, "انتظر قليلًا قبل طلب رسالة أخرى.", "Please wait before requesting another email.")
          : message(locale, "تعذر إرسال الرسالة الآن. حاول بعد قليل.", "We could not send the email. Try again shortly."),
      };
    }
  } catch {
    return {
      status: "error",
      message: message(locale, "خدمة البريد غير متاحة مؤقتًا.", "Email delivery is temporarily unavailable."),
    };
  }

  return {
    status: "success",
    message: message(locale, "أرسلنا رابطًا جديدًا. افحص الوارد والرسائل غير المرغوبة.", "We sent a new link. Check your inbox and spam folder."),
  };
}

export async function requestPasswordReset(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = recoveryRequestSchema.safeParse(Object.fromEntries(formData));
  const locale: Locale = formData.get("locale") === "en" ? "en" : "ar";

  if (!parsed.success) {
    return {
      status: "error",
      message: message(locale, "أدخل بريدًا إلكترونيًا صحيحًا.", "Enter a valid email address."),
      fieldErrors: fieldErrors(parsed.error, locale),
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: authCallback(parsed.data.locale, "/auth/reset-password"),
    });

    if (error) {
      return {
        status: "error",
        message: message(locale, "تعذر إرسال الرابط الآن. حاول بعد قليل.", "We could not send the link. Try again shortly."),
      };
    }
  } catch {
    return {
      status: "error",
      message: message(locale, "خدمة استعادة الحساب غير متاحة مؤقتًا.", "Account recovery is temporarily unavailable."),
    };
  }

  return {
    status: "success",
    message: message(
      locale,
      "إذا كان البريد مسجلًا، فسيصلك رابط آمن لإعادة تعيين كلمة المرور.",
      "If the email is registered, you will receive a secure reset link.",
    ),
  };
}

export async function updatePassword(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = passwordUpdateSchema.safeParse(Object.fromEntries(formData));
  const locale: Locale = formData.get("locale") === "en" ? "en" : "ar";

  if (!parsed.success) {
    return {
      status: "error",
      message: message(locale, "تحقق من كلمة المرور وتطابقها.", "Check the password and confirmation."),
      fieldErrors: fieldErrors(parsed.error, locale),
    };
  }

  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        status: "error",
        message: message(locale, "انتهت صلاحية الرابط. اطلب رابطًا جديدًا.", "This link has expired. Request a new one."),
      };
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      return {
        status: "error",
        message: message(locale, "تعذر تحديث كلمة المرور. اطلب رابطًا جديدًا.", "We could not update the password. Request a new link."),
      };
    }

    await supabase.auth.signOut({ scope: "local" });
  } catch {
    return {
      status: "error",
      message: message(locale, "الخدمة غير متاحة مؤقتًا. حاول لاحقًا.", "The service is temporarily unavailable."),
    };
  }

  revalidatePath("/", "layout");
  redirect(localePath(locale, "/auth/login?reset=success"));
}

export async function signOut(formData: FormData) {
  const localeValue = String(formData.get("locale") ?? "ar");
  const locale = isLocale(localeValue) ? localeValue : "ar";
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(localePath(locale));
}
