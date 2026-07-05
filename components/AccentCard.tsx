import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

type AccentCardProps = {
  href?: string;
  accent?: string;
  className?: string;
  children: ReactNode;
};

export default function AccentCard({
  href,
  accent = "#024AD8",
  className,
  children,
}: AccentCardProps) {
  const style = { "--card-accent": accent } as CSSProperties;
  const classes = cn(
    "card-accent group block transition hover:-translate-y-0.5 hover:shadow-modal",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}
