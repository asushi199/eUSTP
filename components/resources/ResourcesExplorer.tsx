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
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");

  const allCards = useMemo(() => groups.flatMap((group) => group.cards), [groups]);
  const months = useMemo(() => listResourceMonthOptions(allCards), [allCards]);
  const filtered = useMemo(
    () => filterResourceCards(allCards, { query, month }),
    [allCards, query, month],
  );

  const isFiltering = Boolean(query.trim() || month);
  const showSearch = allCards.length > 0;
  const showKategoriCards = variant === "hub" && !isFiltering;
  const showLetters = variant === "kategori" || isFiltering;

  return (
    <>
      {showSearch ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12.5rem] sm:items-end">
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
                onChange={(event) => setQuery(event.target.value)}
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
      ) : null}

      {variant === "hub" && showSearch && !isFiltering ? (
        <p className="mt-2 text-sm text-graphite">
          Carian merangkumi semua kategori. Tanpa kata kunci, ketik kad di
          bawah untuk buka kumpulan.
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
              setMonth("");
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
                className="flex items-start justify-between gap-4 p-5"
              >
                <span className="min-w-0">
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
            {filtered.map((c) => (
              <CardEmbed
                key={c.id}
                title={c.title}
                blurb={variant === "hub" ? c.kategoriTitle : ""}
                url={c.url}
                typeLabel={c.typeLabel}
                embed={c.embed}
              />
            ))}
          </div>
        )
      ) : null}
    </>
  );
}
