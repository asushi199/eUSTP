"use client";

import {
  type FormEvent,
  useActionState,
  useMemo,
  useRef,
  useState,
} from "react";
import PhoneInput from "@/components/PhoneInput";
import {
  createEquipmentLoanAction,
  type EquipmentApplicationState,
} from "@/lib/actions/peralatan";
import {
  EQUIPMENT_DECLARATION_END,
  EQUIPMENT_DECLARATION_INTRO,
  EQUIPMENT_DECLARATION_POINTS,
} from "@/lib/peralatan/declaration";
import type {
  EquipmentCatalogItem,
  EquipmentPkg,
  EquipmentSchool,
} from "@/lib/peralatan/types";
import { filterEquipmentSchools } from "@/lib/peralatan/school-search";

type Quantities = Record<string, number>;
type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const initialState: EquipmentApplicationState = { ok: false, message: "" };
const STEPS = [
  "Maklumat pemohon",
  "Tempoh dan tujuan",
  "Pilih peralatan",
  "Akuan dan semakan",
] as const;

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
  const pkgForDefaultItem = defaultItemId
    ? pkgs.find((pkg) =>
        items.some(
          (item) =>
            item.id === defaultItemId &&
            item.stocks.some(
              (stock) => stock.pkgId === pkg.id && stock.available > 0,
            ),
        ),
      )?.id
    : undefined;
  const firstPkgWithStock =
    pkgs.find((pkg) =>
      items.some((item) =>
        item.stocks.some((stock) => stock.pkgId === pkg.id && stock.available > 0),
      ),
    )?.id ?? pkgs[0]?.id ?? "";
  const initialPkg = pkgs.some((pkg) => pkg.id === defaultPkgId)
    ? defaultPkgId!
    : (pkgForDefaultItem ?? firstPkgWithStock);
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
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const stepperRef = useRef<HTMLDivElement>(null);
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
      equipmentCategoryId: item.id,
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

  function fieldsForStep(stepNumber: number) {
    const section = formRef.current?.querySelector<HTMLElement>(
      `[data-loan-step="${stepNumber}"]`,
    );
    return section
      ? Array.from(section.querySelectorAll<FormField>("input, select, textarea"))
      : [];
  }

  function validateStep(stepNumber: number, showMessage = true) {
    if (stepNumber === 3 && selectedItems.length === 0) {
      if (showMessage) setStepError("Pilih sekurang-kurangnya satu peralatan.");
      return false;
    }
    const invalidField = fieldsForStep(stepNumber).find(
      (field) => !field.disabled && !field.checkValidity(),
    );
    if (invalidField) {
      if (showMessage) {
        setStepError("Lengkapkan maklumat yang diperlukan sebelum meneruskan.");
        invalidField.reportValidity();
      }
      return false;
    }
    if (showMessage) setStepError("");
    return true;
  }

  function moveToStep(nextStep: number) {
    setStep(Math.max(1, Math.min(4, nextStep)));
    setStepError("");
    stepperRef.current?.scrollIntoView({ block: "start" });
  }

  function continueToNextStep() {
    if (validateStep(step)) moveToStep(step + 1);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    for (let stepNumber = 1; stepNumber <= 4; stepNumber += 1) {
      if (!validateStep(stepNumber, false)) {
        event.preventDefault();
        moveToStep(stepNumber);
        requestAnimationFrame(() => validateStep(stepNumber));
        return;
      }
    }
    setStepError("");
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
      ref={formRef}
      action={formAction}
      noValidate
      onSubmit={handleSubmit}
      className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
    >
      <input type="hidden" name="applicantType" value={applicantType} />
      <input type="hidden" name="pkgId" value={pkgId} />
      <input type="hidden" name="items" value={serializedItems} />

      <div className="space-y-5">
        <div ref={stepperRef} className="card scroll-mt-24 p-4 sm:p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.11em] text-graphite sm:hidden">
            Langkah {step} daripada 4
          </p>
          <ol className="grid grid-cols-4 gap-2" aria-label="Kemajuan permohonan">
            {STEPS.map((label, index) => {
              const stepNumber = index + 1;
              const completed = stepNumber < step;
              const current = stepNumber === step;
              return (
                <li
                  key={label}
                  aria-current={current ? "step" : undefined}
                  className="min-w-0"
                >
                  <div className="flex items-center">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                        current
                          ? "border-primary bg-primary text-white"
                          : completed
                            ? "border-ink bg-ink text-white"
                            : "border-steel bg-white text-graphite"
                      }`}
                    >
                      {completed ? "✓" : stepNumber}
                    </span>
                    {stepNumber < STEPS.length ? (
                      <span
                        className={`mx-2 h-px flex-1 ${
                          completed ? "bg-ink" : "bg-fog"
                        }`}
                      />
                    ) : null}
                  </div>
                  <p
                    className={`mt-2 hidden truncate text-xs sm:block ${
                      current ? "font-semibold text-ink" : "text-graphite"
                    }`}
                  >
                    {label}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        <section
          data-loan-step="1"
          hidden={step !== 1}
          className="card p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
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
            <div>
              <label className="label" htmlFor="loan-mykad">
                No. MyKad pemohon *
              </label>
              <input
                id="loan-mykad"
                name="applicantMykad"
                className="input"
                inputMode="numeric"
                autoComplete="off"
                pattern="[0-9]{12}"
                maxLength={12}
                placeholder="12 digit tanpa sengkang"
                required
              />
              <p className="mt-1 text-xs leading-relaxed text-graphite">
                Digunakan untuk pengesahan identiti dan rekod pinjaman sahaja.
              </p>
            </div>
          </div>
        </section>

        <section
          data-loan-step="2"
          hidden={step !== 2}
          className="card p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
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

        <section
          data-loan-step="3"
          hidden={step !== 3}
          className="card p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
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
                  className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug text-ink">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-graphite">
                      {available} unit tersedia di {pkgNames[pkgId] ?? pkgId}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-fog pt-3 sm:justify-end sm:border-0 sm:pt-0">
                    <span className="text-xs font-medium text-graphite sm:sr-only">
                      Kuantiti
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Kurangkan ${item.name}`}
                        onClick={() => setQuantity(item.id, quantity - 1)}
                        disabled={quantity === 0}
                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-fog bg-white text-lg text-charcoal transition hover:border-steel hover:bg-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-40"
                      >
                        −
                      </button>
                      <output
                        aria-live="polite"
                        className="w-9 text-center font-semibold tabular-nums text-ink"
                      >
                        {quantity}
                      </output>
                      <button
                        type="button"
                        aria-label={`Tambah ${item.name}`}
                        onClick={() => setQuantity(item.id, quantity + 1)}
                        disabled={quantity >= available}
                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-fog bg-white text-lg text-charcoal transition hover:border-steel hover:bg-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          data-loan-step="4"
          hidden={step !== 4}
          className="card p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-semibold text-ink">Akuan pemohon</h2>
              <p className="text-sm text-graphite">
                Wajib dibaca sebelum permohonan dihantar.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-fog p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.09em] text-graphite">
              Semakan peralatan
            </p>
            <p className="mt-2 text-sm font-semibold text-ink">
              {pkgNames[pkgId] ?? "PKG belum dipilih"}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-charcoal">
              {selectedItems.map(({ item, quantity }) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span>{item.name}</span>
                  <span className="font-semibold tabular-nums">×{quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 rounded-xl border border-fog bg-cloud/60 p-4 text-sm leading-relaxed text-charcoal">
            <p>{EQUIPMENT_DECLARATION_INTRO}</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              {EQUIPMENT_DECLARATION_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ol>
            <p className="mt-3">{EQUIPMENT_DECLARATION_END}</p>
          </div>

          <label className="mt-4 flex items-start gap-3 text-sm font-medium leading-relaxed text-ink">
            <input
              type="checkbox"
              name="declarationAccepted"
              value="yes"
              className="mt-1 h-4 w-4 shrink-0 accent-primary"
              required
            />
            <span>
              Saya telah membaca, memahami dan bersetuju dengan Akuan Pemohon
              di atas.
            </span>
          </label>
        </section>

        {!state.ok ? (
          <div className="card p-4 sm:p-5">
            {stepError || state.message ? (
              <p className="mb-4 rounded-lg bg-bloom-rose/30 p-3 text-sm text-bloom-deep">
                {stepError || state.message}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  className="btn-outline-ink btn-sm"
                  onClick={() => moveToStep(step - 1)}
                >
                  Kembali
                </button>
              ) : (
                <span />
              )}
              {step < 4 ? (
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={continueToNextStep}
                >
                  Teruskan
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-primary btn-sm"
                  disabled={pending}
                >
                  {pending ? "Menghantar…" : "Hantar permohonan"}
                </button>
              )}
            </div>
          </div>
        ) : null}
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
                      <p className="mt-0.5 text-xs text-graphite">
                        Model ditetapkan mengikut ketersediaan semasa
                      </p>
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

            <p className="mt-3 text-center text-xs leading-relaxed text-graphite">
              Stok hanya ditempah selepas pentadbir meluluskan dan menetapkan unit.
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
