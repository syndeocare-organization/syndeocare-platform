import type { HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-2 block text-sm font-bold app-text", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "app-surface app-text app-border min-h-12 w-full rounded-xl border px-4 text-base outline-none transition placeholder:text-[color:var(--text-muted)] focus:border-[var(--ring)] focus:ring-4 focus:ring-[color:var(--ring)]/10",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "app-surface app-text app-border min-h-12 w-full rounded-xl border px-4 text-base outline-none transition focus:border-[var(--ring)] focus:ring-4 focus:ring-[color:var(--ring)]/10",
        className,
      )}
      {...props}
    />
  );
}

export function FieldHint({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-2 text-xs app-text-muted", className)} {...props} />;
}

export function FieldError({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;

  return (
    <p className={cn("mt-2 text-xs font-semibold text-[var(--danger)]", className)} {...props}>
      {children}
    </p>
  );
}
