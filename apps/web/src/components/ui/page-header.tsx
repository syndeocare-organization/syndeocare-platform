import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 app-text-muted">{description}</p> : null}
      </div>
      {action}
    </section>
  );
}
