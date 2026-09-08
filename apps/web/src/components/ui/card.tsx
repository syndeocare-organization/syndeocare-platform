import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "app-surface app-text app-shadow app-border rounded-[1.75rem] border",
        className,
      )}
      {...props}
    />
  );
}
