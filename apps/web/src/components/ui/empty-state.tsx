import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="app-border app-surface rounded-[1.75rem] border border-dashed px-6 py-16 text-center">
      <Icon className="mx-auto size-10 app-text-muted" aria-hidden="true" />
      <h2 className="mt-5 font-black app-text">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-7 app-text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
