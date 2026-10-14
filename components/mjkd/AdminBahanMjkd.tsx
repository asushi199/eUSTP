"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminJanaKodBahanMjkd,
  adminPadamBahanMjkd,
  adminSetBahanDibukaMjkd,
  adminSimpanBahanMjkd,
} from "@/lib/actions/mjkd-bahan";
import { BAHAN_PDF_MAKS_BYTE, kumpulBahan, urlMuatTurunBahan } from "@/lib/mjkd/bahan";
import { labelBeberapaHari } from "@/lib/mjkd/hari";

export type BahanAdminItem = {
  id: string;
  sektorUnit: string;
  tajuk: string;
  namaPembentang: string;
  hari: string[];
  jenis: string;
  url: string;
  storagePath: string;
  dimuatNaikOleh: string;
  createdAt: string;
};

type PilihanHari = { label: string; nilai: string };

type Props = {
  mesyuaratId: string;
  bahanDibuka: boolean;
  kod: string;
  /** URL mutlak halaman muat naik awam. */
  uploadUrl: string;
  pilihanHari: PilihanHari[];
  cadanganSektor: string[];
  bahan: BahanAdminItem[];
};

function BahanForm({
  mesyuaratId,
  awal,
  pilihanHari,
  cadanganSektor,
  onSelesai,
}: {
  mesyuaratId: string;
  awal?: BahanAdminItem;
  pilihanHari: PilihanHari[];
  cadanganSektor: string[];
  onSelesai: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [jenis, setJenis] = useState<"PAUTAN" | "PDF">(
    awal?.jenis === "PDF" ? "PDF" : "PAUTAN",
  );
  const idAsas = awal?.id ?? "baharu";
  const hariAwal = awal ? awal.hari.join(",") : pilihanHari.length === 1 ? pilihanHari[0]!.nilai : "";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("mesyuaratId", mesyuaratId);
    if (awal) formData.set("id", awal.id);
    const fail = formData.get("fail");
    if (jenis === "PDF" && fail instanceof File && fail.size > BAHAN_PDF_MAKS_BYTE) {
      setError("Fail PDF melebihi 3 MB.");
      return;
    }
    if (jenis === "PAUTAN") formData.delete("fail");
    startTransition(async () => {
      const res = await adminSimpanBahanMjkd(formData);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan bahan.");
        return;
      }
      router.refresh();
      onSelesai();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor={`bhn-sektor-${idAsas}`}>
          Sektor / Unit *
        </label>
        <input
          id={`bhn-sektor-${idAsas}`}
          name="sektorUnit"
          className="input"
          required
          maxLength={150}
          list={`bhn-cadangan-${idAsas}`}
          defaultValue={awal?.sektorUnit}
        />
        <datalist id={`bhn-cadangan-${idAsas}`}>
          {cadanganSektor.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="label" htmlFor={`bhn-pembentang-${idAsas}`}>
          Nama pembentang *
        </label>
        <input
          id={`bhn-pembentang-${idAsas}`}
          name="namaPembentang"
          className="input"
          required
          maxLength={200}
          defaultValue={awal?.namaPembentang}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor={`bhn-tajuk-${idAsas}`}>
          Tajuk bahan *
        </label>
        <input
          id={`bhn-tajuk-${idAsas}`}
          name="tajuk"
          className="input"
          required
          maxLength={300}
          defaultValue={awal?.tajuk}
        />
      </div>
      <div>
        <label className="label" htmlFor={`bhn-hari-${idAsas}`}>
          Tarikh pembentangan *
        </label>
        <select
          id={`bhn-hari-${idAsas}`}
          name="hari"
          className="input"
          required
          defaultValue={hariAwal}
        >
          <option value="" disabled>
            Pilih…
          </option>
          {pilihanHari.map((p) => (
            <option key={p.nilai} value={p.nilai}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`bhn-jenis-${idAsas}`}>
          Jenis *
        </label>
        <select
          id={`bhn-jenis-${idAsas}`}
          name="jenis"
          className="input"
          value={jenis}
          onChange={(e) => setJenis(e.target.value === "PDF" ? "PDF" : "PAUTAN")}
        >
          <option value="PAUTAN">Pautan</option>
          <option value="PDF">Fail PDF (maks 3 MB)</option>
        </select>
      </div>
      {jenis === "PAUTAN" ? (
        <div className="sm:col-span-2">
          <label className="label" htmlFor={`bhn-url-${idAsas}`}>
            Pautan (https) *
          </label>
          <input
            id={`bhn-url-${idAsas}`}
            name="url"
            className="input"
            type="url"
            required
            maxLength={1000}
            defaultValue={awal?.jenis === "PAUTAN" ? awal.url : ""}
          />
        </div>
      ) : (
        <div className="sm:col-span-2">
          <label className="label" htmlFor={`bhn-fail-${idAsas}`}>
            Fail PDF {awal?.jenis === "PDF" ? "(biarkan kosong untuk kekalkan fail semasa)" : "*"}
          </label>
          <input
            id={`bhn-fail-${idAsas}`}
            name="fail"
            className="input"
            type="file"
            accept="application/pdf,.pdf"
            required={!(awal?.jenis === "PDF")}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" className="btn-ink btn-sm" disabled={pending}>
          {pending ? "Menyimpan…" : awal ? "Simpan" : "Tambah bahan"}
        </button>
        <button type="button" className="btn-outline-ink btn-sm" onClick={onSelesai}>
          Batal
        </button>
        {error && <p className="text-sm text-bloom-deep">{error}</p>}
      </div>
    </form>
  );
}

export default function AdminBahanMjkd({
  mesyuaratId,
  bahanDibuka,
  kod,
  uploadUrl,
  pilihanHari,
  cadanganSektor,
  bahan,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mesej, setMesej] = useState<string | null>(null);
  const [tambah, setTambah] = useState(false);
  const [sunting, setSunting] = useState<string | null>(null);
  const kumpulan = kumpulBahan(bahan);

  function jalankan(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    setMesej(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Gagal.");
        return;
      }
      router.refresh();
    });
  }

  async function salin(teks: string, label: string) {
    setError(null);
    try {
      await navigator.clipboard.writeText(teks);
      setMesej(`${label} disalin.`);
    } catch {
      setError("Gagal salin. Sila salin secara manual.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="status-badge">
            <span className={`status-dot ${bahanDibuka ? "bg-storm-deep" : "bg-steel"}`} aria-hidden />
            {bahanDibuka ? "Muat naik bahan dibuka" : "Muat naik bahan ditutup"}
          </span>
          <button
            type="button"
            className={bahanDibuka ? "btn-outline-ink btn-sm" : "btn-ink btn-sm"}
            disabled={pending}
            onClick={() => jalankan(() => adminSetBahanDibukaMjkd(mesyuaratId, !bahanDibuka))}
          >
            {bahanDibuka ? "Tutup muat naik" : "Buka muat naik"}
          </button>
        </div>

        <div>
          <p className="text-xs text-graphite">Kod muat naik (kongsi dengan pembentang)</p>
          {kod ? (
            <p className="mt-1 font-mono text-2xl font-semibold tracking-wider text-ink">{kod}</p>
          ) : (
            <p className="mt-1 text-sm text-graphite">
              Belum ada kod — dijana apabila muat naik dibuka, atau tekan &quot;Jana kod baharu&quot;.
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {kod ? (
              <button
                type="button"
                className="btn-outline-ink btn-sm"
                onClick={() => salin(kod, "Kod")}
              >
                Salin kod
              </button>
            ) : null}
            <button
              type="button"
              className="btn-outline-ink btn-sm"
              disabled={pending}
              onClick={() => {
                if (!kod || window.confirm("Jana kod baharu? Kod lama tidak boleh digunakan lagi.")) {
                  jalankan(() => adminJanaKodBahanMjkd(mesyuaratId));
                }
              }}
            >
              Jana kod baharu
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs text-graphite">Pautan muat naik awam</p>
          <p className="mt-1 break-all font-mono text-sm text-ink">{uploadUrl}</p>
          <button
            type="button"
            className="btn-outline-ink btn-sm mt-2"
            onClick={() => salin(uploadUrl, "Pautan")}
          >
            Salin pautan
          </button>
        </div>
        {error && <p className="text-sm text-bloom-deep">{error}</p>}
        {mesej && <p className="text-sm text-charcoal">{mesej}</p>}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink">Bahan ({bahan.length})</h3>
          {!tambah ? (
            <button type="button" className="btn-ink btn-sm" onClick={() => setTambah(true)}>
              Tambah bahan
            </button>
          ) : null}
        </div>

        {tambah ? (
          <div className="card p-5">
            <h4 className="mb-4 font-semibold">Bahan baharu (bagi pihak pembentang)</h4>
            <BahanForm
              mesyuaratId={mesyuaratId}
              pilihanHari={pilihanHari}
              cadanganSektor={cadanganSektor}
              onSelesai={() => setTambah(false)}
            />
          </div>
        ) : null}

        {bahan.length === 0 ? (
          <p className="card p-6 text-sm text-graphite">Belum ada bahan dimuat naik.</p>
        ) : (
          kumpulan.map((k) => (
            <div key={k.hari} className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-graphite">
                {k.label}
              </h4>
              {k.sektor.map((s) => (
                <div key={s.sektorUnit} className="card p-5">
                  <p className="font-semibold text-ink">{s.sektorUnit}</p>
                  <ul className="mt-3 divide-y divide-fog">
                    {s.bahan.map((b) => {
                      const muatTurun = urlMuatTurunBahan(b);
                      return (
                        <li key={`${k.hari}-${b.id}`} className="py-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink">{b.tajuk}</p>
                              <p className="text-xs text-graphite">
                                {b.namaPembentang} · {labelBeberapaHari(b.hari)} ·{" "}
                                {b.jenis === "PDF" ? "PDF" : "Pautan"} ·{" "}
                                {b.dimuatNaikOleh === "awam" ? "dimuat naik pembentang" : b.dimuatNaikOleh}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={b.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-outline-ink btn-sm"
                              >
                                Papar
                              </a>
                              {muatTurun ? (
                                <a href={muatTurun} className="btn-outline-ink btn-sm">
                                  Muat Turun
                                </a>
                              ) : null}
                              <button
                                type="button"
                                className="btn-outline-ink btn-sm"
                                onClick={() => setSunting(sunting === b.id ? null : b.id)}
                              >
                                {sunting === b.id ? "Tutup" : "Sunting"}
                              </button>
                              <button
                                type="button"
                                className="btn-outline-ink btn-sm text-bloom-deep"
                                disabled={pending}
                                onClick={() => {
                                  if (window.confirm(`Padam bahan "${b.tajuk}"?`)) {
                                    jalankan(() => adminPadamBahanMjkd(b.id));
                                  }
                                }}
                              >
                                Padam
                              </button>
                            </div>
                          </div>
                          {sunting === b.id ? (
                            <div className="mt-4 border-t hairline pt-4">
                              <BahanForm
                                mesyuaratId={mesyuaratId}
                                awal={b}
                                pilihanHari={pilihanHari}
                                cadanganSektor={cadanganSektor}
                                onSelesai={() => setSunting(null)}
                              />
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
