"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import DeleteButton from "@/components/admin/DeleteButton";
import ToggleAktifButton from "@/components/admin/ToggleAktifButton";
import CardEmbed from "@/components/kandungan/CardEmbed";
import {
  deleteResourcesCard,
  toggleResourcesAktif,
} from "@/lib/actions/resources";
import type { ResourcesSectionGroup } from "@/lib/resources/card-display";

/** Senarai accordion untuk pentadbir sahaja — halaman awam guna pautan ke subhalaman. */
export default function ResourcesKategoriSections({
  groups,
  defaultOpen,
  accent,
  admin = false,
}: {
  groups: ResourcesSectionGroup[];
  defaultOpen?: string;
  accent: string;
  admin?: boolean;
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(defaultOpen ?? null);

  return (
    <div className="mt-8 space-y-4">
      {groups.map((group) => {
        const open = openSlug === group.slug;
        const n = group.cards.length;
        const panelId = `resources-panel-${group.slug}`;
        const gallery = group.cards.map((item) => ({
          title: item.title,
          url: item.url,
          embed: item.embed,
        }));
        return (
          <div
            key={group.slug}
            id={`resources-${group.slug}`}
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
                    {n > 0 ? `${n} bahan` : admin ? "Tiada kad" : "Akan datang"}
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
                {admin ? (
                  <div className="mb-4 flex justify-end">
                    <Link
                      href={`/admin/resources/baharu?kategori=${group.slug}`}
                      className="btn-outline btn-sm"
                    >
                      Tambah Kad
                    </Link>
                  </div>
                ) : null}

                {n === 0 ? (
                  <p className="py-4 text-center text-sm text-graphite">
                    {admin
                      ? "Tiada kad untuk kategori ini. Tambah surat (fail atau pautan)."
                      : "Kandungan akan ditambah kemudian."}
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.cards.map((c, i) => (
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
                        {admin ? (
                          <div className="flex flex-wrap items-center gap-3 px-1">
                            <ToggleAktifButton
                              aktif={c.aktif}
                              action={toggleResourcesAktif.bind(null, c.id)}
                            />
                            <Link
                              href={`/admin/resources/${c.id}`}
                              className="link-blue text-sm"
                            >
                              Edit
                            </Link>
                            <DeleteButton
                              action={deleteResourcesCard.bind(null, c.id)}
                              confirmText={`Padam kad "${c.title}"?`}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
