"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminRegenerateAkhbarReceipt,
  adminSaveLaporanAkhbar,
} from "@/lib/actions/laporan-akhbar";
import {
  computeBaki,
  KATEGORI_SEKOLAH,
  STATUS_AKHBAR,
  YA_TIDAK,
} from "@/lib/laporan-akhbar/enums";
import type { LaporanAkhbarRow } from "@/lib/laporan-akhbar/queries";

function SelectOptionalYaTidak({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <select id={id} name={name} className="input" defaultValue={defaultValue ?? ""}>
        <option value="">—</option>
        {YA_TIDAK.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

function SelectRequiredYaTidak({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label} *
      </label>
      <select
        id={id}
        name={name}
        className="input"
        required
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

export default function AdminAkhbarForm({
  schoolCode,
  schoolName,
  record,
  defaultPegawai,
}: {
  schoolCode: string;
  schoolName: string;
  record: LaporanAkhbarRow | null;
  defaultPegawai: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState(record?.receiptToken ?? "");
  const [peruntukan, setPeruntukan] = useState(
    record ? String(record.peruntukanDiterimaRm) : "0",
  );
  const [perbelanjaan, setPerbelanjaan] = useState(
    record ? String(record.perbelanjaanDigunakanRm) : "0",
  );

  const baki = (() => {
    const a = Number(peruntukan);
    const b = Number(perbelanjaan);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return computeBaki(a, b);
  })();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    const formData = new FormData(e.currentTarget);
    formData.set("schoolCode", schoolCode);

    startTransition(async () => {
      const res = await adminSaveLaporanAkhbar(formData);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan.");
        return;
      }
      if (res.receiptToken) setReceipt(res.receiptToken);
      setOkMsg("Disimpan.");
      router.refresh();
    });
  }

  function onRegen() {
    setError(null);
    setOkMsg(null);
    startTransition(async () => {
      const res = await adminRegenerateAkhbarReceipt(schoolCode);
      if (!res.ok || !res.receiptToken) {
        setError(res.error ?? "Gagal jana resit.");
        return;
      }
      setReceipt(res.receiptToken);
      setOkMsg("Nombor resit baharu dijana.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card p-6">
        <h2 className="text-lg font-semibold">Sekolah</h2>
        <p className="mt-2 font-medium">
          {schoolCode} — {schoolName}
        </p>
        <p className="text-sm text-graphite">PPD Manjung</p>
        {receipt && (
          <p className="mt-3 text-sm">
            Resit sekolah:{" "}
            <span className="font-mono font-semibold tracking-wide">{receipt}</span>
          </p>
        )}
        {record && (
          <button
            type="button"
            className="btn-outline mt-3"
            disabled={pending}
            onClick={onRegen}
          >
            Jana semula resit
          </button>
        )}
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Data tinjauan</h2>
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
              defaultValue={record?.kategoriSekolah ?? ""}
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
          <SelectRequiredYaTidak
            id="liputanPkb"
            name="liputanPkb"
            label="Liputan PKB"
            defaultValue={record?.liputanPkb}
          />
          <div>
            <label className="label" htmlFor="peruntukanDiterimaRm">
              Peruntukan diterima (RM) *
            </label>
            <input
              id="peruntukanDiterimaRm"
              name="peruntukanDiterimaRm"
              className="input"
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
              required
              defaultValue={record ? String(record.bayaranTertunggakRm) : "0"}
            />
          </div>
          <div>
            <div className="label">
              Baki (RM)
              <span className="mt-0.5 block text-xs font-normal text-graphite">
                Dikira automatik
              </span>
            </div>
            <div className="input flex items-center bg-cloud text-ink" aria-live="polite">
              {baki == null
                ? "—"
                : baki.toLocaleString("ms-MY", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="dipulangkanJpnRm">
              Dipulangkan JPN (RM) *
            </label>
            <input
              id="dipulangkanJpnRm"
              name="dipulangkanJpnRm"
              className="input"
              required
              defaultValue={record ? String(record.dipulangkanJpnRm) : "0"}
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
              required
              defaultValue={record ? String(record.tambahanDipohonRm) : "0"}
            />
          </div>
          <SelectRequiredYaTidak
            id="bayaranTertunggakSelesai"
            name="bayaranTertunggakSelesai"
            label="Bayaran tertunggak selesai"
            defaultValue={record?.bayaranTertunggakSelesai}
          />
          <SelectRequiredYaTidak
            id="bakiDipulangkan"
            name="bakiDipulangkan"
            label="Baki dipulangkan"
            defaultValue={record?.bakiDipulangkan}
          />
          <SelectRequiredYaTidak
            id="tiadaBakiKwk"
            name="tiadaBakiKwk"
            label="Tiada baki KWK"
            defaultValue={record?.tiadaBakiKwk}
          />
          <SelectRequiredYaTidak
            id="mohonTambahan"
            name="mohonTambahan"
            label="Mohon tambahan"
            defaultValue={record?.mohonTambahan}
          />
          <SelectRequiredYaTidak
            id="dokumenLengkap"
            name="dokumenLengkap"
            label="Dokumen lengkap"
            defaultValue={record?.dokumenLengkap}
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
              defaultValue={record?.statusSekolah ?? "Belum"}
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
              Catatan sekolah
            </label>
            <textarea
              id="catatan"
              name="catatan"
              className="textarea"
              rows={2}
              defaultValue={record?.catatan ?? ""}
            />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Semakan PPD</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SelectOptionalYaTidak
            id="semakanLengkap"
            name="semakanLengkap"
            label="Semakan lengkap"
            defaultValue={record?.semakanLengkap}
          />
          <SelectOptionalYaTidak
            id="disahkan"
            name="disahkan"
            label="Disahkan"
            defaultValue={record?.disahkan}
          />
          <SelectOptionalYaTidak
            id="perluPembetulan"
            name="perluPembetulan"
            label="Perlu pembetulan"
            defaultValue={record?.perluPembetulan}
          />
          <div>
            <label className="label" htmlFor="pegawaiPpd">
              Pegawai
            </label>
            <input
              id="pegawaiPpd"
              name="pegawaiPpd"
              className="input"
              defaultValue={record?.pegawaiPpd || defaultPegawai}
            />
          </div>
          <div>
            <label className="label" htmlFor="tarikhSemakan">
              Tarikh semakan
            </label>
            <input
              id="tarikhSemakan"
              name="tarikhSemakan"
              type="date"
              className="input"
              defaultValue={record?.tarikhSemakan ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="catatanPpd">
              Catatan PPD
            </label>
            <textarea
              id="catatanPpd"
              name="catatanPpd"
              className="textarea"
              rows={2}
              defaultValue={record?.catatanPpd ?? ""}
            />
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-md border border-bloom-deep/30 px-4 py-3 text-sm text-bloom-deep">
          {error}
        </p>
      )}
      {okMsg && <p className="text-sm text-primary">{okMsg}</p>}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan"}
      </button>
    </form>
  );
}
