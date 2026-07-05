"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useScrollReveal } from "@/lib/scroll-reveal";

type ModuleCardProps = {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  accent: string;
  index: number;
};

export function ModuleCard({
  href,
  title,
  description,
  icon,
  accent,
  index,
}: ModuleCardProps) {
  const { ref, visible } = useScrollReveal<HTMLAnchorElement>();

  return (
    <Link
      ref={ref}
      href={href}
      className={`portal-module-card group${visible ? " is-visible" : ""}`}
      style={
        {
          "--module-accent": accent,
          "--module-index": index,
        } as CSSProperties
      }
    >
      <span className="portal-module-icon">{icon}</span>
      <span className="flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-lg font-semibold text-ink">{title}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-steel transition group-hover:translate-x-0.5"
            style={{ stroke: "var(--module-accent)" }}
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-graphite">
          {description}
        </span>
      </span>
    </Link>
  );
}
