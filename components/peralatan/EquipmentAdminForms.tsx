"use client";

import ActionForm from "@/components/admin/ActionForm";
import {
  addEquipmentUnit,
  importEquipmentUnits,
  saveEquipmentType,
  updateEquipmentManager,
} from "@/lib/actions/peralatan-admin";
import { EQUIPMENT_ADMIN_SUBMIT_CLASS } from "@/lib/peralatan/admin-button-style";
import type { EquipmentPkg } from "@/lib/peralatan/types";

type TypeOption = { id: string; code: string; name: string };

export default function EquipmentAdminForms({
  pkg,
  types,
}: {
  pkg: EquipmentPkg;
  types: TypeOption[];
}) {
  return (
    <div className="space-y-8">
      <section>
        <div>
          <h2 className="text-lg font-semibold text-ink">Daftar inventori</h2>
          <p className="mt-1 text-sm text-graphite">
            Stok dikira secara automatik daripada rekod unit fizikal.
          </p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ActionForm
            action={addEquipmentUnit.bind(null, pkg.id)}
            submitLabel="Tambah unit"
            submitClassName={EQUIPMENT_ADMIN_SUBMIT_CLASS.addUnit}
            className="card space-y-4 p-5"
          >
            <div>
              <p className="font-semibold text-ink">Tambah unit fizikal</p>
              <p className="mt-1 text-xs text-graphite">
                Nombor siri peralatan wajib; nombor aset kerajaan boleh ditambah
                kemudian.
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
            submitClassName={EQUIPMENT_ADMIN_SUBMIT_CLASS.importUnits}
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
                className="btn-outline btn-sm mt-3"
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

      <section className="grid gap-4 lg:grid-cols-2">
        <ActionForm
          action={saveEquipmentType.bind(null, pkg.id)}
          submitLabel="Tambah jenis"
          submitClassName={EQUIPMENT_ADMIN_SUBMIT_CLASS.addType}
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
          submitClassName={EQUIPMENT_ADMIN_SUBMIT_CLASS.saveManager}
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
