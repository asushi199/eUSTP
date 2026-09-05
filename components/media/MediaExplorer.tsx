"use client";

import { useMemo, useState } from "react";
import AccentCard from "@/components/AccentCard";
import CardEmbed from "@/components/kandungan/CardEmbed";
import { mediaHref } from "@/lib/media/kategori";
import {
  filterResourceCards,
  listResourceMonthOptions,
  type ResourcesExplorerGroup,
} from "@/lib/resources/search";

export type MediaLinkItem = {
  label: string;
  href: string;
};

export default function MediaExplorer({
  groups,
  accent,
  variant,
  linkItems = [],
  plannedItems = [],
}: {
  groups: ResourcesExplorerGroup[];
  accent: string;
  variant: "hub" | "kategori";
  linkItems?: readonly MediaLinkItem[];
  plannedItems?: readonly string[];
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
  const showHubCards = variant === "hub" && !isFiltering;
  const showItems = variant === "kategori" || isFiltering;

  return (
    <>
      {showSearch ? (
        <div
          className={
            showItems
              ? "sticky top-16 z-30 -mx-4 mt-8 space-y-3 bg-[var(--portal-canvas,#f4f8fb)] px-4 py-3 sm:-mx-8 sm:px-8"
              : "mt-8 space-y-3"
          }
        >
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12.5rem] sm:items-end">
            <div>
              <label htmlFor="carian-media" className="label">
                Cari video / gambar
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
                  id="carian-media"
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
                <label htmlFor="bulan-media" className="label">
                  Bulan
                </label>
                <select
                  id="bulan-media"
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
          {showItems ? (
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
      ) : variant === "hub" ? (
        <div className="mt-8" />
      ) : null}

      {variant === "hub" && showSearch && !isFiltering ? (
        <p className="mt-2 text-sm text-graphite">
          Carian merangkumi koleksi video dan gambar. Tanpa kata kunci, ketik kad
          di bawah untuk buka kumpulan atau saluran.
        </p>
      ) : null}

      {variant === "kategori" && showSearch && !isFiltering && months.length > 1 ? (
        <p className="mt-2 text-sm text-graphite">
          Paparan bulan terkini yang ada bahan. Pilih bulan lain atau Semua
          bulan untuk arkib.
        </p>
      ) : null}

      {isFiltering ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-graphite">
          <span>
            {filtered.length} bahan sepadan
            {variant === "hub" ? " merentas koleksi" : ""}
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

      {showHubCards ? (
        <div className="mt-8 space-y-4">
          {groups.map((group) => {
            const n = group.cards.length;
            return (
              <AccentCard
                key={group.slug}
                href={mediaHref(group.slug)}
                accent={accent}
                className="flex items-start gap-4 p-5"
              >
                <span
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${accent}14`, color: accent }}
                  aria-hidden
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-7 w-7"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m10 9 6 3.5L10 16z" fill="currentColor" stroke="none" />
                  </svg>
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
                <HubArrow accent={accent} />
              </AccentCard>
            );
          })}
          {linkItems.map((item) => (
            <AccentCard
              key={item.href}
              href={item.href}
              accent={accent}
              external
              className="flex items-start gap-4 p-5"
            >
              <span
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${accent}14`, color: accent }}
                aria-hidden
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7"
                >
                  <path d="M10 14 21 3" />
                  <path d="M15 3h6v6" />
                  <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold text-ink">{item.label}</span>
                <span className="mt-1 block text-sm leading-relaxed text-graphite">
                  Buka saluran rasmi dalam tetingkap baharu.
                </span>
                <span className="status-badge mt-3 inline-block">Pautan luaran</span>
              </span>
              <HubArrow accent={accent} />
            </AccentCard>
          ))}
          {plannedItems.map((item) => (
            <div key={item} className="card flex items-center gap-4 p-5">
              <span
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fog text-graphite"
                aria-hidden
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4l3 2" />
                </svg>
              </span>
              <span className="min-w-0 flex-1 text-lg font-semibold text-ink">{item}</span>
              <span className="status-badge shrink-0">Akan datang</span>
            </div>
          ))}
        </div>
      ) : null}

      {showItems ? (
        filtered.length === 0 ? (
          <p className="mt-8 py-8 text-center text-sm text-graphite">
            {allCards.length === 0
              ? "Kandungan akan ditambah kemudian."
              : "Tiada bahan sepadan. Ubah kata carian atau bulan."}
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

function HubArrow({ accent }: { accent: string }) {
  return (
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
  );
}
