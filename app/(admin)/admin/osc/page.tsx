import type { ReactNode } from "react";
import AccentCard from "@/components/AccentCard";
import { requireKandunganAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-7 w-7",
} as const;

const LIHAT_ICON = (
  <svg {...svgProps}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const URUS_ICON = (
  <svg {...svgProps}>
    <path d="M4 7h9M17 7h3" />
    <circle cx="15" cy="7" r="2" />
    <path d="M4 17h3M11 17h9" />
    <circle cx="9" cy="17" r="2" />
  </svg>
);

const ARROW = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 shrink-0 transition group-hover:translate-x-0.5"
    aria-hidden
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

type Choice = {
  href: string;
  accent: string;
  tag: string;
  title: string;
  description: string;
  sections: string[];
  icon: ReactNode;
};

const CHOICES: Choice[] = [
  {
    href: "/osc",
    accent: "#0EA5C9",
    tag: "Lihat",
    title: "Lihat OSC",
    description:
      "Semak imbas hab OSC seperti paparan awam — bahan, analisis dan maklumat asas dalam satu pusat.",
    sections: ["Sumber", "Analisis", "Maklumat Asas"],
    icon: LIHAT_ICON,
  },
  {
    href: "/admin/osc/urus",
    accent: "#024AD8",
    tag: "Urus",
    title: "Urus OSC",
    description:
      "Kemas kini kandungan OSC — kad bahan, nombor analisis, senarai pegawai dan tetapan.",
    sections: ["Sumber", "Analisis", "Pegawai", "Tetapan"],
    icon: URUS_ICON,
  },
];

export default async function AdminOscPage() {
  await requireKandunganAccess();

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite">
        One Stop Center
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">OSC USTP</h1>
      <p className="mt-1 max-w-xl text-sm text-graphite">
        Pilih untuk melihat hab OSC atau mengurus kandungannya. OSC kini dalaman
        sahaja — hanya boleh dilihat selepas log masuk.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CHOICES.map((c) => (
          <AccentCard
            key={c.href}
            href={c.href}
            accent={c.accent}
            className="flex h-full flex-col p-6 sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${c.accent}14`, color: c.accent }}
                aria-hidden
              >
                {c.icon}
              </span>
              <span style={{ color: c.accent }}>{ARROW}</span>
            </div>

            <span
              className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: c.accent }}
            >
              {c.tag}
            </span>
            <h2 className="mt-1 text-lg font-semibold text-ink">{c.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-graphite">
              {c.description}
            </p>

            <div className="mt-auto pt-5">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t hairline pt-3 text-xs text-graphite">
                {c.sections.map((s, i) => (
                  <span key={s} className="inline-flex items-center gap-1.5">
                    {s}
                    {i < c.sections.length - 1 ? (
                      <span className="text-fog" aria-hidden>
                        ·
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
            </div>
          </AccentCard>
        ))}
      </div>
    </>
  );
}
