"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import DeleteButton from "@/components/admin/DeleteButton";
import ToggleAktifButton from "@/components/admin/ToggleAktifButton";
import CardEmbed from "@/components/kandungan/CardEmbed";
import { deleteMediaCard, toggleMediaAktif } from "@/lib/actions/media";
import type { MediaSectionCard, MediaSectionGroup } from "@/lib/media/card-display";
import {
  filterResourceCards,
  listResourceMonthOptions,
  type ResourcesExplorerCard,
} from "@/lib/resources/search";

type AdminCard = ResourcesExplorerCard & { aktif: boolean };

function toAdminCard(group: MediaSectionGroup, card: MediaSectionCard): AdminCard {
  return {
    id: card.id,
    title: card.title,
    url: card.url,
    kategoriSlug: group.slug,
    kategoriTitle: group.title,
    createdAt: card.createdAt,
    letterMonth: card.letterMonth,
    typeLabel: card.typeLabel,
    embed: card.embed,
    aktif: card.aktif,
  };
}

export default function MediaKategoriSections({
  groups,
  defaultOpen,
  accent,
}: {
  groups: MediaSectionGroup[];
  defaultOpen?: string;
  accent: string;
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(defaultOpen ?? null);
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");

  const allCards = useMemo(
    () => groups.flatMap((group) => group.cards.map((card) => toAdminCard(group, card))),
    [groups],
  );
  const months = useMemo(() => listResourceMonthOptions(allCards), [allCards]);
  const isFiltering = Boolean(query.trim() || month);
  const filtered = useMemo(
    () => filterResourceCards(allCards, { query, month }),
    [allCards, query, month],
  );

  return (
    <div className="mt-8 space-y-4">
      {allCards.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12.5rem] sm:items-end">
          <div>
            <label htmlFor="carian-media-admin" className="label">
              Cari video / gambar
            </label>
            <input
              id="carian-media-admin"
              className="input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tajuk atau tahun"
              autoComplete="off"
            />
          </div>
          {months.length > 0 ? (
            <div>
              <label htmlFor="bulan-media-admin" className="label">
                Bulan
              </label>
              <select
                id="bulan-media-admin"
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

      {isFiltering ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-graphite">{filtered.length} bahan sepadan</p>
          <button
            type="button"
            className="text-sm font-medium text-ink underline-offset-2 hover:underline"
            onClick={() => {
              setQuery("");
              setMonth("");
            }}
          >
            Kosongkan tapisan
          </button>
        </div>
      ) : null}

      {isFiltering ? (
        filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-graphite">
            Tiada bahan sepadan. Ubah kata carian atau bulan.
          </p>
        ) : (
          <AdminCardGrid
            cards={filtered}
            gallery={filtered.map((item) => ({
              title: item.title,
              url: item.url,
              embed: item.embed,
            }))}
          />
        )
      ) : (
        groups.map((group) => {
          const open = openSlug === group.slug;
          const n = group.cards.length;
          const panelId = `media-panel-${group.slug}`;
          const adminCards = group.cards.map((card) => toAdminCard(group, card));
          const gallery = group.cards.map((item) => ({
            title: item.title,
            url: item.url,
            embed: item.embed,
          }));
          return (
            <div
              key={group.slug}
              id={`media-${group.slug}`}
              className="card-accent"
              style={{ "--card-accent": accent } as CSSProperties}
            >
              <h2 className="text-inherit">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="flex min-h-11 w-full cursor-pointer items-start justify-between gap-3 p-5 text-left"
                  onClick={() => setOpenSlug(open ? null : group.slug)}
                >
                  <span className="min-w-0">
                    <span className="block text-lg font-semibold text-ink">
                      {group.title}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-graphite">
                      {group.blurb}
                    </span>
                    <span className="status-badge mt-3 inline-block">
                      {n > 0 ? `${n} bahan` : "Tiada kad"}
                    </span>
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`mt-1 h-5 w-5 shrink-0 transition ${open ? "rotate-180" : ""}`}
                    style={{ stroke: accent }}
                    aria-hidden
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </h2>

              {open ? (
                <div
                  id={panelId}
                  className="border-t border-fog/70 bg-cloud/50 px-4 py-4 sm:px-5"
                >
                  <div className="mb-4 flex justify-end">
                    <Link
                      href={`/admin/media/baharu?kategori=${group.slug}`}
                      className="btn-outline btn-sm"
                    >
                      Tambah Kad
                    </Link>
                  </div>

                  {n === 0 ? (
                    <p className="py-4 text-center text-sm text-graphite">
                      Tiada kad untuk kategori ini. Tambah video atau gambar
                      (fail atau pautan).
                    </p>
                  ) : (
                    <AdminCardGrid cards={adminCards} gallery={gallery} />
                  )}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}

function AdminCardGrid({
  cards,
  gallery,
}: {
  cards: AdminCard[];
  gallery: Array<{ title: string; url: string; embed: AdminCard["embed"] }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c, i) => (
        <div key={c.id} className="space-y-2">
          <CardEmbed
            title={c.title}
            blurb=""
            url={c.url}
            typeLabel={c.typeLabel}
            embed={c.embed}
            gallery={gallery}
            galleryIndex={i}
          />
          <div className="flex flex-wrap items-center gap-3 px-1">
            <ToggleAktifButton
              aktif={c.aktif}
              action={toggleMediaAktif.bind(null, c.id)}
            />
            <Link href={`/admin/media/${c.id}`} className="link-blue text-sm">
              Edit
            </Link>
            <DeleteButton
              action={deleteMediaCard.bind(null, c.id)}
              confirmText={`Padam kad "${c.title}"?`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
