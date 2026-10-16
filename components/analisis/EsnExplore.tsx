"use client";

import { useMemo, useState } from "react";
import TahunSelect from "@/components/analisis/TahunSelect";
import TarikhAkhirBanner from "@/components/analisis/TarikhAkhirBanner";
import {
  ESN_STATUS_LABEL,
  ESN_TARIKH_AKHIR,
  jumlahMuridEsn,
  jumlahSekolahEsn,
  type EsnJenis,
  type EsnKumpulan,
  type EsnRingkasan,
  type EsnSekolah,
  type EsnSnapshot,
  type EsnStatus,
} from "@/lib/analisis/esn-types";

type Tapis = "semua" | EsnStatus;

const num = (n: number) => n.toLocaleString("ms-MY");
const pct = (n: number) => `${n.toLocaleString("ms-MY", { maximumFractionDigits: 1 })}%`;
const bahagi = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const BULAN = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogos", "Sep", "Okt", "Nov", "Dis"];
const tarikh = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
};

const SAIZ_HALAMAN = 20;
const TAPIS_PILIHAN: { id: Tapis; label: string; pendek: string }[] = [
  { id: "semua", label: "Semua", pendek: "Semua" },
  { id: "selesai", label: "Selesai", pendek: "Selesai" },
  { id: "proses", label: "Dalam proses", pendek: "Proses" },
  { id: "belum", label: "Belum mula", pendek: "Belum" },
];

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-fog" aria-hidden>
      <div className="h-full rounded-full bg-ink" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function StatusLabel({ status }: { status: EsnStatus }) {
  const titik =
    status === "selesai"
      ? "bg-ink"
      : status === "proses"
        ? "border border-ink bg-white"
        : "bg-steel";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold ${
        status === "belum" ? "text-graphite" : "text-ink"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${titik}`} aria-hidden />
      {ESN_STATUS_LABEL[status]}
    </span>
  );
}

export default function EsnExplore({ snapshots }: { snapshots: EsnSnapshot[] }) {
  const years = useMemo(() => snapshots.map((s) => s.tahun).sort((a, b) => b - a), [snapshots]);
  const [tahun, setTahun] = useState<number>(years[0]);
  const snap = snapshots.find((s) => s.tahun === tahun) ?? snapshots[0];
  if (!snap) return <p className="mt-4 text-sm text-graphite">Data ESN belum tersedia.</p>;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {years.length > 1 ? <TahunSelect year={tahun} years={years} onChange={setTahun} /> : <span />}
        <p className="text-xs text-graphite sm:text-sm">
          Dibaca {tarikh(snap.capturedOn)} ·{" "}
          <a href="https://esn.moe.edu.my" target="_blank" rel="noopener noreferrer" className="link-blue">
            esn.moe.edu.my
          </a>
        </p>
      </div>
      {ESN_TARIKH_AKHIR[snap.tahun] ? (
        <TarikhAkhirBanner iso={ESN_TARIKH_AKHIR[snap.tahun]} teks="Semua sekolah mesti selesai melaksanakan ESN" />
      ) : null}
      <EsnTahun key={snap.tahun} snap={snap} />
    </div>
  );
}

function KartuRingkasan({ r }: { r: EsnRingkasan }) {
  const s = r.sekolah;
  const baris: { label: string; nilai: number }[] = [
    { label: "Selesai", nilai: s.selesai },
    { label: "Dalam proses", nilai: s.proses },
    { label: "Belum mula", nilai: s.belum },
  ];
  return (
    <div className="card p-4 sm:p-5">
      <p className="font-semibold">{r.label}</p>
      <p className="mt-1 text-xs text-graphite tabular-nums">
        {num(s.jumlah)} sekolah · selesai {num(s.selesai)} · dalam proses {num(s.proses)} · belum mula {num(s.belum)}
      </p>
      <div
        className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-fog"
        role="img"
        aria-label={baris.map((b) => `${b.label} ${b.nilai}`).join(", ")}
      >
        <div className="h-full bg-ink" style={{ width: `${bahagi(s.selesai, s.jumlah)}%` }} />
        <div className="h-full bg-steel" style={{ width: `${bahagi(s.proses, s.jumlah)}%` }} />
      </div>
      <ul className="mt-4 space-y-3.5">
        {r.murid.map((k: EsnKumpulan) => {
          const p = bahagi(k.selesai, k.jumlah);
          return (
            <li key={k.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold">{k.label}</span>
                <span className="font-semibold tabular-nums">{pct(p)}</span>
              </div>
              <div className="mt-1.5">
                <Bar value={p} />
              </div>
              <p className="mt-1 text-xs text-graphite tabular-nums">
                Selesai {num(k.selesai)}/{num(k.jumlah)} · dalam proses {num(k.proses)} · belum mula {num(k.belum)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EsnTahun({ snap }: { snap: EsnSnapshot }) {
  const [tapis, setTapis] = useState<Tapis>("semua");
  const [jenis, setJenis] = useState<"" | EsnJenis>("");
  const [cari, setCari] = useState("");
  const [had, setHad] = useState(SAIZ_HALAMAN);

  const murid = jumlahMuridEsn(snap);
  const sek = jumlahSekolahEsn(snap);

  const dalamJenis = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return snap.sekolah.filter(
      (s) =>
        (!jenis || s.jenis === jenis) &&
        (!q || s.nama.toLowerCase().includes(q) || s.kod.toLowerCase().includes(q)),
    );
  }, [snap.sekolah, jenis, cari]);

  const sekolah = useMemo(() => {
    const kemajuan = (s: EsnSekolah) => (s.muridJumlah === 0 ? -1 : bahagi(s.muridSiap, s.muridJumlah));
    return dalamJenis
      .filter((s) => tapis === "semua" || s.status === tapis)
      .sort((a, b) => kemajuan(b) - kemajuan(a) || b.muridJumlah - a.muridJumlah || a.kod.localeCompare(b.kod));
  }, [dalamJenis, tapis]);
  const dipapar = sekolah.slice(0, had);

  const bilTapis = (t: Tapis) =>
    t === "semua" ? dalamJenis.length : dalamJenis.filter((s) => s.status === t).length;
  const belumDaftar = dalamJenis.filter((s) => s.muridJumlah === 0).length;
  const ubahTapis = (fn: () => void) => {
    fn();
    setHad(SAIZ_HALAMAN);
  };

  const tiles = [
    { label: "Murid selesai", value: `${num(murid.siap)} / ${num(murid.jumlah)}` },
    { label: "Peratus murid selesai", value: pct(bahagi(murid.siap, murid.jumlah)) },
    { label: "Sekolah selesai", value: `${num(sek.selesai)} / ${num(sek.jumlah)}` },
    { label: "Sekolah dalam proses", value: num(sek.proses) },
  ];

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-3 sm:p-4">
            <p className="text-lg font-semibold tabular-nums tracking-tight sm:text-xl">{t.value}</p>
            <p className="mt-1 text-xs leading-snug text-graphite">{t.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {snap.ringkasan.map((r) => (
          <KartuRingkasan key={r.jenis} r={r} />
        ))}
      </div>

      <div className="card mt-4 p-4 sm:p-5">
        <p className="font-semibold">Status pelaksanaan sekolah</p>
        <p className="mt-1 text-xs text-graphite">
          Selesai = semua kelas dan murid yang didaftarkan telah selesai. Murid dikira daripada murid yang sudah
          didaftarkan sekolah.
          {belumDaftar > 0 ? ` ${belumDaftar} sekolah belum mendaftarkan murid.` : ""}
        </p>
        <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap sm:items-center">
          <div className="grid grid-cols-4 gap-1.5 sm:flex" role="group" aria-label="Tapis status">
            {TAPIS_PILIHAN.map((it) => {
              const aktif = tapis === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => ubahTapis(() => setTapis(it.id))}
                  className={`h-9 rounded border px-1.5 text-xs font-semibold tabular-nums transition-colors sm:px-3 sm:text-sm ${
                    aktif ? "border-ink bg-ink text-white" : "border-fog bg-white text-graphite hover:border-steel"
                  }`}
                >
                  <span className="sm:hidden">{it.pendek}</span>
                  <span className="hidden sm:inline">{it.label}</span> ({bilTapis(it.id)})
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2 sm:contents">
            <select
              className="input h-9 w-full px-2 py-0 text-sm sm:w-auto"
              value={jenis}
              onChange={(e) => ubahTapis(() => setJenis(e.target.value as "" | EsnJenis))}
              aria-label="Tapis jenis sekolah"
            >
              <option value="">Semua jenis</option>
              <option value="rendah">Sekolah rendah</option>
              <option value="menengah">Sekolah menengah</option>
            </select>
            <input
              type="search"
              className="input h-9 w-full px-2 py-0 text-sm sm:w-56"
              placeholder="Cari sekolah / kod"
              value={cari}
              onChange={(e) => ubahTapis(() => setCari(e.target.value))}
              aria-label="Cari sekolah"
            />
          </div>
        </div>

        {sekolah.length === 0 ? (
          <p className="py-6 text-center text-sm text-graphite">Tiada sekolah sepadan.</p>
        ) : (
          <ul className="mt-3 divide-y divide-fog">
            {dipapar.map((s) => (
              <li key={s.kod} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">{s.nama}</p>
                    <p className="text-xs text-graphite">
                      {s.kod} · {s.jenis === "rendah" ? "Rendah" : "Menengah"}
                    </p>
                  </div>
                  <StatusLabel status={s.status} />
                </div>
                {s.muridJumlah > 0 ? (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1">
                      <Bar value={bahagi(s.muridSiap, s.muridJumlah)} />
                    </div>
                    <span className="shrink-0 text-xs tabular-nums">
                      {s.muridSiap}/{s.muridJumlah} murid
                    </span>
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-graphite">Belum daftar murid</p>
                )}
                {s.kelasJumlah > 0 ? (
                  <p className="mt-1 text-xs text-graphite tabular-nums">
                    Kelas selesai {s.kelasSiap}/{s.kelasJumlah}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {sekolah.length > had ? (
          <button
            type="button"
            className="btn-outline-ink mt-3 w-full"
            onClick={() => setHad((h) => h + SAIZ_HALAMAN)}
          >
            Papar lagi ({sekolah.length - had})
          </button>
        ) : null}
      </div>
    </>
  );
}
