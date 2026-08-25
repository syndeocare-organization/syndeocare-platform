export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

import type { Route } from "next";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function direction(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function alternateLocale(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar";
}

export function localePath(locale: Locale, path = ""): Route {
  return `/${locale}${path}` as Route;
}

export const copy = {
  ar: {
    brandTagline: "منصة الرعاية الموثوقة",
    nav: {
      professionals: "لمقدمي الرعاية",
      clinics: "للمنشآت الصحية",
      safety: "الثقة والجودة",
      support: "الدعم",
      login: "تسجيل الدخول",
      join: "ابدأ الآن",
      dashboard: "لوحة التحكم",
      language: "English",
    },
    hero: {
      eyebrow: "كوادر موثوقة. رعاية بلا انقطاع.",
      titleLead: "الرعاية الأفضل تبدأ",
      titleAccent: "بمن يقدّمها.",
      description:
        "نربط المنشآت الصحية بكفاءات تمريضية ورعائية موثّقة، بسرعة ووضوح ومن مكان واحد.",
      primary: "أنا مقدم رعاية",
      secondary: "أمثّل منشأة صحية",
      assurance: "تحقق مهني • مطابقة ذكية • دعم مستمر",
    },
    stats: [
      ["24/7", "جاهزية المنصة"],
      ["100%", "ملفات قابلة للتحقق"],
      ["مكان واحد", "للمناوبات والفريق"],
    ],
    roles: {
      eyebrow: "بُنيت للطرفين",
      title: "كل ما تحتاجه لإنجاز العمل بثقة",
      professional: {
        label: "لمقدمي الرعاية",
        title: "مسيرتك المهنية، بيدك",
        description:
          "ملف مهني موثّق، فرص واضحة، وإدارة سهلة لمواعيدك ومستنداتك.",
        items: ["فرص تناسب تخصصك", "مواعيد وطلبات في مكان واحد", "ملف مهني موثوق"],
        cta: "أنشئ ملفك المهني",
      },
      clinic: {
        label: "للمنشآت الصحية",
        title: "الفريق المناسب، حين تحتاجه",
        description:
          "انشر احتياجك، راجع الكفاءات، ونظّم التغطية التشغيلية بوضوح.",
        items: ["وصول إلى كوادر مؤهلة", "تتبّع مباشر للطلبات", "أدوار وصلاحيات للفريق"],
        cta: "سجّل منشأتك",
      },
    },
    steps: {
      eyebrow: "ببساطة SyndeoCare",
      title: "من الاحتياج إلى التغطية بثلاث خطوات",
      items: [
        ["01", "أنشئ ملفك", "أدخل بياناتك الأساسية وحدد دورك واحتياجاتك."],
        ["02", "تحقق وطابق", "تُراجع المستندات وتظهر الفرص أو الكفاءات الأنسب."],
        ["03", "ابدأ بثقة", "أدر الطلبات والمناوبات والتواصل من لوحة واحدة."],
      ],
    },
    safety: {
      eyebrow: "الثقة ليست ميزة إضافية",
      title: "أساس كل اتصال داخل المنصة",
      description:
        "صممنا SyndeoCare حول التحقق، الحد الأدنى من الوصول، وسجل واضح للإجراءات المهمة.",
      items: [
        ["تحقق مهني", "مسار منظم لمراجعة الهوية والتراخيص والمستندات."],
        ["خصوصية من البداية", "صلاحيات دقيقة وسياسات وصول على مستوى كل سجل."],
        ["شفافية تشغيلية", "حالات واضحة للطلبات والتنبيهات والخطوات التالية."],
      ],
    },
    finalCta: {
      title: "جاهز نبني رعاية أكثر اتصالًا؟",
      description: "ابدأ بملفك اليوم، واجعل كل مناوبة وخطوة أوضح.",
      button: "انضم إلى SyndeoCare",
    },
    footer: {
      description: "منصة تربط الكفاءات الرعائية بالمنشآت الصحية بثقة ووضوح.",
      privacy: "الخصوصية",
      delete: "حذف الحساب",
      copyright: "جميع الحقوق محفوظة.",
    },
  },
  en: {
    brandTagline: "Trusted care platform",
    nav: {
      professionals: "For professionals",
      clinics: "For care teams",
      safety: "Trust & quality",
      support: "Support",
      login: "Sign in",
      join: "Get started",
      dashboard: "Dashboard",
      language: "العربية",
    },
    hero: {
      eyebrow: "Trusted people. Uninterrupted care.",
      titleLead: "Better care starts with",
      titleAccent: "the people behind it.",
      description:
        "SyndeoCare connects healthcare teams with verified nursing and care professionals—quickly, clearly, and in one place.",
      primary: "I am a care professional",
      secondary: "I represent a care team",
      assurance: "Professional verification • Smart matching • Ongoing support",
    },
    stats: [
      ["24/7", "platform readiness"],
      ["100%", "verifiable profiles"],
      ["One place", "for shifts and teams"],
    ],
    roles: {
      eyebrow: "Built for both sides",
      title: "Everything you need to work with confidence",
      professional: {
        label: "For care professionals",
        title: "Your career, in your hands",
        description:
          "A verified professional profile, transparent opportunities, and simple scheduling and document management.",
        items: ["Roles matched to your specialty", "Requests and schedules in one place", "A trusted professional profile"],
        cta: "Create your profile",
      },
      clinic: {
        label: "For healthcare teams",
        title: "The right people, when needed",
        description:
          "Post staffing needs, review professionals, and manage coverage with clarity.",
        items: ["Access qualified professionals", "Track requests in real time", "Team roles and permissions"],
        cta: "Register your organization",
      },
    },
    steps: {
      eyebrow: "Simply SyndeoCare",
      title: "From staffing need to coverage in three steps",
      items: [
        ["01", "Create your profile", "Add the essentials and choose your role and needs."],
        ["02", "Verify and match", "Documents are reviewed and the best opportunities or people surface."],
        ["03", "Move with confidence", "Manage requests, shifts, and communication from one dashboard."],
      ],
    },
    safety: {
      eyebrow: "Trust is not an add-on",
      title: "It is the foundation of every connection",
      description:
        "SyndeoCare is designed around verification, least-privilege access, and a clear record of important actions.",
      items: [
        ["Professional verification", "A structured path for reviewing identity, licenses, and documents."],
        ["Privacy by design", "Fine-grained permissions and row-level access policies."],
        ["Operational clarity", "Clear states for requests, alerts, and next steps."],
      ],
    },
    finalCta: {
      title: "Ready to build more connected care?",
      description: "Start your profile today and make every shift and next step clearer.",
      button: "Join SyndeoCare",
    },
    footer: {
      description: "Connecting care professionals and healthcare teams with trust and clarity.",
      privacy: "Privacy",
      delete: "Delete account",
      copyright: "All rights reserved.",
    },
  },
} as const;

export function getCopy(locale: Locale) {
  return copy[locale];
}
