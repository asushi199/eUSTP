"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitLaporanAkhbar } from "@/lib/actions/laporan-akhbar";
import {
  AKHBAR_DECLARATION_TEXT,
  AKHBAR_TICKET_FOOTNOTE,
} from "@/lib/laporan-akhbar/declaration";
import {
  computeBaki,
  KATEGORI_SEKOLAH,
  STATUS_AKHBAR,
  YA_TIDAK,
} from "@/lib/laporan-akhbar/enums";
import type { SchoolOption } from "@/lib/direktori/queries";
import type { LaporanAkhbarRow } from "@/lib/laporan-akhbar/queries";

type Props = {
  schools: SchoolOption[];
  initialSchoolCode?: string;
  existing?: LaporanAkhbarRow | null;
  /** Nombor tiket yang telah disahkan di halaman semakan. */
  initialReceiptToken?: string;
};

function matchesSchoolQuery(school: SchoolOption, rawQuery: string) {
  const tokens = rawQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [school.code, school.name, school.zone].join(" ").toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function SelectYaTidak({
  id,
  name,
  label,
  defaultValue,
  required = true,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>
      <select
        id={id}
        name={name}
        className="input"
        required={required}
        defaultValue={defaultValue ?? ""}
      >
        <option value="" disabled>
          Pilih…
        </option>
        {YA_TIDAK.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function LaporanAkhbarForm({
  schools,
  initialSchoolCode,
  existing,
  initialReceiptToken,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [schoolCode, setSchoolCode] = useState(
    initialSchoolCode || existing?.schoolCode || "",
  );
  const [peruntukan, setPeruntukan] = useState(
    existing ? String(existing.peruntukanDiterimaRm) : "",
  );
  const [perbelanjaan, setPerbelanjaan] = useState(
    existing ? String(existing.perbelanjaanDigunakanRm) : "",
  );
  const [receiptToken, setReceiptToken] = useState(initialReceiptToken ?? "");

  const filteredSchools = useMemo(
    () => schools.filter((school) => matchesSchoolQuery(school, query)),
    [query, schools],
  );

  useEffect(() => {
    if (query.trim() === "") return;
    if (filteredSchools.length === 0) {
      setSchoolCode("");
      return;
    }
    if (!filteredSchools.some((s) => s.code === schoolCode)) {
      setSchoolCode(filteredSchools[0].code);
    }
  }, [filteredSchools, schoolCode, query]);

  const selected = schools.find((s) => s.code === schoolCode);
  const baki = (() => {
    const a = Number(peruntukan);
    const b = Number(perbelanjaan);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return computeBaki(a, b);
  })();

  const isUpdateLocked = Boolean(existing && initialReceiptToken);
  const needsReceipt = Boolean(existing);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("schoolCode", schoolCode);
    if (receiptToken) formData.set("receiptToken", receiptToken);

    startTransition(async () => {
      const res = await submitLaporanAkhbar(formData);
      if (!res.ok || !res.receiptToken || !res.schoolCode) {
        setError(res.error ?? "Gagal menghantar.");
        return;
      }
      const q = new URLSearchParams({
        kod: res.schoolCode,
        resit: res.receiptToken,
      });
      router.push(`/laporan-akhbar/berjaya?${q.toString()}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card p-6">
        <h2 className="text-lg font-semibold">1. Sekolah</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="carian-sekolah">
              Cari sekolah
            </label>
            <input
              id="carian-sekolah"
              className="input"
              placeholder="Kod atau nama sekolah"
              autoComplete="off"
              value={query}
              disabled={isUpdateLocked}
              onChange={(e) => setQuery(e.target.value)}
            />
            <p className="mt-1 text-xs text-graphite">
              {filteredSchools.length} sekolah sepadan
            </p>
          </div>
          <div>
            <label className="label" htmlFor="sekolah">
              Sekolah *
            </label>
            <select
              id="sekolah"
              className="input"
              required
              value={schoolCode}
              disabled={isUpdateLocked || filteredSchools.length === 0}
              onChange={(e) => setSchoolCode(e.target.value)}
            >
              <option value="" disabled>
                Pilih sekolah…
              </option>
              {filteredSchools.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
            {selected && (
              <p className="mt-1 text-xs text-graphite">
                PPD Manjung · {selected.zone || "—"}
              </p>
            )}
          </div>
          {query.trim() && !isUpdateLocked ? (
            <div className="sm:col-span-2">
              {filteredSchools.length === 0 ? (
                <p className="rounded-lg border hairline bg-fog/40 px-4 py-3 text-sm text-graphite">
                  Tiada sekolah sepadan. Cuba kod atau sebahagian nama.
                </p>
              ) : (
                <ul className="max-h-56 overflow-auto rounded-lg border hairline">
                  {filteredSchools.map((s) => {
                    const active = s.code === schoolCode;
                    return (
                      <li key={s.code} className="border-b hairline last:border-0">
                        <button
                          type="button"
                          className={`flex w-full items-baseline gap-3 px-4 py-2.5 text-left text-sm ${
                            active
                              ? "bg-cloud font-medium text-ink"
                              : "text-ink hover:bg-cloud/55"
                          }`}
                          onClick={() => setSchoolCode(s.code)}
                        >
                          <span className="shrink-0 font-mono text-xs text-graphite">
                            {s.code}
                          </span>
                          <span>{s.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        {needsReceipt && (
          <div className="mt-4">
            <label className="label" htmlFor="receiptToken">
              Nombor tiket (untuk kemaskini) *
            </label>
            <input
              id="receiptToken"
              className="input font-mono uppercase"
              required
              value={receiptToken}
              disabled={isUpdateLocked}
              onChange={(e) => setReceiptToken(e.target.value.toUpperCase())}
              placeholder="Contoh: A1B2C3D4…"
            />
            <p className="mt-1 text-xs text-graphite">
              {isUpdateLocked
                ? "Nombor tiket telah disahkan."
                : "Sekolah ini sudah menghantar. Masukkan nombor tiket yang diterima semasa hantaran pertama."}
            </p>
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">2. Peruntukan & perbelanjaan</h2>
        <p className="mt-1 text-sm text-graphite">
          Isi amaun 2026, kemudian terimaan dan baki peruntukan tahun 2024–2025.
        </p>
        <div className="mt-4 grid items-end gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="kategoriSekolah">
              Kategori sekolah *
            </label>
            <select
              id="kategoriSekolah"
              name="kategoriSekolah"
              className="input"
              required
              defaultValue={existing?.kategoriSekolah ?? ""}
            >
              <option value="" disabled>
                Pilih…
              </option>
              {KATEGORI_SEKOLAH.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <SelectYaTidak
            id="liputanPkb"
            name="liputanPkb"
            label="Liputan PKB"
            defaultValue={existing?.liputanPkb}
          />
          <div>
            <label className="label" htmlFor="peruntukanDiterimaRm">
              2026 Peruntukan diterima (RM) *
            </label>
            <input
              id="peruntukanDiterimaRm"
              name="peruntukanDiterimaRm"
              className="input"
              inputMode="decimal"
              required
              value={peruntukan}
              onChange={(e) => setPeruntukan(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="perbelanjaanDigunakanRm">
              2026 Perbelanjaan digunakan (RM) *
            </label>
            <input
              id="perbelanjaanDigunakanRm"
              name="perbelanjaanDigunakanRm"
              className="input"
              inputMode="decimal"
              required
              value={perbelanjaan}
              onChange={(e) => setPerbelanjaan(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="bayaranTertunggakRm">
              2026 Bayaran tertunggak (RM) *
            </label>
            <input
              id="bayaranTertunggakRm"
              name="bayaranTertunggakRm"
              className="input"
              inputMode="decimal"
              required
              defaultValue={existing ? String(existing.bayaranTertunggakRm) : "0"}
            />
          </div>
          <div>
            <div className="label">
              2026 Baki peruntukan (RM)
              <span className="mt-0.5 block text-xs font-normal text-graphite">
                Dikira automatik: peruntukan − perbelanjaan
              </span>
            </div>
            <div
              className="input flex items-center bg-cloud text-ink"
              aria-live="polite"
            >
              {baki == null
                ? "—"
                : baki.toLocaleString("ms-MY", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="dipulangkanJpnRm">
              2026 Dipulangkan kepada JPN (RM) *
            </label>
            <input
              id="dipulangkanJpnRm"
              name="dipulangkanJpnRm"
              className="input"
              inputMode="decimal"
              required
              defaultValue={existing ? String(existing.dipulangkanJpnRm) : "0"}
            />
          </div>
          <div>
            <label className="label" htmlFor="tambahanDipohonRm">
              Tambahan dipohon (RM) *
            </label>
            <input
              id="tambahanDipohonRm"
              name="tambahanDipohonRm"
              className="input"
              inputMode="decimal"
              required
              defaultValue={existing ? String(existing.tambahanDipohonRm) : "0"}
            />
          </div>
          <div>
            <label className="label" htmlFor="terimaanTahun20242025Rm">
              Terimaan tahun 2024–2025 (RM) *
            </label>
            <input
              id="terimaanTahun20242025Rm"
              name="terimaanTahun20242025Rm"
              className="input"
              inputMode="decimal"
              required
              defaultValue={existing ? String(existing.terimaanTahun20242025Rm) : ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="bakiPeruntukan20242025Rm">
              Baki peruntukan tahun 2024–2025 (RM) *
            </label>
            <input
              id="bakiPeruntukan20242025Rm"
              name="bakiPeruntukan20242025Rm"
              className="input"
              inputMode="decimal"
              required
              defaultValue={existing ? String(existing.bakiPeruntukan20242025Rm) : ""}
            />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">3. Checklist sekolah</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SelectYaTidak
            id="bayaranTertunggakSelesai"
            name="bayaranTertunggakSelesai"
            label="Bayaran tertunggak selesai"
            defaultValue={existing?.bayaranTertunggakSelesai}
          />
          <SelectYaTidak
            id="bakiDipulangkan"
            name="bakiDipulangkan"
            label="Baki dipulangkan"
            defaultValue={existing?.bakiDipulangkan}
          />
          <SelectYaTidak
            id="tiadaBakiKwk"
            name="tiadaBakiKwk"
            label="Tiada baki KWK"
            defaultValue={existing?.tiadaBakiKwk}
          />
          <SelectYaTidak
            id="mohonTambahan"
            name="mohonTambahan"
            label="Mohon tambahan"
            defaultValue={existing?.mohonTambahan}
          />
          <SelectYaTidak
            id="dokumenLengkap"
            name="dokumenLengkap"
            label="Dokumen lengkap"
            defaultValue={existing?.dokumenLengkap}
          />
          <div>
            <label className="label" htmlFor="statusSekolah">
              Status *
            </label>
            <select
              id="statusSekolah"
              name="statusSekolah"
              className="input"
              required
              defaultValue={existing?.statusSekolah ?? "Belum"}
            >
              {STATUS_AKHBAR.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="catatan">
              Catatan
            </label>
            <textarea
              id="catatan"
              name="catatan"
              className="textarea"
              rows={3}
              defaultValue={existing?.catatan ?? ""}
            />
          </div>

          <div className="sm:col-span-2 rounded-xl border border-fog bg-cloud/60 p-4 text-sm leading-relaxed text-charcoal">
            <p className="font-medium text-ink">Perakuan pemohon</p>
            <p className="mt-2">{AKHBAR_DECLARATION_TEXT}</p>
            <label className="mt-4 flex items-start gap-3 text-sm font-medium leading-relaxed text-ink">
              <input
                type="checkbox"
                name="declarationAccepted"
                value="yes"
                className="mt-1 h-4 w-4 shrink-0 accent-primary"
                required
              />
              <span>
                Saya telah membaca, memahami dan bersetuju dengan perakuan di atas.
              </span>
            </label>
            <p className="mt-4 text-xs text-graphite">*{AKHBAR_TICKET_FOOTNOTE}</p>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-md border border-bloom-deep/30 bg-white px-4 py-3 text-sm text-bloom-deep">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? "Menghantar…" : existing ? "Kemaskini tinjauan" : "Hantar tinjauan"}
      </button>
    </form>
  );
}
