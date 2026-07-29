"use client";

import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import { updateEquipmentUnitStatus } from "@/lib/actions/peralatan-admin";
import { EQUIPMENT_ADMIN_SUBMIT_CLASS } from "@/lib/peralatan/admin-button-style";
import { EQUIPMENT_UNIT_STATUS_LABEL } from "@/lib/peralatan/status";
import type {
  EquipmentUnitListItem,
  EquipmentUnitStatus,
} from "@/lib/peralatan/types";

type TypeOption = { id: string; code: string; name: string };

export default function EquipmentUnitList({
  pkgId,
  pkgName,
  types,
  units,
  totalUnits,
  page,
  perPage,
  filters,
}: {
  pkgId: string;
  pkgName: string;
  types: TypeOption[];
  units: EquipmentUnitListItem[];
  totalUnits: number;
  page: number;
  perPage: number;
  filters: {
    search: string;
    status: string;
    equipmentTypeId: string;
  };
}) {
  const totalPages = Math.max(1, Math.ceil(totalUnits / perPage));

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (filters.search) params.set("cari", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.equipmentTypeId) params.set("jenis", filters.equipmentTypeId);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return `/admin/peralatan/${pkgId}/unit/senarai${query ? `?${query}` : ""}`;
  }

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-fog px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-ink">Senarai unit</h2>
            <p className="mt-1 text-sm text-graphite">
              Unit ditempah atau dipinjam hanya boleh berubah melalui aliran
              pinjaman.
            </p>
          </div>
          <span className="text-sm font-semibold tabular-nums text-charcoal">
            {units.length.toLocaleString("ms-MY")} daripada{" "}
            {totalUnits.toLocaleString("ms-MY")}
          </span>
        </div>
        <form
          method="get"
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_190px_220px_auto]"
        >
          <div>
            <label className="label" htmlFor="unit-search">
              Cari unit
            </label>
            <input
              id="unit-search"
              name="cari"
              className="input"
              defaultValue={filters.search}
              placeholder="No. siri, aset atau nama"
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
          <div>
            <label className="label" htmlFor="unit-filter-type">
              Jenis peralatan
            </label>
            <select
              id="unit-filter-type"
              name="jenis"
              className="input"
              defaultValue={filters.equipmentTypeId}
            >
              <option value="">Semua jenis</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.code} — {type.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-ink btn-sm">
              Tapis
            </button>
            <Link
              href={`/admin/peralatan/${pkgId}/unit/senarai`}
              className="btn-outline-ink btn-sm"
            >
              Set semula
            </Link>
          </div>
        </form>
      </div>

      {units.length === 0 ? (
        <div className="p-6 text-sm text-graphite">
          Tiada unit sepadan dengan tapisan ini. Ubah tapisan atau daftar unit
          baharu untuk {pkgName}.
        </div>
      ) : (
        <div className="divide-y divide-fog">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_180px]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-cloud px-2 py-1 font-mono text-xs font-bold">
                    {unit.typeCode}
                  </span>
                  <p className="font-medium text-ink">{unit.typeName}</p>
                </div>
                <p className="mt-2 font-mono text-sm text-charcoal">
                  {unit.serialNo}
                </p>
                <p className="mt-1 text-xs text-graphite">
                  Aset kerajaan: {unit.governmentAssetNo || "belum diterima"}
                  {unit.notes ? ` · ${unit.notes}` : ""}
                </p>
              </div>
              {unit.status === "reserved" || unit.status === "borrowed" ? (
                <span className="status-badge self-center justify-self-start md:justify-self-end">
                  <span className="status-dot bg-primary" />
                  {EQUIPMENT_UNIT_STATUS_LABEL[unit.status]}
                </span>
              ) : (
                <ActionForm
                  action={updateEquipmentUnitStatus.bind(null, pkgId, unit.id)}
                  submitLabel="Kemaskini"
                  submitClassName={EQUIPMENT_ADMIN_SUBMIT_CLASS.updateStatus}
                  className="flex items-center gap-2 self-center"
                >
                  <select
                    name="status"
                    className="input h-10 py-1 text-sm"
                    defaultValue={unit.status}
                  >
                    <option value="available">Tersedia</option>
                    <option value="maintenance">Penyelenggaraan</option>
                    <option value="retired">Dilupuskan</option>
                    <option value="lost">Hilang</option>
                  </select>
                </ActionForm>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          className="flex items-center justify-between border-t border-fog px-5 py-4 text-sm"
          aria-label="Muka surat senarai unit"
        >
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="btn-outline-ink btn-sm">
              Sebelum
            </Link>
          ) : (
            <span />
          )}
          <span className="text-graphite">
            Muka {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="btn-outline-ink btn-sm">
              Seterusnya
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </section>
  );
}
