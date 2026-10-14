"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminPadamPerkaraMjkd,
  adminSimpanPerkaraMjkd,
  adminTogolPerkaraAktifMjkd,
  adminUbahSusunPerkaraMjkd,
} from "@/lib/actions/mjkd";
import { SASARAN_MJKD, SASARAN_MJKD_LABEL } from "@/lib/mjkd/enums";

export type PerkaraAdminItem = {
  id: string;
  para: string;
  mukaSurat: string;
  perkara: string;
  tindakan: string;
  panduan: string;
  sasaran: string;
  sekolahKhusus: string[];
  aktif: boolean;
  /** Bilangan jawapan sekolah (perkara berjawapan tidak boleh dipadam). */
  bilJawapan: number;
};

type SekolahPilihan = { code: string; name: string };

type Props = {
  mesyuaratId: string;
  perkara: PerkaraAdminItem[];
  sekolah: SekolahPilihan[];
};

function SekolahKhususPilih({
  sekolah,
  dipilih,
  onChange,
}: {
  sekolah: SekolahPilihan[];
  dipilih: string[];
  onChange: (kod: string[]) => void;
}) {
  const [cari, setCari] = useState("");
  const padan = useMemo(() => {
    const tokens = cari.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return sekolah.filter((s) =>
      tokens.every((t) => `${s.code} ${s.name}`.toLowerCase().includes(t)),
    );
  }, [cari, sekolah]);

  function togol(kod: string) {
    onChange(dipilih.includes(kod) ? dipilih.filter((k) => k !== kod) : [...dipilih, kod]);
  }

  return (
    <div>
      <label className="label" htmlFor="khusus-cari">
        Sekolah khusus (jika dipilih, mengatasi sasaran di atas)
      </label>
      {dipilih.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-2">
          {dipilih.map((kod) => (
            <li key={kod}>
              <button
                type="button"
                className="status-badge hover:border-steel"
                onClick={() => togol(kod)}
                aria-label={`Buang ${kod}`}
              >
                {sekolah.find((s) => s.code === kod)?.name ?? kod} ✕
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        id="khusus-cari"
        className="input"
        placeholder="Cari kod atau nama sekolah"
        autoComplete="off"
        value={cari}
        onChange={(e) => setCari(e.target.value)}
      />
      <ul className="mt-2 max-h-48 overflow-auto rounded-lg border hairline">
        {padan.length === 0 ? (
          <li className="px-4 py-3 text-sm text-graphite">Tiada sekolah sepadan.</li>
        ) : (
          padan.slice(0, 60).map((s) => (
            <li key={s.code} className="border-b hairline last:border-0">
              <label className="flex cursor-pointer items-baseline gap-3 px-4 py-2 text-sm hover:bg-cloud/55">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 translate-y-0.5 accent-ink"
                  checked={dipilih.includes(s.code)}
                  onChange={() => togol(s.code)}
                />
                <span className="shrink-0 font-mono text-xs text-graphite">{s.code}</span>
                <span>{s.name}</span>
              </label>
            </li>
          ))
        )}
      </ul>
      {padan.length > 60 ? (
        <p className="mt-1 text-xs text-graphite">Menunjukkan 60 pertama — persempit carian.</p>
      ) : null}
    </div>
  );
}

function PerkaraForm({
  mesyuaratId,
  awal,
  sekolah,
  onSelesai,
}: {
  mesyuaratId: string;
  awal?: PerkaraAdminItem;
  sekolah: SekolahPilihan[];
  onSelesai: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [khusus, setKhusus] = useState<string[]>(awal?.sekolahKhusus ?? []);
  const idAsas = awal?.id ?? "baharu";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("mesyuaratId", mesyuaratId);
    if (awal) formData.set("id", awal.id);
    formData.delete("sekolahKhusus");
    for (const k of khusus) formData.append("sekolahKhusus", k);
    startTransition(async () => {
      const res = await adminSimpanPerkaraMjkd(formData);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan perkara.");
        return;
      }
      router.refresh();
      onSelesai();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4 border-t hairline pt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`para-${idAsas}`}>
            Para *
          </label>
          <input
            id={`para-${idAsas}`}
            name="para"
            className="input"
            required
            maxLength={100}
            placeholder="cth. 4.1.3 (iii)"
            defaultValue={awal?.para}
          />
        </div>
        <div>
          <label className="label" htmlFor={`ms-${idAsas}`}>
            Muka surat
          </label>
          <input
            id={`ms-${idAsas}`}
            name="mukaSurat"
            className="input"
            maxLength={50}
            placeholder="cth. 15 atau 40–42"
            defaultValue={awal?.mukaSurat}
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor={`perkara-${idAsas}`}>
          Perkara *
        </label>
        <textarea
          id={`perkara-${idAsas}`}
          name="perkara"
          className="textarea"
          rows={4}
          required
          maxLength={4000}
          defaultValue={awal?.perkara}
        />
      </div>
      <div>
        <label className="label" htmlFor={`tindakan-${idAsas}`}>
          Tindakan (seperti dalam minit) *
        </label>
        <input
          id={`tindakan-${idAsas}`}
          name="tindakan"
          className="input"
          required
          maxLength={500}
          defaultValue={awal?.tindakan}
        />
      </div>
      <div>
        <label className="label" htmlFor={`panduan-${idAsas}`}>
          Panduan (dipaparkan di atas ruang jawapan)
        </label>
        <input
          id={`panduan-${idAsas}`}
          name="panduan"
          className="input"
          maxLength={1000}
          defaultValue={awal?.panduan}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`sasaran-${idAsas}`}>
            Sasaran *
          </label>
          <select
            id={`sasaran-${idAsas}`}
            name="sasaran"
            className="input"
            required
            defaultValue={awal?.sasaran ?? "SEMUA"}
          >
            {SASARAN_MJKD.map((s) => (
              <option key={s} value={s}>
                {SASARAN_MJKD_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-3 self-end pb-3 text-sm font-medium text-ink">
          <input
            type="checkbox"
            name="aktif"
            value="yes"
            className="h-4 w-4 accent-ink"
            defaultChecked={awal?.aktif ?? true}
          />
          Aktif (dipaparkan kepada sekolah)
        </label>
      </div>
      <SekolahKhususPilih sekolah={sekolah} dipilih={khusus} onChange={setKhusus} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-ink btn-sm" disabled={pending}>
          {pending ? "Menyimpan…" : awal ? "Simpan perkara" : "Tambah perkara"}
        </button>
        <button type="button" className="btn-outline-ink btn-sm" onClick={onSelesai}>
          Batal
        </button>
        {error && <p className="text-sm text-bloom-deep">{error}</p>}
      </div>
    </form>
  );
}

export default function AdminPerkaraMjkd({ mesyuaratId, perkara, sekolah }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sunting, setSunting] = useState<string | null>(null);
  const [tambah, setTambah] = useState(false);
  const namaMengikutKod = useMemo(() => new Map(sekolah.map((s) => [s.code, s.name])), [sekolah]);

  function jalankan(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Gagal.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-graphite">
          {perkara.length} perkara · {perkara.filter((p) => p.aktif).length} aktif
        </p>
        {!tambah ? (
          <button type="button" className="btn-ink btn-sm" onClick={() => setTambah(true)}>
            Tambah perkara
          </button>
        ) : null}
      </div>
      {error && <p className="text-sm text-bloom-deep">{error}</p>}

      {tambah ? (
        <div className="card p-5">
          <h3 className="font-semibold">Perkara baharu</h3>
          <PerkaraForm
            mesyuaratId={mesyuaratId}
            sekolah={sekolah}
            onSelesai={() => setTambah(false)}
          />
        </div>
      ) : null}

      {perkara.length === 0 ? (
        <p className="card p-6 text-sm text-graphite">Belum ada perkara tindakan.</p>
      ) : (
        <ol className="space-y-3">
          {perkara.map((p, i) => (
            <li key={p.id} className={`card p-5 ${p.aktif ? "" : "opacity-70"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
                    {i + 1}. Para {p.para}
                    {p.mukaSurat ? ` · m/s ${p.mukaSurat}` : ""}
                    {!p.aktif ? " · Tidak aktif" : ""}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">{p.perkara}</p>
                  <p className="mt-2 text-sm text-graphite">
                    <span className="font-medium text-charcoal">Tindakan:</span> {p.tindakan}
                  </p>
                  {p.panduan ? (
                    <p className="mt-1 text-sm text-graphite">
                      <span className="font-medium text-charcoal">Panduan:</span> {p.panduan}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-graphite">
                    <span className="font-medium text-charcoal">Sasaran:</span>{" "}
                    {p.sekolahKhusus.length > 0
                      ? p.sekolahKhusus.map((k) => namaMengikutKod.get(k) ?? k).join(", ")
                      : (SASARAN_MJKD_LABEL[p.sasaran as keyof typeof SASARAN_MJKD_LABEL] ??
                        p.sasaran)}
                    {" · "}
                    {p.bilJawapan} jawapan
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-outline-ink btn-sm"
                    disabled={pending || i === 0}
                    onClick={() => jalankan(() => adminUbahSusunPerkaraMjkd(p.id, "naik"))}
                    aria-label="Naikkan perkara"
                  >
                    Naik
                  </button>
                  <button
                    type="button"
                    className="btn-outline-ink btn-sm"
                    disabled={pending || i === perkara.length - 1}
                    onClick={() => jalankan(() => adminUbahSusunPerkaraMjkd(p.id, "turun"))}
                    aria-label="Turunkan perkara"
                  >
                    Turun
                  </button>
                  <button
                    type="button"
                    className="btn-outline-ink btn-sm"
                    disabled={pending}
                    onClick={() => jalankan(() => adminTogolPerkaraAktifMjkd(p.id, !p.aktif))}
                  >
                    {p.aktif ? "Nyahaktif" : "Aktifkan"}
                  </button>
                  <button
                    type="button"
                    className="btn-outline-ink btn-sm"
                    onClick={() => setSunting(sunting === p.id ? null : p.id)}
                  >
                    {sunting === p.id ? "Tutup" : "Sunting"}
                  </button>
                  <button
                    type="button"
                    className="btn-outline-ink btn-sm text-bloom-deep"
                    disabled={pending || p.bilJawapan > 0}
                    title={
                      p.bilJawapan > 0
                        ? "Sudah ada jawapan — nyahaktifkan sahaja."
                        : "Padam perkara"
                    }
                    onClick={() => {
                      if (window.confirm(`Padam perkara para ${p.para}?`)) {
                        jalankan(() => adminPadamPerkaraMjkd(p.id));
                      }
                    }}
                  >
                    Padam
                  </button>
                </div>
              </div>
              {sunting === p.id ? (
                <PerkaraForm
                  mesyuaratId={mesyuaratId}
                  awal={p}
                  sekolah={sekolah}
                  onSelesai={() => setSunting(null)}
                />
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
