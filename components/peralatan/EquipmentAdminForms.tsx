"use client";

import { useState } from "react";
import ActionForm from "@/components/admin/ActionForm";
import {
  addEquipmentUnit,
  importEquipmentUnits,
  saveEquipmentCategory,
  saveEquipmentType,
  updateEquipmentType,
  updateEquipmentManager,
} from "@/lib/actions/peralatan-admin";
import { EQUIPMENT_ADMIN_SUBMIT_CLASS } from "@/lib/peralatan/admin-button-style";
import type {
  EquipmentCategoryOption,
  EquipmentPkg,
  EquipmentTypeAdminDetail,
} from "@/lib/peralatan/types";

type TypeOption = { id: string; categoryId: string; code: string; name: string };

function AddEquipmentModelForm({
  pkgId,
  categories,
}: {
  pkgId: string;
  categories: EquipmentCategoryOption[];
}) {
  const activeCategories = categories.filter((category) => category.active);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchAliases, setSearchAliases] = useState("");

  function onCategoryChange(nextId: string) {
    setCategoryId(nextId);
    const category = activeCategories.find((item) => item.id === nextId);
    if (!category) return;
    setName(category.name);
    setDescription(category.description);
    setSearchAliases(category.searchAliases.join(", "));
  }

  return (
    <ActionForm
      action={saveEquipmentType.bind(null, pkgId)}
      submitLabel="Tambah model"
      submitClassName={EQUIPMENT_ADMIN_SUBMIT_CLASS.addType}
      className="card space-y-4 p-5"
    >
      <div>
        <p className="font-semibold text-ink">Tambah model / kumpulan aset</p>
        <p className="mt-1 text-xs text-graphite">
          Pilih kategori dahulu — nama dan penerangan diisi automatik. Isi kod
          aset/stok sendiri (bukan kod kategori).
        </p>
      </div>
      <div>
        <label className="label" htmlFor="type-category">
          Kategori *
        </label>
        <select
          id="type-category"
          name="categoryId"
          className="input"
          required
          value={categoryId}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="" disabled>
            Pilih kategori
          </option>
          {activeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} ({category.code})
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div>
          <label className="label" htmlFor="type-code">
            Kod aset / stok *
          </label>
          <input
            id="type-code"
            name="code"
            className="input"
            required
            placeholder="Contoh: OBS01"
          />
        </div>
        <div>
          <label className="label" htmlFor="type-name">
            Nama peralatan *
          </label>
          <input
            id="type-name"
            name="name"
            className="input"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="type-model">
          Jenama / model
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
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="type-specifications">
          Spesifikasi
        </label>
        <textarea
          id="type-specifications"
          name="specifications"
          className="textarea min-h-28"
          placeholder="Satu spesifikasi bagi setiap baris"
        />
      </div>
      <div>
        <label className="label" htmlFor="type-components">
          Kandungan set
        </label>
        <textarea
          id="type-components"
          name="components"
          className="textarea min-h-28"
          placeholder="Satu komponen bagi setiap baris"
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
          value={searchAliases}
          onChange={(event) => setSearchAliases(event.target.value)}
        />
      </div>
    </ActionForm>
  );
}

export default function EquipmentAdminForms({
  pkg,
  types,
  categories,
  typeDetails,
  canManageMetadata,
}: {
  pkg: EquipmentPkg;
  types: TypeOption[];
  categories: EquipmentCategoryOption[];
  typeDetails: EquipmentTypeAdminDetail[];
  canManageMetadata: boolean;
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
        {canManageMetadata ? (
          <ActionForm
            action={saveEquipmentCategory.bind(null, pkg.id)}
            submitLabel="Tambah kategori"
            submitClassName={EQUIPMENT_ADMIN_SUBMIT_CLASS.addType}
            className="card space-y-4 p-5"
          >
            <div>
              <p className="font-semibold text-ink">Tambah kategori permohonan</p>
              <p className="mt-1 text-xs text-graphite">
                Langkah 1: buat kategori katalog. Pemohon pilih kategori ini;
                model/aset ditambah di borang sebelah.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
              <div>
                <label className="label" htmlFor="category-code">
                  Kod kategori *
                </label>
                <input
                  id="category-code"
                  name="code"
                  className="input"
                  required
                  placeholder="Contoh: OBS-BOT"
                />
                <p className="mt-1 text-[11px] leading-snug text-graphite">
                  Bukan kod aset/stok.
                </p>
              </div>
              <div>
                <label className="label" htmlFor="category-name">
                  Nama kategori *
                </label>
                <input id="category-name" name="name" className="input" required />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="category-description">
                Penerangan umum
              </label>
              <textarea
                id="category-description"
                name="description"
                className="textarea min-h-20"
              />
            </div>
            <div>
              <label className="label" htmlFor="category-aliases">
                Alias carian tersembunyi
              </label>
              <input
                id="category-aliases"
                name="searchAliases"
                className="input"
                placeholder="Contoh: laptop, notebook"
              />
            </div>
          </ActionForm>
        ) : null}

        {canManageMetadata ? (
          <AddEquipmentModelForm pkgId={pkg.id} categories={categories} />
        ) : null}

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

      {canManageMetadata ? (
        <section>
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Maklumat kategori dan model
            </h2>
            <p className="mt-1 text-sm text-graphite">
              Perubahan diterbitkan pada katalog awam. Rekod tidak dipadamkan;
              nyahaktifkan kategori atau model yang tidak lagi digunakan.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {categories.map((category) => (
              <details key={category.id} className="card overflow-hidden">
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-ink">
                  {category.name}
                  <span className="ml-2 font-mono text-xs text-graphite">
                    {category.code}
                  </span>
                </summary>
                <div className="space-y-4 border-t border-fog p-5">
                  <ActionForm
                    action={saveEquipmentCategory.bind(null, pkg.id)}
                    submitLabel="Simpan kategori"
                    submitClassName={EQUIPMENT_ADMIN_SUBMIT_CLASS.saveManager}
                    className="grid gap-4 lg:grid-cols-2"
                  >
                    <input type="hidden" name="categoryId" value={category.id} />
                    <div>
                      <label className="label">Kod kategori (bukan kod aset)</label>
                      <input
                        name="code"
                        className="input"
                        defaultValue={category.code}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Nama kategori</label>
                      <input
                        name="name"
                        className="input"
                        defaultValue={category.name}
                        required
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="label">Penerangan umum</label>
                      <textarea
                        name="description"
                        className="textarea min-h-20"
                        defaultValue={category.description}
                      />
                    </div>
                    <div>
                      <label className="label">Alias carian</label>
                      <input
                        name="searchAliases"
                        className="input"
                        defaultValue={category.searchAliases.join(", ")}
                      />
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <select
                        name="active"
                        className="input"
                        defaultValue={category.active ? "yes" : "no"}
                      >
                        <option value="yes">Aktif</option>
                        <option value="no">Tidak aktif</option>
                      </select>
                    </div>
                  </ActionForm>

                  <div className="space-y-3">
                    {typeDetails
                      .filter((type) => type.categoryId === category.id)
                      .map((type) => (
                        <details
                          key={type.id}
                          className="rounded-lg border border-fog"
                        >
                          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-charcoal">
                            {type.model || type.name}
                            <span className="ml-2 font-mono text-xs font-normal text-graphite">
                              {type.code}
                            </span>
                          </summary>
                          <ActionForm
                            action={updateEquipmentType.bind(
                              null,
                              pkg.id,
                              type.id,
                            )}
                            submitLabel="Simpan model"
                            submitClassName={EQUIPMENT_ADMIN_SUBMIT_CLASS.saveManager}
                            className="grid gap-4 border-t border-fog p-4 lg:grid-cols-2"
                          >
                            <div>
                              <label className="label">Kategori</label>
                              <select
                                name="categoryId"
                                className="input"
                                defaultValue={type.categoryId}
                              >
                                {categories.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="label">Kod aset / stok</label>
                              <input
                                name="code"
                                className="input"
                                defaultValue={type.code}
                                required
                              />
                            </div>
                            <div>
                              <label className="label">Nama aset</label>
                              <input
                                name="name"
                                className="input"
                                defaultValue={type.name}
                                required
                              />
                            </div>
                            <div>
                              <label className="label">Jenama / model</label>
                              <input
                                name="model"
                                className="input"
                                defaultValue={type.model}
                              />
                            </div>
                            <div className="lg:col-span-2">
                              <label className="label">Penerangan</label>
                              <textarea
                                name="description"
                                className="textarea min-h-20"
                                defaultValue={type.description}
                              />
                            </div>
                            <div>
                              <label className="label">
                                Spesifikasi — satu setiap baris
                              </label>
                              <textarea
                                name="specifications"
                                className="textarea min-h-36"
                                defaultValue={type.specifications.join("\n")}
                              />
                            </div>
                            <div>
                              <label className="label">
                                Kandungan — satu setiap baris
                              </label>
                              <textarea
                                name="components"
                                className="textarea min-h-36"
                                defaultValue={type.components.join("\n")}
                              />
                            </div>
                            <div>
                              <label className="label">Alias carian</label>
                              <input
                                name="searchAliases"
                                className="input"
                                defaultValue={type.searchAliases.join(", ")}
                              />
                            </div>
                            <div>
                              <label className="label">Status</label>
                              <select
                                name="active"
                                className="input"
                                defaultValue={type.active ? "yes" : "no"}
                              >
                                <option value="yes">Aktif</option>
                                <option value="no">Tidak aktif</option>
                              </select>
                            </div>
                          </ActionForm>
                        </details>
                      ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
