"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useScrollReveal } from "@/lib/scroll-reveal";
import type { HomeModuleItem } from "@/lib/home-modules";

type ModuleCardProps = {
  href: string;
  title: string;
  icon: ReactNode;
  accent: string;
  index: number;
  cta: string;
  items: HomeModuleItem[];
  moreLabel?: string;
};

export function ModuleCard({
  href,
  title,
  icon,
  accent,
  index,
  cta,
  items,
  moreLabel,
}: ModuleCardProps) {
  const { ref, visible } = useScrollReveal<HTMLElement>();

  return (
    <article
      ref={ref}
      className={`portal-module-card${visible ? " is-visible" : ""}`}
      style={
        {
          "--module-accent": accent,
          "--module-index": index,
        } as CSSProperties
      }
    >
      <Link href={href} className="portal-module-card-head">
        <span className="portal-module-icon [&_svg]:!h-5 [&_svg]:!w-5 [&_img]:!h-5 [&_img]:!w-5">
          {icon}
        </span>
        <span className="portal-module-card-title">{title}</span>
      </Link>
      <div className="portal-module-card-body">
        <ul className="portal-module-card-list">
          {items.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="portal-module-card-item"
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                >
                  <span>{item.label}</span>
                  <ItemChevron />
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          ))}
          {moreLabel ? (
            <li className="portal-module-card-more">
              <Link href={href} className="portal-module-card-item">
                <span>{moreLabel}</span>
                <ItemChevron />
              </Link>
            </li>
          ) : null}
        </ul>
        <Link href={href} className="portal-module-card-cta">
          {cta}
          <span aria-hidden> →</span>
        </Link>
      </div>
    </article>
  );
}

function ItemChevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="portal-module-card-item-chevron"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
