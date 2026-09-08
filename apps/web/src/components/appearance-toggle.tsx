"use client";

import { LaptopMinimal, Moon, Sun } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";

type Appearance = "light" | "dark" | "system";
const storageKey = "syndeocare:appearance";

const icons = {
  light: Sun,
  dark: Moon,
  system: LaptopMinimal,
} as const;

export function AppearanceToggle({ locale, className = "" }: { locale: Locale; className?: string }) {
  const isArabic = locale === "ar";
  const [value, setValue] = useState<Appearance>(() => {
    if (typeof window === "undefined") return "system";
    const saved = window.localStorage.getItem(storageKey);
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  });

  function updateAppearance(next: Appearance) {
    setValue(next);
    window.localStorage.setItem(storageKey, next);
    const resolved = next === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : next;
    document.documentElement.setAttribute("data-theme", resolved);
  }

  return (
    <div className={`items-center gap-1 rounded-full border app-border app-surface p-1 ${className || "flex"}`} role="group" aria-label={isArabic ? "المظهر" : "Appearance"}>
      {(["light", "dark", "system"] as const).map((option) => {
        const Icon = icons[option];
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => updateAppearance(option)}
            className={`inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs font-bold transition ${selected ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "app-text hover:bg-[var(--surface-muted)]"}`}
            aria-pressed={selected}
            aria-label={option === "light" ? (isArabic ? "الوضع الفاتح" : "Light mode") : option === "dark" ? (isArabic ? "الوضع الداكن" : "Dark mode") : (isArabic ? "حسب النظام" : "System mode")}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">
              {option === "light" ? (isArabic ? "فاتح" : "Light") : option === "dark" ? (isArabic ? "داكن" : "Dark") : (isArabic ? "النظام" : "System")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
