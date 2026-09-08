import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function ActionRow({
  href,
  icon: Icon,
  title,
  description,
  tone = "default",
}: {
  href: Route;
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "default" | "warning";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "app-border app-surface group flex w-full items-start gap-4 rounded-2xl border p-4 text-start transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm",
        tone === "warning" && "border-amber-300 bg-amber-50/70",
      )}
    >
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tone === "warning" ? "bg-amber-100 text-amber-700" : "bg-brand-100 text-brand-700")}>
        <Icon className="size-[1.125rem]" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black app-text">{title}</span>
        <span className="mt-1 block text-xs app-text-muted">{description}</span>
      </span>
    </Link>
  );
}
