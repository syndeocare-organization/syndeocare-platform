import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-700 text-white shadow-[0_10px_30px_-12px_rgba(16,79,120,.8)] hover:-translate-y-0.5 hover:bg-brand-800",
        secondary:
          "border border-brand-900/10 bg-white text-brand-950 shadow-sm hover:-translate-y-0.5 hover:border-brand-700/25 hover:bg-brand-50",
        ghost: "text-brand-900 hover:bg-brand-50",
        danger: "bg-red-700 text-white hover:bg-red-800",
      },
      size: {
        default: "min-h-11 px-5",
        lg: "min-h-13 px-7 text-base",
        sm: "min-h-9 px-4 text-xs",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
