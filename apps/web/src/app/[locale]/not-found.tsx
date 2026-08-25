import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="page-shell grid min-h-[75svh] place-items-center py-16 text-center">
      <div>
        <p className="text-8xl font-black tracking-tighter text-brand-100">404</p>
        <h1 className="mt-6 text-3xl font-black">الصفحة غير موجودة · Page not found</h1>
        <p className="mt-4 text-slate-600">تحقق من الرابط أو عد إلى الصفحة الرئيسية.</p>
        <div className="mt-8 flex justify-center gap-3"><Link href="/ar" className={buttonVariants()}><Home className="size-4" />العربية</Link><Link href="/en" className={buttonVariants({ variant: "secondary" })}>English<ArrowLeft className="size-4" /></Link></div>
      </div>
    </main>
  );
}
