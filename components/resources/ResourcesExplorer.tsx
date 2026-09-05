"use client";

import { useMemo, useState } from "react";
import AccentCard from "@/components/AccentCard";
import CardEmbed from "@/components/kandungan/CardEmbed";
import { resourcesHref } from "@/lib/resources/kategori";
import {
  filterResourceCards,
  listResourceMonthOptions,
  type ResourcesExplorerGroup,
} from "@/lib/resources/search";

export default function ResourcesExplorer({
  groups,
  accent,
  variant,
}: {
  groups: ResourcesExplorerGroup[];
  accent: string;
  variant: "hub" | "kategori";
}) {
  const allCards = useMemo(() => groups.flatMap((group) => group.cards), [groups]);
  const months = useMemo(() => listResourceMonthOptions(allCards), [allCards]);
  const latestMonth = months[0]?.value ?? "";
  const defaultMonth = variant === "kategori" ? latestMonth : "";

  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(defaultMonth);
  const [iframePreview, setIframePreview] = useState(false);

  const filtered = useMemo(
    () => filterResourceCards(allCards, { query, month }),
    [allCards, query, month],
  );

  const isFiltering = Boolean(query.trim() || month !== defaultMonth);
  const showSearch = allCards.length > 0;
  const gallery = useMemo(
    () =>
      filtered.map((item) => ({
        title: item.title,
        url: item.url,
        embed: item.embed,
      })),
    [filtered],
  );
  const showKategoriCards = variant === "hub" && !isFiltering;
  const showLetters = variant === "kategori" || isFiltering;

  return (
    <>
      {showSearch ? (
        <div
          className={
            showLetters
              ? "sticky top-16 z-30 -mx-4 mt-8 space-y-3 bg-[var(--portal-canvas,#f4f8fb)] px-4 py-3 sm:-mx-8 sm:px-8"
              : "mt-8 space-y-3"
          }
        >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12.5rem] sm:items-end">
          <div>
            <label htmlFor="carian-resources" className="label">
              Cari surat
            </label>
            <div className="relative">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-graphite"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                id="carian-resources"
                className="input pl-10"
                value={query}
                onChange={(event) => {
                  const next = event.target.value;
                  setQuery(next);
                  if (next.trim() && month === defaultMonth) {
                    setMonth("");
                  }
                }}
                placeholder="Tajuk, nama fail atau tahun"
                autoComplete="off"
              />
            </div>
          </div>
          {months.length > 0 ? (
            <div>
              <label htmlFor="bulan-resources" className="label">
                Bulan
              </label>
              <select
                id="bulan-resources"
                className="input"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              >
                <option value="">Semua bulan</option>
                {months.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        {showLetters ? (
          <button
            type="button"
            className="h-11 rounded-md border border-fog bg-white px-4 text-sm font-medium text-ink"
            aria-pressed={iframePreview}
            onClick={() => setIframePreview((v) => !v)}
          >
            {iframePreview ? "Tutup pratonton iframe" : "Buka pratonton iframe"}
          </button>
        ) : null}
        </div>
      ) : null}

      {variant === "hub" && showSearch && !isFiltering ? (
        <p className="mt-2 text-sm text-graphite">
          Carian merangkumi semua kategori. Tanpa kata kunci, ketik kad di
          bawah untuk buka kumpulan.
        </p>
      ) : null}

      {variant === "kategori" && showSearch && !isFiltering && months.length > 1 ? (
        <p className="mt-2 text-sm text-graphite">
          Paparan bulan terkini yang ada surat. Pilih bulan lain atau Semua
          bulan untuk arkib.
        </p>
      ) : null}

      {isFiltering ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-graphite">
          <span>
            {filtered.length} surat sepadan
            {variant === "hub" ? " merentas kategori" : ""}
          </span>
          <button
            type="button"
            className="font-medium text-ink underline-offset-2 hover:underline"
            onClick={() => {
              setQuery("");
              setMonth(defaultMonth);
            }}
          >
            Kosongkan carian
          </button>
        </div>
      ) : null}

      {showKategoriCards ? (
        <div className="mt-8 space-y-4">
          {groups.map((group) => {
            const n = group.cards.length;
            return (
              <AccentCard
                key={group.slug}
                href={resourcesHref(group.slug)}
                accent={accent}
                className="flex items-start gap-4 p-5"
              >
                <span
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${accent}14`, color: accent }}
                  aria-hidden
                >
                  <ResourcesKategoriIcon slug={group.slug} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold text-ink">
                    {group.title}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-graphite">
                    {group.blurb}
                  </span>
                  <span className="status-badge mt-3 inline-block">
                    {n > 0 ? `${n} bahan` : "Akan datang"}
                  </span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-1 h-5 w-5 shrink-0 transition group-hover:translate-x-0.5"
                  style={{ stroke: accent }}
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </AccentCard>
            );
          })}
        </div>
      ) : null}

      {showLetters ? (
        filtered.length === 0 ? (
          <p className="mt-8 py-8 text-center text-sm text-graphite">
            {allCards.length === 0
              ? "Kandungan akan ditambah kemudian."
              : "Tiada surat sepadan. Ubah kata carian atau bulan."}
          </p>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c, i) => (
              <CardEmbed
                key={c.id}
                title={c.title}
                blurb={variant === "hub" ? c.kategoriTitle : ""}
                url={c.url}
                typeLabel={c.typeLabel}
                embed={c.embed}
                gallery={gallery}
                galleryIndex={i}
                inlinePreview={iframePreview}
              />
            ))}
          </div>
        )
      ) : null}
    </>
  );
}

function ResourcesKategoriIcon({ slug }: { slug: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-7 w-7",
  };
  switch (slug) {
    case "surat-ustp":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3.5 7 8.5 6 8.5-6" />
        </svg>
      );
    case "surat-sekolah":
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V9l7-4 7 4v12" />
          <path d="M10 21v-5h4v5" />
        </svg>
      );
    case "pekeliling":
      return (
        <svg {...common}>
          <path d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1z" />
          <path d="M17 8.5a4 4 0 0 1 0 7" />
        </svg>
      );
    case "nota":
      return (
        <svg {...common}>
          <path d="M5 4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
          <path d="M9 3v18M12 8h3M12 12h3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M7 3h8l4 4v14H7z" />
          <path d="M15 3v4h4M10 12h6M10 16h6" />
        </svg>
      );
  }
}
