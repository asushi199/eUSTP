"use client";

import ActionForm from "@/components/admin/ActionForm";
import {
  addEquipmentUnit,
  importEquipmentUnits,
  saveEquipmentType,
  updateEquipmentManager,
  updateEquipmentUnitStatus,
} from "@/lib/actions/peralatan-admin";
import { EQUIPMENT_UNIT_STATUS_LABEL } from "@/lib/peralatan/status";
import type {
  EquipmentPkg,
  EquipmentUnitListItem,
} from "@/lib/peralatan/types";

type TypeOption = { id: string; code: string; name: string };

export default function EquipmentAdminForms({
  pkg,
  types,
  units,
}: {
  pkg: EquipmentPkg;
  types: TypeOption[];
  units: EquipmentUnitListItem[];
}) {
  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Daftar inventori</h2>
            <p className="mt-1 text-sm text-graphite">
              Stok dikira secara automatik daripada unit fizikal di bawah.
            </p>
          </div>
          <span className="text-sm font-semibold text-charcoal">
            {units.length} unit
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ActionForm
            action={addEquipmentUnit.bind(null, pkg.id)}
            submitLabel="Tambah unit"
            className="card space-y-4 p-5"
          >
            <div>
              <p className="font-semibold text-ink">Tambah unit fizikal</p>
              <p className="mt-1 text-xs text-graphite">
                Nombor siri peralatan wajib; nombor aset kerajaan boleh ditambah kemudian.
              </p>
            </div>
            <div>
              <label className="label" htmlFor="unit-type">
                Jenis peralatan *
              </label>
              <select
                id="unit-type"
                name="equipmentTypeId"
                className="input"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Pilih jenis
                </option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.code} — {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="unit-serial">
                  No. siri peralatan *
                </label>
                <input id="unit-serial" name="serialNo" className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="unit-asset">
                  No. aset kerajaan
                </label>
                <input id="unit-asset" name="governmentAssetNo" className="input" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="unit-notes">
                Catatan
              </label>
              <input id="unit-notes" name="notes" className="input" />
            </div>
          </ActionForm>

          <ActionForm
            action={importEquipmentUnits.bind(null, pkg.id)}
            submitLabel="Import unit"
            className="card space-y-4 p-5"
          >
            <div>
              <p className="font-semibold text-ink">Import Excel / CSV</p>
              <p className="mt-1 text-xs leading-relaxed text-graphite">
                Lajur wajib: <code>kod_peralatan</code> dan{" "}
                <code>no_siri_peralatan</code>. Lajur pilihan:{" "}
                <code>no_siri_aset_kerajaan</code> dan <code>catatan</code>.
              </p>
              <a
                href="/templates/import-peralatan.csv"
                download
                className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
              >
                Muat turun templat CSV
              </a>
            </div>
            <div>
              <label className="label" htmlFor="unit-file">
                Fail inventori *
              </label>
              <input
                id="unit-file"
                name="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="input py-2"
                required
              />
            </div>
            <p className="rounded-lg bg-cloud p-3 text-xs leading-relaxed text-graphite">
              Maksimum 1,000 unit bagi setiap import. Semua unit dalam fail akan
              didaftarkan kepada {pkg.name}.
            </p>
          </ActionForm>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-fog px-5 py-4">
          <h2 className="font-semibold text-ink">Senarai unit</h2>
          <p className="mt-1 text-sm text-graphite">
            Unit ditempah atau dipinjam hanya boleh berubah melalui aliran pinjaman.
          </p>
        </div>
        {units.length === 0 ? (
          <div className="p-6 text-sm text-graphite">
            Belum ada unit fizikal didaftarkan untuk {pkg.name}.
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
                  <p className="mt-2 font-mono text-sm text-charcoal">{unit.serialNo}</p>
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
                    action={updateEquipmentUnitStatus.bind(null, pkg.id, unit.id)}
                    submitLabel="Kemaskini"
                    className="flex items-center gap-2 self-center"
                  >
                    <select name="status" className="input h-10 py-1 text-sm" defaultValue={unit.status}>
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
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ActionForm
          action={saveEquipmentType.bind(null, pkg.id)}
          submitLabel="Tambah jenis"
          className="card space-y-4 p-5"
        >
          <div>
            <p className="font-semibold text-ink">Tambah jenis peralatan</p>
            <p className="mt-1 text-xs text-graphite">
              Jenis baharu akan tersedia kepada semua PKG; unit masih didaftarkan
              mengikut PKG.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
            <div>
              <label className="label" htmlFor="type-code">
                Kod *
              </label>
              <input id="type-code" name="code" className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="type-name">
                Nama peralatan *
              </label>
              <input id="type-name" name="name" className="input" required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="type-model">
              Model
            </label>
            <input id="type-model" name="model" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="type-description">
              Penerangan
            </label>
            <textarea
              id="type-description"
              name="description"
              className="textarea min-h-20"
            />
          </div>
          <div>
            <label className="label" htmlFor="type-aliases">
              Alias carian tersembunyi
            </label>
            <input
              id="type-aliases"
              name="searchAliases"
              className="input"
              placeholder="Contoh: laptop, notebook, computer"
            />
          </div>
        </ActionForm>

        <ActionForm
          action={updateEquipmentManager.bind(null, pkg.id)}
          submitLabel="Simpan pegawai"
          submitClassName="btn-primary w-full sm:w-auto"
          className="card space-y-4 p-5"
        >
          <div>
            <p className="font-semibold text-ink">Pegawai bertanggungjawab</p>
            <p className="mt-1 text-xs text-graphite">
              Digunakan untuk pautan WhatsApp selepas pemohon menghantar permohonan.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="manager-name">
              Nama *
            </label>
            <input
              id="manager-name"
              name="name"
              className="input"
              defaultValue={pkg.managerName}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="manager-position">
              Jawatan *
            </label>
            <input
              id="manager-position"
              name="position"
              className="input"
              defaultValue={pkg.managerPosition}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="manager-phone">
              Nombor WhatsApp *
            </label>
            <input
              id="manager-phone"
              name="phone"
              className="input"
              defaultValue={pkg.managerPhone}
              placeholder="Contoh: 0123456789"
              required
            />
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
