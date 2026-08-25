"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page-shell grid min-h-[70svh] place-items-center py-16 text-center">
      <div className="max-w-lg">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-700"><AlertTriangle className="size-7" /></span>
        <h1 className="mt-7 text-3xl font-black">تعذر تحميل هذه الصفحة</h1>
        <p className="mt-3 text-slate-600">Something went wrong while loading this page.</p>
        <Button type="button" className="mt-7" onClick={reset}><RotateCcw className="size-4" />حاول مرة أخرى · Try again</Button>
      </div>
    </main>
  );
}
