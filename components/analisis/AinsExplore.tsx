"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import AinsLineChart from "@/components/analisis/AinsCharts";
import AnalisisKpiTiles from "@/components/analisis/AnalisisKpiTiles";
import TahunSelect from "@/components/analisis/TahunSelect";
import BreakdownBarChart from "@/components/stats/BreakdownBarChart";
import { loadAinsMurid, loadAinsTahun } from "@/lib/actions/ains-explore";
import { csvMuridSatuBulan, csvMuridSemuaBulan, namaFailAins } from "@/lib/analisis/ains-csv";
import { direktoriLoginHref } from "@/lib/moe-dl";
import {
  AINS_BULAN,
  bulanTerkini,
  jumlahAins,
  lulusIkutJenis,
  type AinsBackup,
  type AinsMuridRow,
  type AinsSekolahRow,
  type AinsTahunData,
} from "@/lib/analisis/ains-types";

type Layer = "overview" | "schools" | "school";
type SekolahSort = "kod" | "nama" | "lulus-desc" | "lulus-asc" | "baca-asc" | "baca-desc";
type MuridSort = "lulus-desc" | "lulus-asc" | "nama";

const BIRU = "#024ad8";
const DAKWAT = "#1a1a1a";
const GRAFIT = "#636363";
const BACK = "text-sm text-graphite hover:text-ink";

const num = (n: number) => n.toLocaleString("ms-MY");
const pct = (n: number) => `${n.toLocaleString("ms-MY", { maximumFractionDigits: 1 })}%`;
const bahagi = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const namaBulan = (b: number) => AINS_BULAN[b - 1] ?? String(b);

export default function AinsExplore({
  years,
  initial = null,
  backup,
  initialLayer = "overview",
}: {
  /** Tahun yang ada data bulanan dalam pangkalan data. */
  years: number[];
  /** Data tahun terkini jika sudah dimuat pelayan; null = dimuat sendiri selepas dipaparkan. */
  initial?: AinsTahunData | null;
  backup: AinsBackup;
  initialLayer?: Layer;
}) {
  const [tahun, setTahun] = useState<number>(initial?.tahun ?? years[0] ?? backup.tahun);
  const [cache, setCache] = useState<Record<number, AinsTahunData>>(
    initial ? { [initial.tahun]: initial } : {},
  );
  const [layer, setLayer] = useState<Layer>(initialLayer);
  const [bulanPilih, setBulanPilih] = useState<number | null>(null);
  const [kod, setKod] = useState<string | null>(null);
  const [murid, setMurid] = useState<Record<string, AinsMuridRow[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Senarai murid memerlukan log masuk MOE-DL. */
  const [perluLogin, setPerluLogin] = useState(false);

  const allYears = useMemo(
    () => [...new Set([...years, backup.tahun])].sort((a, b) => b - a),
    [years, backup.tahun],
  );
  const adaData = years.includes(tahun);
  const data = adaData ? (cache[tahun] ?? null) : null;
  const bulan = data
    ? bulanPilih && data.bulan.includes(bulanPilih)
      ? bulanPilih
      : bulanTerkini(data)
    : 0;

  async function tukarTahun(next: number) {
    setError(null);
    setLayer("overview");
    setKod(null);
    setBulanPilih(null);
    setTahun(next);
    await muatTahun(next);
  }

  // Tiada data awal daripada pelayan (cth. modal halaman utama): muat tahun terkini sekali.
  useEffect(() => {
    if (!initial && years[0] != null) void muatTahun(years[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function muatTahun(next: number) {
    if (!years.includes(next) || cache[next]) return;
    setLoading(true);
    try {
      const d = await loadAinsTahun(next);
      if (d) setCache((c) => ({ ...c, [next]: d }));
      else setError("Data tahun ini tidak dapat dimuatkan.");
    } catch {
      setError("Data tahun ini tidak dapat dimuatkan.");
    } finally {
      setLoading(false);
    }
  }

  async function bukaSekolah(k: string) {
    setKod(k);
    setLayer("school");
    setError(null);
    const kunci = `${tahun}:${k}`;
    if (murid[kunci]) return;
    setLoading(true);
    try {
      const res = await loadAinsMurid(tahun, k);
      if (res.ok) {
        setPerluLogin(false);
        setMurid((m) => ({ ...m, [kunci]: res.rows }));
      } else if (res.reason === "login") setPerluLogin(true);
      else setError("Senarai murid tidak dapat dimuatkan.");
    } catch {
      setError("Senarai murid tidak dapat dimuatkan.");
    } finally {
      setLoading(false);
    }
  }

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <TahunSelect year={tahun} years={allYears} onChange={(y) => void tukarTahun(y)} />
      {data ? (
        <label className="flex items-center gap-2 text-sm text-graphite">
          <span>Bulan</span>
          <select
            className="input h-9 w-[5.75rem] px-2 py-0 text-sm"
            value={bulan}
            onChange={(e) => setBulanPilih(Number(e.target.value))}
            aria-label="Pilih bulan"
          >
            {data.bulan.map((b) => (
              <option key={b} value={b}>
                {namaBulan(b)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );

  /* ---------- Tahun sandaran (tiada data sekolah/murid) ---------- */
  if (!adaData) {
    return (
      <div className="mt-4">
        {header}
        <p className="mt-3 text-sm text-graphite">
          Data sandaran {tahun} — jumlah keseluruhan sahaja, tiada senarai sekolah atau murid.
        </p>
        <div className="mt-4">
          <AnalisisKpiTiles tiles={backup.tiles} />
        </div>
        <div className="mt-4">
          <BreakdownBarChart
            title="Buku Diluluskan Ikut Jenis Sekolah"
            data={backup.bars}
            seriesName="Buku"
          />
        </div>
        {backup.sourceUrl ? (
          <a
            href={backup.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-blue mt-3 inline-block text-sm"
          >
            {backup.sourceLabel || "Buka sumber Ains"}
          </a>
        ) : null}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mt-4">
        {header}
        <p className="mt-4 text-sm text-graphite">
          {loading ? "Memuatkan data…" : (error ?? "Tiada data.")}
        </p>
      </div>
    );
  }

  const barisBulan = data.sekolah.filter((r) => r.bulan === bulan);
  const j = jumlahAins(barisBulan);

  /* ---------- Satu sekolah ---------- */
  if (layer === "school" && kod) {
    const sekolahBulan = data.sekolah.filter((r) => r.kod === kod);
    const semasa = sekolahBulan.find((r) => r.bulan === bulan) ?? null;
    return (
      <SekolahView
        key={`${tahun}:${kod}`}
        header={header}
        tahun={tahun}
        bulan={bulan}
        nama={semasa?.nama ?? sekolahBulan[0]?.nama ?? kod}
        kod={kod}
        sekolahBulan={sekolahBulan}
        murid={murid[`${tahun}:${kod}`] ?? null}
        loading={loading}
        error={error}
        perluLogin={perluLogin}
        onBack={() => setLayer("schools")}
      />
    );
  }

  /* ---------- Senarai sekolah ---------- */
  if (layer === "schools") {
    return (
      <SenaraiSekolah
        header={header}
        tahun={tahun}
        bulan={bulan}
        rows={barisBulan}
        onBack={() => setLayer("overview")}
        onSelect={(k) => void bukaSekolah(k)}
      />
    );
  }

  /* ---------- Ringkasan ---------- */
  const trend = data.bulan.map((b) => {
    const t = jumlahAins(data.sekolah.filter((r) => r.bulan === b));
    return {
      bulan: namaBulan(b),
      lulus: t.lulus,
      ditolak: t.ditolak,
      muridMembaca: t.muridMembaca,
      bm: t.bm,
      eng: t.eng,
      lain: t.lain,
    };
  });
  return (
    <div className="mt-4">
      {header}
      <p className="mt-3 text-sm text-graphite">
        PPD Manjung · {j.sekolah} sekolah · {namaBulan(bulan)} {tahun}
      </p>
      <div className="mt-4">
        <AnalisisKpiTiles
          tiles={[
            { label: "Buku Diluluskan", value: num(j.lulus) },
            { label: "Ditolak", value: num(j.ditolak) },
            {
              label: `Murid membaca (daripada ${num(j.murid)})`,
              value: `${num(j.muridMembaca)} · ${pct(bahagi(j.muridMembaca, j.murid))}`,
            },
            {
              label: "Purata buku seorang murid",
              value: (j.murid > 0 ? j.lulus / j.murid : 0).toFixed(2),
            },
            { label: "Muka surat dibaca", value: num(j.mukaSurat) },
            { label: "Bintang", value: num(j.star) },
          ]}
        />
      </div>
      <ChartTabs
        items={[
          {
            id: "lulus",
            label: "Buku",
            node: (
              <AinsLineChart
                title="Buku diluluskan mengikut bulan"
                data={trend}
                series={[{ key: "lulus", name: "Diluluskan", color: BIRU }]}
              />
            ),
          },
          {
            id: "murid",
            label: "Murid",
            node: (
              <AinsLineChart
                title="Murid yang membaca mengikut bulan"
                data={trend}
                series={[{ key: "muridMembaca", name: "Murid membaca", color: DAKWAT }]}
              />
            ),
          },
          {
            id: "bahasa",
            label: "Bahasa",
            node: (
              <AinsLineChart
                title="Bacaan mengikut bahasa"
                data={trend}
                series={[
                  { key: "bm", name: "BM", color: BIRU },
                  { key: "eng", name: "BI", color: DAKWAT },
                  { key: "lain", name: "Lain-lain", color: GRAFIT },
                ]}
              />
            ),
          },
          {
            id: "jenis",
            label: "Jenis",
            node: (
              <BreakdownBarChart
                title={`Buku Diluluskan Ikut Jenis Sekolah · ${namaBulan(bulan)}`}
                data={lulusIkutJenis(barisBulan)}
                seriesName="Buku"
              />
            ),
          },
        ]}
      />
      <p className="mt-4">
        <button type="button" className="btn-outline btn-sm" onClick={() => setLayer("schools")}>
          Lihat senarai sekolah &amp; murid
        </button>
      </p>
      <p className="mt-3 max-w-2xl text-xs leading-relaxed text-graphite">
        Angka setiap bulan diambil terus daripada fail sumber bulan itu (PPD Manjung sahaja). Jumlah
        diluluskan/ditolak mengikut fail ringkasan sekolah; murid membaca = murid dengan
        sekurang-kurangnya satu bacaan diluluskan.
      </p>
    </div>
  );
}

/** Skrin sm (640px) ke atas → jadual penuh; di bawahnya → kad. Hanya satu yang dirender. */
const SKRIN_LEBAR = "(min-width: 640px)";
function useSkrinLebar(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(SKRIN_LEBAR);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(SKRIN_LEBAR).matches,
    () => false,
  );
}

/**
 * Telefon/tablet: satu carta pada satu masa dengan tab (kurang tatal menegak).
 * Skrin lebar (lg): semua carta dipapar berdampingan.
 */
function ChartTabs({ items }: { items: { id: string; label: string; node: React.ReactNode }[] }) {
  const [aktif, setAktif] = useState(items[0]?.id);
  return (
    <div className="mt-4">
      <div
        role="tablist"
        aria-label="Pilih carta"
        className="grid gap-2 lg:hidden"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={aktif === it.id}
            className={`h-10 rounded px-1 text-xs font-semibold leading-tight ${
              aktif === it.id ? "bg-ink text-white" : "border hairline bg-white text-graphite"
            }`}
            onClick={() => setAktif(it.id)}
          >
            {it.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-4 lg:mt-0 lg:grid-cols-2">
        {items.map((it) => (
          <div key={it.id} className={aktif === it.id ? "" : "hidden lg:block"}>
            {it.node}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ====================== Senarai sekolah ====================== */

const SEKOLAH_HALAMAN = 30;

function SenaraiSekolah({
  header,
  tahun,
  bulan,
  rows,
  onBack,
  onSelect,
}: {
  header: React.ReactNode;
  tahun: number;
  bulan: number;
  rows: AinsSekolahRow[];
  onBack: () => void;
  onSelect: (kod: string) => void;
}) {
  const [q, setQ] = useState("");
  const [jenis, setJenis] = useState("");
  const [sort, setSort] = useState<SekolahSort>("kod");
  const [papar, setPapar] = useState(SEKOLAH_HALAMAN);
  const lebar = useSkrinLebar();
  const jenisList = useMemo(
    () => [...new Set(rows.map((r) => r.jenis).filter(Boolean))].sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const kata = q.trim().toLowerCase();
    const out = rows.filter(
      (r) =>
        (!jenis || r.jenis === jenis) &&
        (!kata || `${r.kod} ${r.nama}`.toLowerCase().includes(kata)),
    );
    const baca = (r: AinsSekolahRow) => bahagi(r.muridMembaca, r.murid);
    const susun: Record<SekolahSort, (a: AinsSekolahRow, b: AinsSekolahRow) => number> = {
      kod: (a, b) => a.kod.localeCompare(b.kod),
      nama: (a, b) => a.nama.localeCompare(b.nama, "ms"),
      "lulus-desc": (a, b) => b.lulus - a.lulus,
      "lulus-asc": (a, b) => a.lulus - b.lulus,
      "baca-asc": (a, b) => baca(a) - baca(b),
      "baca-desc": (a, b) => baca(b) - baca(a),
    };
    return [...out].sort(susun[sort]);
  }, [rows, q, jenis, sort]);

  return (
    <div className="mt-4">
      <button type="button" className={BACK} onClick={onBack}>
        ← Carta
      </button>
      <h3 className="mt-3 text-lg font-semibold tracking-tight">
        Ains mengikut sekolah · {namaBulan(bulan)} {tahun}
      </h3>
      <div className="mt-3">{header}</div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_16rem] sm:items-end">
        <div className="col-span-2 sm:col-span-1">
          <label className="label" htmlFor="ains-carian">
            Cari sekolah
          </label>
          <input
            id="ains-carian"
            className="input"
            placeholder="Kod atau nama sekolah"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPapar(SEKOLAH_HALAMAN);
            }}
          />
        </div>
        <div>
          <label className="label" htmlFor="ains-jenis">
            Jenis
          </label>
          <select
            id="ains-jenis"
            className="input"
            value={jenis}
            onChange={(e) => {
              setJenis(e.target.value);
              setPapar(SEKOLAH_HALAMAN);
            }}
          >
            <option value="">Semua</option>
            {jenisList.map((jn) => (
              <option key={jn} value={jn}>
                {jn}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ains-susun">
            Susun
          </label>
          <select
            id="ains-susun"
            className="input"
            value={sort}
            onChange={(e) => setSort(e.target.value as SekolahSort)}
          >
            <option value="kod">Kod sekolah</option>
            <option value="nama">Nama</option>
            <option value="lulus-desc">Buku diluluskan (tinggi → rendah)</option>
            <option value="lulus-asc">Buku diluluskan (rendah → tinggi)</option>
            <option value="baca-asc">% murid membaca (rendah → tinggi)</option>
            <option value="baca-desc">% murid membaca (tinggi → rendah)</option>
          </select>
        </div>
      </div>
      <p className="mt-3 text-xs text-graphite">{filtered.length} sekolah</p>
      {/* Telefon: kad ringkas tanpa tatal mendatar */}
      {!lebar ? (
        <ul className="card mt-3 divide-y divide-fog/60">
          {filtered.slice(0, papar).map((r) => (
            <li key={r.kod}>
              <button
                type="button"
                className="block w-full px-4 py-3 text-left"
                onClick={() => onSelect(r.kod)}
              >
                <span className="block font-medium leading-snug text-ink">{r.nama}</span>
                <span className="mt-0.5 block text-xs text-graphite">
                  {r.kod}
                  {r.jenis ? ` · ${r.jenis}` : ""}
                </span>
                <span className="mt-2 grid grid-cols-3 gap-2 text-xs text-graphite">
                  <span>
                    <span className="block text-base font-semibold tabular-nums text-ink">
                      {num(r.lulus)}
                    </span>
                    Diluluskan
                  </span>
                  <span>
                    <span className="block text-base font-semibold tabular-nums text-ink">
                      {pct(bahagi(r.muridMembaca, r.murid))}
                    </span>
                    Murid membaca
                  </span>
                  <span>
                    <span className="block text-base font-semibold tabular-nums text-ink">
                      {(r.murid > 0 ? r.lulus / r.murid : 0).toFixed(2)}
                    </span>
                    Purata / murid
                  </span>
                </span>
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-graphite">Tiada sekolah sepadan.</li>
          ) : null}
        </ul>
      ) : (
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead>
              <tr className="border-b border-fog text-[11px] font-semibold uppercase tracking-[0.6px] text-steel">
                <th className="px-4 py-3">Sekolah</th>
                <th className="px-4 py-3 text-right">Murid</th>
                <th className="px-4 py-3 text-right">Murid membaca</th>
                <th className="px-4 py-3 text-right">Diluluskan</th>
                <th className="px-4 py-3 text-right">Ditolak</th>
                <th className="px-4 py-3 text-right">Purata / murid</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, papar).map((r) => (
                <tr key={r.kod} className="border-b border-fog/60 last:border-0">
                  <td className="min-w-[12rem] px-4 py-3">
                    <button
                      type="button"
                      className="text-left font-medium leading-snug text-ink hover:underline"
                      onClick={() => onSelect(r.kod)}
                    >
                      {r.nama}
                    </button>
                    <p className="mt-0.5 text-xs text-graphite">
                      {r.kod}
                      {r.jenis ? ` · ${r.jenis}` : ""}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    {num(r.murid)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    {num(r.muridMembaca)}
                    <span className="ml-1 text-xs text-graphite">
                      ({pct(bahagi(r.muridMembaca, r.murid))})
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                    {num(r.lulus)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    {num(r.ditolak)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    {(r.murid > 0 ? r.lulus / r.murid : 0).toFixed(2)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-graphite">
                    Tiada sekolah sepadan.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length > papar ? (
        <p className="mt-3">
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => setPapar((n) => n + SEKOLAH_HALAMAN)}
          >
            Papar lagi ({filtered.length - papar} sekolah)
          </button>
        </p>
      ) : null}
    </div>
  );
}

/* ====================== Satu sekolah + senarai murid ====================== */

const MURID_HALAMAN = 50;

function SekolahView({
  header,
  tahun,
  bulan,
  nama,
  kod,
  sekolahBulan,
  murid,
  loading,
  error,
  perluLogin,
  onBack,
}: {
  header: React.ReactNode;
  tahun: number;
  bulan: number;
  nama: string;
  kod: string;
  sekolahBulan: AinsSekolahRow[];
  murid: AinsMuridRow[] | null;
  loading: boolean;
  error: string | null;
  perluLogin: boolean;
  onBack: () => void;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | "baca" | "belum">("");
  const [sort, setSort] = useState<MuridSort>("lulus-desc");
  const [papar, setPapar] = useState(MURID_HALAMAN);
  const [buka, setBuka] = useState<number | null>(null);
  const lebar = useSkrinLebar();

  const semasa = sekolahBulan.find((r) => r.bulan === bulan) ?? null;
  const trend = sekolahBulan.map((r) => ({
    bulan: namaBulan(r.bulan),
    lulus: r.lulus,
    muridMembaca: r.muridMembaca,
    bm: r.bm,
    eng: r.eng,
    lain: r.lain,
  }));

  const baris = useMemo(() => {
    if (!murid) return [];
    const kata = q.trim().toLowerCase();
    const out = murid
      .map((m) => ({ m, cur: m.b.find((x) => x.bulan === bulan) ?? null }))
      .filter(({ m, cur }) => {
        if (kata && !m.nama.toLowerCase().includes(kata)) return false;
        const lulus = cur?.lulus ?? 0;
        if (status === "baca") return lulus > 0;
        if (status === "belum") return lulus === 0;
        return true;
      });
    out.sort((a, b) =>
      sort === "nama"
        ? a.m.nama.localeCompare(b.m.nama, "ms")
        : sort === "lulus-asc"
          ? (a.cur?.lulus ?? 0) - (b.cur?.lulus ?? 0)
          : (b.cur?.lulus ?? 0) - (a.cur?.lulus ?? 0),
    );
    return out;
  }, [murid, q, status, sort, bulan]);

  const bilMembaca = murid
    ? murid.filter((m) => (m.b.find((x) => x.bulan === bulan)?.lulus ?? 0) > 0).length
    : 0;
  /** Muat turun CSV ikut carian + status semasa (data murid sudah ada di pelayar). */
  function muatTurunCsv(semuaBulan: boolean) {
    if (baris.length === 0) return;
    const senarai = baris.map((b) => b.m);
    const csv = semuaBulan ? csvMuridSemuaBulan(senarai) : csvMuridSatuBulan(senarai, bulan);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = namaFailAins([
      kod,
      tahun,
      semuaBulan ? "semua-bulan" : namaBulan(bulan),
      status === "baca" ? "sudah-membaca" : status === "belum" ? "belum-membaca" : null,
      q.trim() ? "carian" : null,
    ]);
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const bilBelum = murid ? murid.length - bilMembaca : 0;
  const peratusBaca = murid ? bahagi(bilMembaca, murid.length) : 0;

  // Skrol hampir ke hujung senarai → paparkan lagi murid secara automatik.
  const hujung = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = hujung.current;
    if (!el || baris.length <= papar) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0]?.isIntersecting) setPapar((n) => n + MURID_HALAMAN);
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [baris.length, papar]);

  return (
    <div className="mt-4">
      <button type="button" className={BACK} onClick={onBack}>
        ← Senarai sekolah
      </button>
      <h3 className="mt-3 text-lg font-semibold tracking-tight">{nama}</h3>
      <p className="mt-1 text-sm text-graphite">
        {kod}
        {semasa?.jenis ? ` · ${semasa.jenis}` : ""} · {namaBulan(bulan)} {tahun}
      </p>
      <div className="mt-3">{header}</div>
      {semasa ? (
        <div className="mt-4">
          <AnalisisKpiTiles
            tiles={[
              { label: "Buku Diluluskan", value: num(semasa.lulus) },
              { label: "Ditolak", value: num(semasa.ditolak) },
              {
                label: `Murid membaca (daripada ${num(semasa.murid)})`,
                value: `${num(semasa.muridMembaca)} · ${pct(bahagi(semasa.muridMembaca, semasa.murid))}`,
              },
              {
                label: "Purata buku seorang murid",
                value: (semasa.murid > 0 ? semasa.lulus / semasa.murid : 0).toFixed(2),
              },
            ]}
          />
        </div>
      ) : null}
      <ChartTabs
        items={[
          {
            id: "lulus",
            label: "Buku & murid",
            node: (
              <AinsLineChart
                title="Buku diluluskan & murid membaca mengikut bulan"
                data={trend}
                series={[
                  { key: "lulus", name: "Diluluskan", color: BIRU },
                  { key: "muridMembaca", name: "Murid membaca", color: DAKWAT },
                ]}
              />
            ),
          },
          {
            id: "bahasa",
            label: "Bahasa",
            node: (
              <AinsLineChart
                title="Bacaan mengikut bahasa"
                data={trend}
                series={[
                  { key: "bm", name: "BM", color: BIRU },
                  { key: "eng", name: "BI", color: DAKWAT },
                  { key: "lain", name: "Lain-lain", color: GRAFIT },
                ]}
              />
            ),
          },
        ]}
      />

      <h4 className="mt-8 text-base font-semibold tracking-tight">Senarai murid</h4>
      {error ? <p className="mt-2 text-sm text-graphite">{error}</p> : null}
      {!murid && perluLogin ? (
        <div className="mt-3 rounded-xl border hairline bg-white px-4 py-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm leading-relaxed text-graphite">
            Senarai murid dilindungi. Log masuk dengan akaun{" "}
            <span className="font-medium text-ink">@moe-dl.edu.my</span> untuk melihat nama dan
            bacaan murid.
          </p>
          <a
            href={direktoriLoginHref("/analisis/ains")}
            className="btn-primary mt-3 shrink-0 sm:mt-0"
          >
            Log masuk MOE-DL
          </a>
        </div>
      ) : !murid ? (
        <p className="mt-2 text-sm text-graphite">
          {loading ? "Memuatkan senarai murid…" : "Tiada data murid."}
        </p>
      ) : (
        <>
          <div className="mt-3">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">
                {bilMembaca} daripada {murid.length} murid membaca
              </span>
              <span className="tabular-nums text-graphite">{pct(peratusBaca)}</span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-cloud"
              role="progressbar"
              aria-label="Peratus murid membaca"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(peratusBaca)}
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${peratusBaca}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-graphite">
              {namaBulan(bulan)} {tahun}
            </p>
          </div>
          <div className="mt-3 sm:max-w-xs">
            <label className="label" htmlFor="ains-murid-susun">
              Susun
            </label>
            <select
              id="ains-murid-susun"
              className="input"
              value={sort}
              onChange={(e) => setSort(e.target.value as MuridSort)}
            >
              <option value="lulus-desc">Diluluskan (tinggi → rendah)</option>
              <option value="lulus-asc">Diluluskan (rendah → tinggi)</option>
              <option value="nama">Nama</option>
            </select>
          </div>
          {/* Carian + status melekat di atas semasa skrol senarai panjang */}
          <div className="sticky top-[var(--ains-sticky-top,4rem)] z-10 -mx-1 mt-3 bg-white px-1 py-2">
            <label className="sr-only" htmlFor="ains-murid-carian">
              Cari murid
            </label>
            <input
              id="ains-murid-carian"
              className="input"
              placeholder="Cari nama murid"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPapar(MURID_HALAMAN);
              }}
            />
            <div role="group" aria-label="Status bacaan" className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  ["", `Semua (${murid.length})`],
                  ["baca", `Sudah (${bilMembaca})`],
                  ["belum", `Belum (${bilBelum})`],
                ] as const
              ).map(([nilai, label]) => (
                <button
                  key={nilai}
                  type="button"
                  aria-pressed={status === nilai}
                  className={`h-10 rounded px-1 text-xs font-semibold ${
                    status === nilai
                      ? "bg-ink text-white"
                      : "border hairline bg-white text-graphite"
                  }`}
                  onClick={() => {
                    setStatus(nilai);
                    setPapar(MURID_HALAMAN);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs text-graphite">{baris.length} murid dipaparkan</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              className="btn-outline btn-sm"
              disabled={baris.length === 0}
              onClick={() => muatTurunCsv(false)}
            >
              CSV {namaBulan(bulan)}
            </button>
            <button
              type="button"
              className="btn-outline btn-sm"
              disabled={baris.length === 0}
              onClick={() => muatTurunCsv(true)}
            >
              CSV semua bulan
            </button>
          </div>
          <p className="mt-1 text-xs text-graphite">
            CSV mengikut carian &amp; status di atas ({baris.length} murid).
          </p>
          {/* Telefon: kad setiap murid tanpa tatal mendatar */}
          {!lebar ? (
            <ul className="card mt-3 divide-y divide-fog/60">
              {baris.slice(0, papar).map(({ m, cur }) => {
                const terbuka = buka === m.id;
                return (
                  <li key={m.id} className="px-4 py-3">
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 text-left"
                      aria-expanded={terbuka}
                      onClick={() => setBuka(terbuka ? null : m.id)}
                    >
                      <span className="font-medium leading-snug text-ink">{m.nama}</span>
                      <span className="shrink-0 text-right">
                        <span className="block text-base font-semibold tabular-nums text-ink">
                          {num(cur?.lulus ?? 0)}
                        </span>
                        <span className="block text-[11px] text-graphite">diluluskan</span>
                      </span>
                    </button>
                    <p className="mt-1 text-xs tabular-nums text-graphite">
                      BM {num(cur?.bm ?? 0)} · BI {num(cur?.eng ?? 0)} · Lain {num(cur?.lain ?? 0)}{" "}
                      · Ditolak {num(cur?.ditolak ?? 0)}
                    </p>
                    {terbuka ? (
                      <div className="mt-3">
                        <p className="text-xs tabular-nums text-graphite">
                          Muka surat {num(cur?.mukaSurat ?? 0)} · Bintang {num(cur?.star ?? 0)}
                        </p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.6px] text-steel">
                          Perkembangan bulanan
                        </p>
                        <AinsLineChart
                          bare
                          height="h-44"
                          data={m.b.map((x) => ({
                            bulan: namaBulan(x.bulan),
                            lulus: x.lulus,
                            ditolak: x.ditolak,
                          }))}
                          series={[
                            { key: "lulus", name: "Diluluskan", color: BIRU },
                            { key: "ditolak", name: "Ditolak", color: GRAFIT },
                          ]}
                        />
                      </div>
                    ) : null}
                  </li>
                );
              })}
              {baris.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-graphite">
                  Tiada murid sepadan.
                </li>
              ) : null}
            </ul>
          ) : (
            <div className="card mt-3 overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-fog text-[11px] font-semibold uppercase tracking-[0.6px] text-steel">
                    <th className="px-4 py-3">Murid</th>
                    <th className="px-4 py-3 text-right">Diluluskan</th>
                    <th className="px-4 py-3 text-right">Ditolak</th>
                    <th className="px-4 py-3 text-right">BM</th>
                    <th className="px-4 py-3 text-right">BI</th>
                    <th className="px-4 py-3 text-right">Lain-lain</th>
                    <th className="px-4 py-3 text-right">Muka surat</th>
                    <th className="px-4 py-3 text-right">Bintang</th>
                  </tr>
                </thead>
                <tbody>
                  {baris.slice(0, papar).flatMap(({ m, cur }) => {
                    const terbuka = buka === m.id;
                    const row = (
                      <tr key={m.id} className="border-b border-fog/60 last:border-0">
                        <td className="min-w-[12rem] px-4 py-2.5">
                          <button
                            type="button"
                            className="text-left font-medium leading-snug text-ink hover:underline"
                            aria-expanded={terbuka}
                            onClick={() => setBuka(terbuka ? null : m.id)}
                          >
                            {m.nama}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                          {num(cur?.lulus ?? 0)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {num(cur?.ditolak ?? 0)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{num(cur?.bm ?? 0)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {num(cur?.eng ?? 0)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {num(cur?.lain ?? 0)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {num(cur?.mukaSurat ?? 0)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {num(cur?.star ?? 0)}
                        </td>
                      </tr>
                    );
                    if (!terbuka) return [row];
                    return [
                      row,
                      <tr key={`${m.id}-trend`} className="border-b border-fog/60 bg-cloud/40">
                        <td colSpan={8} className="px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.6px] text-steel">
                            Perkembangan bulanan
                          </p>
                          <AinsLineChart
                            bare
                            height="h-44"
                            data={m.b.map((x) => ({
                              bulan: namaBulan(x.bulan),
                              lulus: x.lulus,
                              ditolak: x.ditolak,
                            }))}
                            series={[
                              { key: "lulus", name: "Diluluskan", color: BIRU },
                              {
                                key: "ditolak",
                                name: "Ditolak",
                                color: GRAFIT,
                              },
                            ]}
                          />
                        </td>
                      </tr>,
                    ];
                  })}
                  {baris.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-sm text-graphite">
                        Tiada murid sepadan.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
          {baris.length > papar ? (
            <p ref={hujung} className="mt-3">
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => setPapar((n) => n + MURID_HALAMAN)}
              >
                Papar lagi ({baris.length - papar} murid)
              </button>
            </p>
          ) : null}
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-graphite">
            Klik nama murid untuk melihat graf perkembangan bulanan. Senarai ini dilindungi dan
            hanya boleh dilihat dengan akaun MOE-DL.
          </p>
        </>
      )}
    </div>
  );
}
