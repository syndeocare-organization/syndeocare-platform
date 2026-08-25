import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BrandLogo({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <Link
      href={localePath(locale)}
      className={cn("inline-flex shrink-0 items-center", className)}
      aria-label={locale === "ar" ? "الصفحة الرئيسية لـ SyndeoCare" : "SyndeoCare home"}
    >
      <Image
        src="/brand/syndeocare-logo.png"
        alt="SyndeoCare"
        width={173}
        height={44}
        className="h-auto w-[154px] sm:w-[173px]"
        priority
      />
    </Link>
  );
}
