import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

type AccentCardProps = {
  href?: string;
  accent?: string;
  className?: string;
  children: ReactNode;
  /** Pautan luar (cth. Looker Studio) — buka tab baharu. */
  external?: boolean;
};

export default function AccentCard({
  href,
  accent = "#024AD8",
  className,
  children,
  external = false,
}: AccentCardProps) {
  const style = { "--card-accent": accent } as CSSProperties;
  const classes = cn(
    "card-accent group block transition hover:-translate-y-0.5 hover:shadow-modal",
    className,
  );

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
          style={style}
        >
          {children}
        </a>
      );
    }
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
