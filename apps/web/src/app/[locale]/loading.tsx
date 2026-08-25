export default function Loading() {
  return (
    <main className="page-shell animate-pulse py-16" aria-label="Loading">
      <div className="h-5 w-36 rounded-full bg-brand-100" />
      <div className="mt-8 h-14 max-w-2xl rounded-2xl bg-slate-200" />
      <div className="mt-4 h-6 max-w-xl rounded-xl bg-slate-100" />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-40 rounded-3xl bg-white shadow-sm" />)}
      </div>
    </main>
  );
}
