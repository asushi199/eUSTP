"use client";

import { useActionState, useMemo, useState } from "react";
import PhoneInput from "@/components/PhoneInput";
import {
  createEquipmentLoanAction,
  type EquipmentApplicationState,
} from "@/lib/actions/peralatan";
import type {
  EquipmentCatalogItem,
  EquipmentPkg,
  EquipmentSchool,
} from "@/lib/peralatan/types";
import { filterEquipmentSchools } from "@/lib/peralatan/school-search";

type Quantities = Record<string, number>;

const initialState: EquipmentApplicationState = { ok: false, message: "" };

export default function LoanApplicationForm({
  items,
  pkgs,
  schools,
  defaultItemId,
  defaultPkgId,
}: {
  items: EquipmentCatalogItem[];
  pkgs: EquipmentPkg[];
  schools: EquipmentSchool[];
  defaultItemId?: string;
  defaultPkgId?: string;
}) {
  const firstPkgWithStock =
    pkgs.find((pkg) =>
      items.some((item) =>
        item.stocks.some((stock) => stock.pkgId === pkg.id && stock.available > 0),
      ),
    )?.id ?? pkgs[0]?.id ?? "";
  const initialPkg = pkgs.some((pkg) => pkg.id === defaultPkgId)
    ? defaultPkgId!
    : firstPkgWithStock;
  const defaultItemAvailable = items.some(
    (item) =>
      item.id === defaultItemId &&
      item.stocks.some(
        (stock) => stock.pkgId === initialPkg && stock.available > 0,
      ),
  );

  const [state, formAction, pending] = useActionState(
    createEquipmentLoanAction,
    initialState,
  );
  const [pkgId, setPkgId] = useState(initialPkg);
  const [applicantType, setApplicantType] = useState<"sekolah" | "pegawai">(
    "sekolah",
  );
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [quantities, setQuantities] = useState<Quantities>(() =>
    defaultItemId && defaultItemAvailable ? { [defaultItemId]: 1 } : {},
  );

  const filteredSchools = useMemo(
    () => filterEquipmentSchools(schools, schoolQuery),
    [schoolQuery, schools],
  );

  const pkgNames = useMemo(
    () => Object.fromEntries(pkgs.map((pkg) => [pkg.id, pkg.name])),
    [pkgs],
  );
  const selectedItems = useMemo(
    () =>
      items.flatMap((item) => {
        const quantity = quantities[item.id] ?? 0;
        return quantity > 0 ? [{ item, quantity }] : [];
      }),
    [items, quantities],
  );
  const serializedItems = JSON.stringify(
    selectedItems.map(({ item, quantity }) => ({
      equipmentTypeId: item.id,
      quantity,
    })),
  );

  function availableFor(item: EquipmentCatalogItem, selectedPkgId = pkgId) {
    return (
      item.stocks.find((stock) => stock.pkgId === selectedPkgId)?.available ?? 0
    );
  }

  function setQuantity(itemId: string, next: number) {
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const max = availableFor(item);
    setQuantities((current) => ({
      ...current,
      [itemId]: Math.max(0, Math.min(next, max)),
    }));
  }

  function changePkg(nextPkgId: string) {
    setPkgId(nextPkgId);
    setQuantities((current) =>
      Object.fromEntries(
        Object.entries(current).map(([itemId, quantity]) => {
          const item = items.find((candidate) => candidate.id === itemId);
          const max = item ? availableFor(item, nextPkgId) : 0;
          return [itemId, Math.min(quantity, max)];
        }),
      ),
    );
  }

  if (pkgs.length === 0) {
    return (
      <div className="card mt-8 p-6 text-sm text-graphite">
        Modul inventori belum diaktifkan. Pentadbir perlu menjalankan migrasi
        pangkalan data terlebih dahulu.
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
    >
      <input type="hidden" name="applicantType" value={applicantType} />
      <input type="hidden" name="pkgId" value={pkgId} />
      <input type="hidden" name="items" value={serializedItems} />

      <div className="space-y-5">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
              1
            </span>
            <div>
              <h2 className="font-semibold text-ink">Maklumat pemohon</h2>
              <p className="text-sm text-graphite">Untuk sekolah dan pegawai sahaja.</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-cloud p-1">
            {(
              [
                ["sekolah", "Sekolah"],
                ["pegawai", "Pegawai"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setApplicantType(value)}
                className={`h-10 rounded-md text-sm font-semibold transition ${
                  applicantType === value
                    ? "bg-white text-ink shadow-lift"
                    : "text-graphite hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="loan-name">
                Nama pemohon *
              </label>
              <input
                id="loan-name"
                name="applicantName"
                className="input"
                placeholder="Nama penuh"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="loan-position">
                Jawatan *
              </label>
              <input
                id="loan-position"
                name="position"
                className="input"
                placeholder="Contoh: Guru Penyelaras Bestari"
                required
              />
            </div>
            <div className={applicantType === "sekolah" ? "sm:col-span-2" : undefined}>
              <label className="label" htmlFor="loan-org">
                {applicantType === "sekolah" ? "Sekolah *" : "Bahagian / Unit *"}
              </label>
              {applicantType === "sekolah" ? (
                <>
                  <label className="sr-only" htmlFor="loan-school-search">
                    Cari sekolah
                  </label>
                  <input
                    id="loan-school-search"
                    className="input mb-2"
                    placeholder="Cari kod atau nama sekolah"
                    value={schoolQuery}
                    onChange={(event) => setSchoolQuery(event.target.value)}
                  />
                  <p className="mb-2 text-xs text-graphite">
                    {filteredSchools.length} sekolah sepadan
                  </p>
                  <select
                    id="loan-org"
                    name="schoolCode"
                    className="input"
                    required
                    value={schoolCode}
                    disabled={filteredSchools.length === 0}
                    onChange={(event) => setSchoolCode(event.target.value)}
                  >
                    <option value="" disabled>
                      Pilih sekolah
                    </option>
                    {filteredSchools.map((school) => (
                      <option key={school.code} value={school.code}>
                        {school.code} — {school.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <input
                  id="loan-org"
                  name="orgName"
                  className="input"
                  placeholder="Contoh: Unit Sumber dan Teknologi Pendidikan"
                  required
                />
              )}
            </div>
            <div>
              <label className="label" htmlFor="loan-phone">
                Nombor telefon *
              </label>
              <PhoneInput
                id="loan-phone"
                name="contact"
                placeholder="Contoh: 0123456789"
                required
              />
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
              2
            </span>
            <div>
              <h2 className="font-semibold text-ink">Lokasi dan tempoh pinjaman</h2>
              <p className="text-sm text-graphite">Satu permohonan untuk satu PKG.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="loan-pkg">
                PKG pemilik *
              </label>
              <select
                id="loan-pkg"
                className="input"
                value={pkgId}
                onChange={(event) => changePkg(event.target.value)}
              >
                {pkgs.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="loan-start">
                Tarikh dipinjam *
              </label>
              <input
                id="loan-start"
                name="borrowDate"
                type="date"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="loan-return">
                Dijangka pulang *
              </label>
              <input
                id="loan-return"
                name="expectedReturnDate"
                type="date"
                className="input"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="loan-purpose">
                Tujuan *
              </label>
              <textarea
                id="loan-purpose"
                name="purpose"
                className="textarea min-h-24"
                placeholder="Nyatakan program atau aktiviti yang akan dijalankan"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="loan-location">
                Tempat digunakan *
              </label>
              <input
                id="loan-location"
                name="usageLocation"
                className="input"
                placeholder="Contoh: Makmal Komputer sekolah"
                required
              />
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
              3
            </span>
            <div>
              <h2 className="font-semibold text-ink">Pilih peralatan</h2>
              <p className="text-sm text-graphite">
                Nombor siri ditetapkan oleh pentadbir semasa kelulusan.
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-fog rounded-lg border border-fog">
            {items.map((item) => {
              const available = availableFor(item);
              const quantity = quantities[item.id] ?? 0;
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-fog bg-cloud font-mono text-xs font-bold text-charcoal">
                    {item.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="mt-0.5 text-xs text-graphite">
                      {available} unit tersedia di {pkgNames[pkgId] ?? pkgId}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <button
                      type="button"
                      aria-label={`Kurangkan ${item.name}`}
                      onClick={() => setQuantity(item.id, quantity - 1)}
                      disabled={quantity === 0}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-fog bg-white text-lg text-charcoal disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Tambah ${item.name}`}
                      onClick={() => setQuantity(item.id, quantity + 1)}
                      disabled={quantity >= available}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-fog bg-white text-lg text-charcoal disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card overflow-hidden">
          <div className="border-b border-fog bg-ink px-5 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/65">
              Ringkasan permohonan
            </p>
            <p className="mt-1 font-semibold">{pkgNames[pkgId] ?? "Pilih PKG"}</p>
          </div>
          <div className="p-5">
            {selectedItems.length === 0 ? (
              <div className="py-8 text-center">
                <p className="font-medium text-ink">Belum ada peralatan dipilih</p>
                <p className="mt-2 text-sm leading-relaxed text-graphite">
                  Gunakan butang tambah untuk memilih kuantiti.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedItems.map(({ item, quantity }) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 border-b border-fog pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{item.name}</p>
                      <p className="mt-0.5 text-xs text-graphite">{item.model}</p>
                    </div>
                    <span className="rounded-md bg-cloud px-2 py-1 text-sm font-semibold">
                      ×{quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {state.message ? (
              <div
                className={`mt-5 rounded-lg border p-4 ${
                  state.ok
                    ? "border-primary/20 bg-primary-soft/25"
                    : "border-bloom-rose bg-bloom-rose/30"
                }`}
              >
                <p className="font-semibold text-ink">
                  {state.ok ? state.referenceNo : "Permohonan belum dihantar"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-charcoal">
                  {state.message}
                </p>
                {state.whatsappUrl ? (
                  <a
                    href={state.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary mt-4 w-full"
                  >
                    WhatsApp pegawai PKG
                  </a>
                ) : null}
              </div>
            ) : null}

            {!state.ok ? (
              <button
                type="submit"
                className="btn-primary mt-5 w-full"
                disabled={pending || selectedItems.length === 0}
              >
                {pending ? "Menghantar…" : "Hantar permohonan"}
              </button>
            ) : null}
            <p className="mt-3 text-center text-xs leading-relaxed text-graphite">
              Stok hanya ditempah selepas pentadbir meluluskan dan menetapkan unit.
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
