"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AccentCard from "@/components/AccentCard";
import DeleteButton from "@/components/admin/DeleteButton";
import ToggleAktifButton from "@/components/admin/ToggleAktifButton";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import CardEmbed from "@/components/kandungan/CardEmbed";
import MonthNav from "@/components/month-nav/MonthNav";
import {
  deleteResourcesCard,
  toggleResourcesAktif,
} from "@/lib/actions/resources";
import type { ResourcesSectionCard, ResourcesSectionGroup } from "@/lib/resources/card-display";
import { isResourcesYearKategori, resourcesAdminHref } from "@/lib/resources/kategori";
import {
  filterResourceCards,
  listResourceMonthOptions,
  listResourceYearOptions,
  type ResourcesExplorerCard,
} from "@/lib/resources/search";

type AdminCard = ResourcesExplorerCard & { aktif: boolean };

function toAdminCard(group: ResourcesSectionGroup, card: ResourcesSectionCard): AdminCard {
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

/** Hab kategori + paparan bulan untuk pentadbir — sama corak halaman awam. */
export default function ResourcesKategoriSections({
  groups,
  selectedSlug,
  accent,
}: {
  groups: ResourcesSectionGroup[];
  selectedSlug?: string;
  accent: string;
}) {
  const selected = selectedSlug
    ? groups.find((group) => group.slug === selectedSlug)
    : undefined;

  if (!selected) {
    return (
      <div className="mt-8 space-y-4">
        {groups.map((group) => {
          const n = group.cards.length;
          return (
            <AccentCard
              key={group.slug}
              href={resourcesAdminHref(group.slug)}
              accent={accent}
              className="flex items-start gap-4 p-5"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold text-ink">{group.title}</span>
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
    );
  }

  return <AdminCategoryView group={selected} />;
}

function AdminCategoryView({ group }: { group: ResourcesSectionGroup }) {
  const allCards = useMemo(
    () => group.cards.map((card) => toAdminCard(group, card)),
    [group],
  );
  const yearGrain = isResourcesYearKategori(group.slug);
  const months = useMemo(
    () => (yearGrain ? listResourceYearOptions(allCards) : listResourceMonthOptions(allCards)),
    [allCards, yearGrain],
  );
  const latestMonth = months[0]?.value ?? "";
  const itemWord = yearGrain ? "bahan" : "surat";
  const periodWord = yearGrain ? "tahun" : "bulan";

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
        <div className="space-y-3">
          <div>
            <label htmlFor="carian-resources-admin" className="label">
              {yearGrain ? "Cari bahan" : "Cari surat"}
            </label>
            <input
              id="carian-resources-admin"
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
            <MonthNav
              value={month}
              onChange={setMonth}
              allowAll
              grain={yearGrain ? "year" : "month"}
              markedMonths={months.map((item) => item.value)}
            />
          ) : null}
        </div>
      ) : null}

      {!isFiltering && months.length > 1 ? (
        <p className="text-sm text-graphite">
          Paparan {periodWord} terkini yang ada {itemWord}. Guna anak panah
          atau ketik nama {periodWord} — atau pilih Semua {periodWord} untuk
          arkib.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {isFiltering ? (
          <p className="text-sm text-graphite">{filtered.length} {itemWord} sepadan</p>
        ) : (
          <p className="text-sm text-graphite">
            {filtered.length > 0
              ? `${filtered.length} ${itemWord}`
              : allCards.length === 0
                ? "Tiada kad"
                : `Tiada ${itemWord} pada ${periodWord} ini`}
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
              {yearGrain ? "Kembali ke tahun terkini" : "Kembali ke bulan terkini"}
            </button>
          ) : null}
          <Link
            href={`/admin/resources/baharu?kategori=${group.slug}`}
            className="btn-outline btn-sm"
          >
            Tambah Kad
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-graphite">
          {allCards.length === 0
            ? `Tiada kad untuk kategori ini. Tambah ${itemWord} (fail atau pautan).`
            : `Tiada ${itemWord} sepadan. Ubah kata carian atau ${periodWord}.`}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <div key={c.id} className="space-y-2">
              <CardEmbed
                title={c.title}
                blurb=""
                url={c.url}
                typeLabel={c.typeLabel}
                embed={c.embed}
                gallery={filtered.map((item) => ({
                  title: item.title,
                  url: item.url,
                  embed: item.embed,
                }))}
                galleryIndex={i}
              />
              <div className="flex flex-wrap items-center gap-3 px-1">
                <ToggleAktifButton
                  aktif={c.aktif}
                  action={toggleResourcesAktif.bind(null, c.id)}
                />
                <Link href={`/admin/resources/${c.id}`} className="link-blue text-sm">
                  Edit
                </Link>
                <Link
                  href={`/admin/direktori/sekolah?surat=${c.id}`}
                  className="link-blue inline-flex items-center gap-1 text-sm"
                  title="Kongsi surat ini melalui siaran WhatsApp"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  WhatsApp
                </Link>
                <DeleteButton
                  action={deleteResourcesCard.bind(null, c.id)}
                  confirmText={`Padam kad "${c.title}"?`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
