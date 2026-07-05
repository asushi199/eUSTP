import { cn } from "@/lib/cn";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  accent?: string;
  className?: string;
  actions?: React.ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  accent = "#024AD8",
  className,
  actions,
}: PageHeaderProps) {
  return (
    <header className={cn("portal-page-header", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p
            className="flex min-w-0 items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] sm:tracking-[0.14em]"
            style={{ color: accent }}
          >
            <span
              className="h-0.5 w-7 shrink-0 rounded"
              style={{ backgroundColor: accent }}
              aria-hidden
            />
            <span className="truncate sm:whitespace-normal">{eyebrow}</span>
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-xl text-base leading-relaxed text-graphite">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
