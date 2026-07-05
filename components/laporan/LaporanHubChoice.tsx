import Link from "next/link";
import type { CSSProperties } from "react";
import type { LaporanHubChoice } from "@/lib/laporan-entry";

export default function LaporanHubChoiceCard({ choice }: { choice: LaporanHubChoice }) {
  const style = { "--card-accent": choice.accent } as CSSProperties;
  const className =
    "card-accent group flex items-start justify-between gap-4 p-6 transition hover:-translate-y-0.5 hover:shadow-modal";

  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold text-ink">{choice.title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-graphite">
          {choice.description}
        </span>
        {choice.external ? (
          <span className="status-badge mt-3 inline-block">Looker Studio</span>
        ) : null}
      </span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-1 h-5 w-5 shrink-0 text-steel transition group-hover:translate-x-0.5"
        style={{ stroke: choice.accent }}
        aria-hidden
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </>
  );

  if (choice.external) {
    return (
      <a
        href={choice.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {body}
      </a>
    );
  }

  return (
    <Link href={choice.href} className={className} style={style}>
      {body}
    </Link>
  );
}
