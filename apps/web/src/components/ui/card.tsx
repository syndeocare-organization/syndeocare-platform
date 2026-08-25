import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-brand-950/8 bg-white shadow-[0_24px_70px_-42px_rgba(10,55,85,.45)]",
        className,
      )}
      {...props}
    />
  );
}
