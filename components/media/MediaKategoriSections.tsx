"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
}: {
  groups: MediaSectionGroup[];
  defaultOpen?: string;
  accent: string;
}) {
  const allCards = useMemo(
    () => groups.flatMap((group) => group.cards.map((card) => toAdminCard(group, card))),
    [groups],
  );
  const months = useMemo(() => listResourceMonthOptions(allCards), [allCards]);
  const latestMonth = months[0]?.value ?? "";
  const addKategori = defaultOpen ?? groups[0]?.slug ?? "koleksi";

  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(latestMonth);

  const isFiltering = Boolean(query.trim() || month !== latestMonth);
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
              onChange={(event) => {
                const next = event.target.value;
                setQuery(next);
                if (next.trim() && month === latestMonth) {
                  setMonth("");
                }
              }}
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

      {!isFiltering && months.length > 1 ? (
        <p className="text-sm text-graphite">
          Paparan bulan terkini yang ada bahan. Pilih bulan lain atau Semua
          bulan untuk arkib.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {isFiltering ? (
          <p className="text-sm text-graphite">{filtered.length} bahan sepadan</p>
        ) : (
          <p className="text-sm text-graphite">
            {filtered.length > 0
              ? `${filtered.length} bahan`
              : allCards.length === 0
                ? "Tiada kad"
                : "Tiada bahan pada bulan ini"}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {isFiltering ? (
            <button
              type="button"
              className="text-sm font-medium text-ink underline-offset-2 hover:underline"
              onClick={() => {
                setQuery("");
                setMonth(latestMonth);
              }}
            >
              Kembali ke bulan terkini
            </button>
          ) : null}
          <Link
            href={`/admin/media/baharu?kategori=${addKategori}`}
            className="btn-outline btn-sm"
          >
            Tambah Kad
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-graphite">
          {allCards.length === 0
            ? "Tiada kad. Tambah video atau gambar (fail atau pautan)."
            : "Tiada bahan sepadan. Ubah kata carian atau bulan."}
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
