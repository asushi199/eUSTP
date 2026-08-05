"use client";

import Link from "next/link";
import { useState } from "react";
import ActionForm from "@/components/admin/ActionForm";
import {
  transferEquipmentUnits,
  updateEquipmentUnit,
  updateEquipmentUnitStatus,
} from "@/lib/actions/peralatan-admin";
import { EQUIPMENT_ADMIN_SUBMIT_CLASS } from "@/lib/peralatan/admin-button-style";
import { EQUIPMENT_UNIT_STATUS_LABEL } from "@/lib/peralatan/status";
import type {
  EquipmentInventoryCard,
  EquipmentPkg,
  EquipmentUnitListItem,
  EquipmentUnitStatus,
} from "@/lib/peralatan/types";

export default function EquipmentUnitList({
  pkgId,
  pkgName,
  pkgs,
  inventoryCards,
  selectedTypeId,
  units,
  totalUnits,
  page,
  perPage,
  canTransfer,
  filters,
}: {
  pkgId: string;
  pkgName: string;
  pkgs: EquipmentPkg[];
  inventoryCards: EquipmentInventoryCard[];
  selectedTypeId: string;
  units: EquipmentUnitListItem[];
  totalUnits: number;
  page: number;
  perPage: number;
  canTransfer: boolean;
  filters: {
    search: string;
    status: string;
  };
}) {
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const totalPages = Math.max(1, Math.ceil(totalUnits / perPage));

  function listHref(typeId: string, nextPage = 1) {
    const params = new URLSearchParams();
    params.set("jenis", typeId);
    if (filters.search) params.set("cari", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/admin/peralatan/${pkgId}/unit/senarai?${params.toString()}`;
  }

  function toggleUnit(unitId: string) {
    setSelectedUnitIds((current) =>
      current.includes(unitId)
        ? current.filter((id) => id !== unitId)
        : [...current, unitId],
    );
  }

  return (
    <div className="space-y-4">
      <section className="card px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-ink">Senarai unit</h2>
            <p className="mt-1 text-sm text-graphite">
              Pilih jenis aset, kemudian cari nombor siri atau tapis status.
            </p>
          </div>
          <span className="text-sm font-semibold tabular-nums text-charcoal">
            {inventoryCards
              .reduce((sum, card) => sum + card.totalUnits, 0)
              .toLocaleString("ms-MY")}{" "}
            unit
          </span>
        </div>
        <form
          method="get"
          className="mt-4 grid gap-3 sm:grid-cols-[minmax(220px,1fr)_190px_auto]"
        >
          <input type="hidden" name="jenis" value={selectedTypeId} />
          <div>
            <label className="label" htmlFor="unit-search">
              Cari unit
            </label>
            <input
              id="unit-search"
              name="cari"
              className="input"
              defaultValue={filters.search}
              placeholder="No. siri, kod aset atau nama"
            />
          </div>
          <div>
            <label className="label" htmlFor="unit-status">
              Status
            </label>
            <select
              id="unit-status"
              name="status"
              className="input"
              defaultValue={filters.status}
            >
              <option value="">Semua status</option>
              {(
                Object.entries(EQUIPMENT_UNIT_STATUS_LABEL) as Array<
                  [EquipmentUnitStatus, string]
                >
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-ink btn-sm">
              Tapis
            </button>
            <Link
              href={`/admin/peralatan/${pkgId}/unit/senarai?jenis=${selectedTypeId}`}
              className="btn-outline-ink btn-sm"
            >
              Set semula
            </Link>
          </div>
        </form>
      </section>

      {inventoryCards.map((card) => {
        const isSelected = card.id === selectedTypeId;
        return (
          <article
            key={card.id}
            className={`card overflow-hidden ${
              isSelected ? "ring-1 ring-ink/15" : ""
            }`}
          >
            <div className="border-b border-fog px-5 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-cloud px-2 py-1 font-mono text-xs font-bold text-charcoal">
                      {card.code}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
                      Kod aset / stok
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-snug text-ink">
                    {card.name}
                  </h3>
                  {card.model ? (
                    <p className="mt-1 text-sm text-graphite">{card.model}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-5 border-t border-fog pt-3 sm:border-0 sm:pt-0 sm:text-right">
                  <div>
                    <p className="text-xl font-semibold tabular-nums text-ink">
                      {card.totalUnits.toLocaleString("ms-MY")}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-graphite">
                      jumlah
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold tabular-nums text-primary">
                      {card.availableUnits.toLocaleString("ms-MY")}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-graphite">
                      tersedia
                    </p>
                  </div>
                </div>
              </div>

              {card.description ||
              card.specifications.length > 0 ||
              card.components.length > 0 ? (
                <details className="group mt-4 border-t border-fog pt-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20">
                    Spesifikasi dan kandungan
                    <span
                      aria-hidden
                      className="text-lg leading-none transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <div className="mt-4 grid gap-5 text-sm leading-relaxed text-graphite lg:grid-cols-2">
                    <div>
                      {card.description ? <p>{card.description}</p> : null}
                      {card.specifications.length > 0 ? (
                        <>
                          <p className="mt-4 font-semibold text-charcoal">
                            Spesifikasi
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {card.specifications.map((item) => (
                              <li key={item} className="flex gap-2">
                                <span aria-hidden className="text-steel">
                                  —
                                </span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </div>
                    {card.components.length > 0 ? (
                      <div>
                        <p className="font-semibold text-charcoal">
                          Kandungan
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {card.components.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span aria-hidden className="text-steel">
                                —
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </details>
              ) : null}
            </div>

            {!isSelected ? (
              <div className="px-5 py-4">
                <Link href={listHref(card.id)} className="btn-outline-ink btn-sm">
                  Lihat {card.totalUnits.toLocaleString("ms-MY")} unit
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 bg-cloud/55 px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-charcoal">
                      Unit di bawah {pkgName}
                    </p>
                    <p className="mt-0.5 text-xs text-graphite">
                      {units.length.toLocaleString("ms-MY")} daripada{" "}
                      {totalUnits.toLocaleString("ms-MY")} dipaparkan
                    </p>
                  </div>
                  {canTransfer && selectedUnitIds.length > 0 ? (
                    <ActionForm
                      action={transferEquipmentUnits.bind(null, pkgId)}
                      submitLabel={`Pindahkan ${selectedUnitIds.length} unit`}
                      submitClassName="btn-ink btn-sm"
                      className="flex flex-wrap items-end gap-2"
                    >
                      {selectedUnitIds.map((unitId) => (
                        <input
                          key={unitId}
                          type="hidden"
                          name="unitIds"
                          value={unitId}
                        />
                      ))}
                      <div>
                        <label
                          className="sr-only"
                          htmlFor={`destination-${card.id}`}
                        >
                          PKG baharu
                        </label>
                        <select
                          id={`destination-${card.id}`}
                          name="destinationPkgId"
                          className="input h-10 min-w-44 py-1 text-sm"
                          defaultValue=""
                          required
                        >
                          <option value="" disabled>
                            Pilih PKG baharu
                          </option>
                          {pkgs
                            .filter((pkg) => pkg.id !== pkgId)
                            .map((pkg) => (
                              <option key={pkg.id} value={pkg.id}>
                                {pkg.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </ActionForm>
                  ) : null}
                </div>

                {units.length === 0 ? (
                  <div className="p-6 text-sm text-graphite">
                    Tiada unit sepadan dengan carian atau status ini.
                  </div>
                ) : (
                  <div className="divide-y divide-fog">
                    {units.map((unit) => {
                      const selectable = canTransfer && unit.status === "available";
                      const locked =
                        unit.status === "reserved" || unit.status === "borrowed";
                      return (
                        <div key={unit.id} className="px-5 py-4">
                          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_264px]">
                            <div className="flex min-w-0 items-start gap-3">
                              {selectable ? (
                                <input
                                  type="checkbox"
                                  checked={selectedUnitIds.includes(unit.id)}
                                  onChange={() => toggleUnit(unit.id)}
                                  aria-label={`Pilih unit ${unit.serialNo}`}
                                  className="mt-1 h-4 w-4 rounded border-steel accent-ink"
                                />
                              ) : (
                                <span className="w-4 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="font-mono text-sm font-semibold text-charcoal">
                                  {unit.serialNo}
                                </p>
                                <p className="mt-1 text-xs text-graphite">
                                  No. aset kerajaan:{" "}
                                  {unit.governmentAssetNo || "belum diterima"}
                                  {unit.notes ? ` · ${unit.notes}` : ""}
                                </p>
                              </div>
                            </div>
                            {locked ? (
                              <span className="status-badge self-center justify-self-start md:justify-self-end">
                                <span className="status-dot bg-primary" />
                                {EQUIPMENT_UNIT_STATUS_LABEL[unit.status]}
                              </span>
                            ) : (
                              <ActionForm
                                action={updateEquipmentUnitStatus.bind(
                                  null,
                                  pkgId,
                                  unit.id,
                                )}
                                submitLabel="Kemaskini"
                                submitClassName={
                                  EQUIPMENT_ADMIN_SUBMIT_CLASS.updateStatus
                                }
                                className="flex items-center gap-2 self-center md:justify-self-end"
                              >
                                <select
                                  name="status"
                                  className="input h-10 w-36 shrink-0 py-1 text-sm"
                                  defaultValue={unit.status}
                                >
                                  <option value="available">Tersedia</option>
                                  <option value="maintenance">
                                    Penyelenggaraan
                                  </option>
                                  <option value="retired">Dilupuskan</option>
                                  <option value="lost">Hilang</option>
                                </select>
                              </ActionForm>
                            )}
                          </div>
                          {!locked ? (
                            <details className="group mt-3 border-t border-fog pt-3">
                              <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.08em] text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20">
                                <span className="inline-flex items-center gap-1.5">
                                  Kemaskini maklumat
                                  <span
                                    aria-hidden
                                    className="text-sm leading-none transition-transform group-open:rotate-45"
                                  >
                                    +
                                  </span>
                                </span>
                              </summary>
                              <ActionForm
                                action={updateEquipmentUnit.bind(
                                  null,
                                  pkgId,
                                  unit.id,
                                )}
                                submitLabel="Simpan maklumat"
                                submitClassName={
                                  EQUIPMENT_ADMIN_SUBMIT_CLASS.updateUnit
                                }
                                className="mt-3 grid gap-3 sm:grid-cols-2"
                              >
                                <div>
                                  <label
                                    className="label"
                                    htmlFor={`unit-serial-${unit.id}`}
                                  >
                                    No. siri peralatan *
                                  </label>
                                  <input
                                    id={`unit-serial-${unit.id}`}
                                    name="serialNo"
                                    className="input font-mono text-sm"
                                    defaultValue={unit.serialNo}
                                    required
                                  />
                                </div>
                                <div>
                                  <label
                                    className="label"
                                    htmlFor={`unit-asset-${unit.id}`}
                                  >
                                    No. aset kerajaan
                                  </label>
                                  <input
                                    id={`unit-asset-${unit.id}`}
                                    name="governmentAssetNo"
                                    className="input font-mono text-sm"
                                    defaultValue={unit.governmentAssetNo}
                                    placeholder="Kosongkan jika belum diterima"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label
                                    className="label"
                                    htmlFor={`unit-notes-${unit.id}`}
                                  >
                                    Catatan
                                  </label>
                                  <input
                                    id={`unit-notes-${unit.id}`}
                                    name="notes"
                                    className="input text-sm"
                                    defaultValue={unit.notes}
                                  />
                                </div>
                              </ActionForm>
                            </details>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}

                {totalPages > 1 ? (
                  <nav
                    className="flex items-center justify-between border-t border-fog px-5 py-4 text-sm"
                    aria-label="Muka surat senarai unit"
                  >
                    {page > 1 ? (
                      <Link
                        href={listHref(card.id, page - 1)}
                        className="btn-outline-ink btn-sm"
                      >
                        Sebelum
                      </Link>
                    ) : (
                      <span />
                    )}
                    <span className="text-graphite">
                      Muka {page} / {totalPages}
                    </span>
                    {page < totalPages ? (
                      <Link
                        href={listHref(card.id, page + 1)}
                        className="btn-outline-ink btn-sm"
                      >
                        Seterusnya
                      </Link>
                    ) : (
                      <span />
                    )}
                  </nav>
                ) : null}
              </>
            )}
          </article>
        );
      })}
    </div>
  );
}
