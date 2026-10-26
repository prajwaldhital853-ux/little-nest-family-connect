import type { ReactNode } from "react";

interface AdminPageProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminPage({
  title,
  description,
  actions,
  children,
}: AdminPageProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className=" font-semibold text-foreground">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
