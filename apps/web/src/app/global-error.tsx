"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#fcfbf7", color: "#082936" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div><h1>حدث خطأ غير متوقع</h1><p>Unexpected application error.</p><button type="button" onClick={reset} style={{ marginTop: 20, border: 0, borderRadius: 999, padding: "12px 20px", background: "#155f74", color: "white", fontWeight: 700 }}>إعادة المحاولة · Retry</button></div>
        </main>
      </body>
    </html>
  );
}
