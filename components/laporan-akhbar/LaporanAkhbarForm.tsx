"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitLaporanAkhbar } from "@/lib/actions/laporan-akhbar";
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
  /** Jika true, minta resit untuk kemaskini. */
  requireReceipt?: boolean;
};

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
  requireReceipt,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [schoolCode, setSchoolCode] = useState(
    initialSchoolCode || existing?.schoolCode || schools[0]?.code || "",
  );
  const [peruntukan, setPeruntukan] = useState(
    existing ? String(existing.peruntukanDiterimaRm) : "",
  );
  const [perbelanjaan, setPerbelanjaan] = useState(
    existing ? String(existing.perbelanjaanDigunakanRm) : "",
  );
  const [receiptToken, setReceiptToken] = useState("");

  const filteredSchools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) =>
      [s.code, s.name, s.zone].join(" ").toLowerCase().includes(q),
    );
  }, [query, schools]);

  useEffect(() => {
    if (filteredSchools.length === 0) {
      setSchoolCode("");
      return;
    }
    if (!filteredSchools.some((s) => s.code === schoolCode)) {
      setSchoolCode(filteredSchools[0].code);
    }
  }, [filteredSchools, schoolCode]);

  const selected = schools.find((s) => s.code === schoolCode);
  const baki = (() => {
    const a = Number(peruntukan);
    const b = Number(perbelanjaan);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return computeBaki(a, b);
  })();

  const needsReceipt = Boolean(requireReceipt || existing);

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
              placeholder="Kod atau nama"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
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
              disabled={Boolean(existing) || filteredSchools.length === 0}
              onChange={(e) => setSchoolCode(e.target.value)}
            >
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
        </div>

        {needsReceipt && (
          <div className="mt-4">
            <label className="label" htmlFor="receiptToken">
              Nombor resit (untuk kemaskini) *
            </label>
            <input
              id="receiptToken"
              className="input font-mono uppercase"
              required
              value={receiptToken}
              onChange={(e) => setReceiptToken(e.target.value.toUpperCase())}
              placeholder="Contoh: A1B2C3D4…"
            />
            <p className="mt-1 text-xs text-graphite">
              Sekolah ini sudah menghantar. Masukkan nombor resit yang diterima semasa
              hantaran pertama.
            </p>
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">2. Peruntukan & perbelanjaan</h2>
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
              Peruntukan diterima (RM) *
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
              Perbelanjaan digunakan (RM) *
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
              Bayaran tertunggak (RM) *
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
              Baki peruntukan (RM)
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
              Dipulangkan kepada JPN (RM) *
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
