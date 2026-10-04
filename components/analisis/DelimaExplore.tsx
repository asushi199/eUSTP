"use client";

import { useMemo, useState } from "react";
import KpiGroups from "@/components/analisis/KpiGroups";
import {
  loadDelimaHistory,
  loadDelimaSchoolDetail,
  loadDelimaSchools,
  loadDelimaSnapshotSchools,
} from "@/lib/actions/delima-public";
import type { DelimaSnapshotPage, DelimaSnapshotRow } from "@/lib/analisis/delima-snapshot";
import type {
  DelimaLivePop,
  DelimaSchoolDetail,
  DelimaSchoolList,
  DelimaSchoolPop,
  DelimaSchoolRow,
} from "@/lib/analisis/delima-live";


const BULAN = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
function bulanLabel(period: string): string {
  const [y, m] = period.split("-");
  return `${BULAN[Number(m) - 1] ?? period} ${y}`;
}

export type DelimaExploreLayer = "overview" | "schools" | "school" | "history" | "snapshot";

const num = (n: number) => n.toLocaleString("ms-MY");
const pct = (n: number) => `${n.toLocaleString("ms-MY", { maximumFractionDigits: 1 })}%`;

function TahapBadge({ pop }: { pop: DelimaSchoolPop | null }) {
  if (!pop) return <span className="text-xs text-graphite">—</span>;
  return (
    <span className="status-badge shrink-0">
      <span className={`status-dot ${pop.tahap === "Tinggi" ? "bg-primary" : "bg-graphite"}`} />
      {pop.tahap}
    </span>
  );
}

function PopCell({ pop }: { pop: DelimaSchoolPop | null }) {
  if (!pop) return <span className="text-graphite">—</span>;
  return (
    <>
      <span className="font-medium">{pct(pop.peratus)}</span>
      <span className="ml-1 text-xs text-graphite">
        {num(pop.aktif)}/{num(pop.jumlah)}
      </span>
    </>
  );
}

/** Baris kecil DELIMa 3.0 di bawah angka 2.0; tiada apa-apa jika sumber 3.0 tidak ada. */
function V30Line({ pop }: { pop: DelimaLivePop | null | undefined }) {
  if (pop === undefined) return null;
  return (
    <p className="mt-0.5 text-xs font-normal text-graphite">
      3.0: {pop ? `${pct(pop.peratus)} · ${num(pop.aktif)}/${num(pop.jumlah)}` : "—"}
    </p>
  );
}

type Kumpulan = "guru" | "murid";
type Sort = "kod" | "nama" | "peratus";
type Tahap = "all" | "Tinggi" | "Sederhana" | "Rendah";

function SchoolTable({
  schools,
  onSelect,
}: {
  schools: DelimaSchoolRow[];
  onSelect: (row: DelimaSchoolRow) => void;
}) {
  const [query, setQuery] = useState("");
  const [tahap, setTahap] = useState<Tahap>("all");
  const [sort, setSort] = useState<Sort>("kod");
  const [kump, setKump] = useState<Kumpulan>("guru");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = schools.filter((r) => {
      if (tahap !== "all" && r[kump]?.tahap !== tahap) return false;
      return !q || `${r.kod} ${r.nama}`.toLowerCase().includes(q);
    });
    if (sort === "kod") return rows;
    if (sort === "nama") return [...rows].sort((a, b) => a.nama.localeCompare(b.nama, "ms"));
    return [...rows].sort((a, b) => (a[kump]?.peratus ?? -1) - (b[kump]?.peratus ?? -1));
  }, [kump, query, schools, sort, tahap]);

  const count = (t: Exclude<Tahap, "all">) =>
    schools.filter((r) => r[kump]?.tahap === t).length;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_10rem_11rem] sm:items-end">
        <div>
          <label className="label" htmlFor="delima-carian">
            Cari sekolah
          </label>
          <input
            id="delima-carian"
            className="input"
            placeholder="Kod atau nama sekolah"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="delima-kump">
            Kumpulan
          </label>
          <select
            id="delima-kump"
            className="input"
            value={kump}
            onChange={(e) => setKump(e.target.value as Kumpulan)}
          >
            <option value="guru">Guru</option>
            <option value="murid">Murid</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="delima-tahap">
            Tahap aktif
          </label>
          <select
            id="delima-tahap"
            className="input"
            value={tahap}
            onChange={(e) => setTahap(e.target.value as Tahap)}
          >
            <option value="all">Semua ({schools.length})</option>
            <option value="Tinggi">Tinggi ({count("Tinggi")})</option>
            <option value="Sederhana">Sederhana ({count("Sederhana")})</option>
            <option value="Rendah">Rendah ({count("Rendah")})</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="delima-susun">
            Susun
          </label>
          <select
            id="delima-susun"
            className="input"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            <option value="kod">Kod sekolah</option>
            <option value="nama">Nama</option>
            <option value="peratus">% aktif (rendah → tinggi)</option>
          </select>
        </div>
      </div>
      <p className="mt-3 text-xs text-graphite">{filtered.length} sekolah dipaparkan</p>

      <ul className="mt-3 space-y-3 sm:hidden">
        {filtered.length === 0 ? (
          <li className="card p-6 text-center text-sm text-graphite">Tiada sekolah sepadan.</li>
        ) : (
          filtered.map((row) => (
            <li key={row.kod} className="card p-4">
              <button
                type="button"
                className="block w-full text-left font-medium leading-snug text-ink hover:underline"
                onClick={() => onSelect(row)}
              >
                {row.nama}
              </button>
              <p className="mt-0.5 text-xs text-graphite">{row.kod}</p>
              <dl className="mt-3 space-y-2 border-t border-fog pt-3 text-sm tabular-nums">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-graphite">Guru</dt>
                  <dd className="text-right">
                    <span className="flex items-center justify-end gap-2">
                      <PopCell pop={row.guru} />
                      <TahapBadge pop={row.guru} />
                    </span>
                    <V30Line pop={row.guru30} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-graphite">Murid</dt>
                  <dd className="text-right">
                    <span className="flex items-center justify-end gap-2">
                      <PopCell pop={row.murid} />
                      <TahapBadge pop={row.murid} />
                    </span>
                    <V30Line pop={row.murid30} />
                  </dd>
                </div>
              </dl>
            </li>
          ))
        )}
      </ul>

      <div className="card mt-3 hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-fog text-[11px] font-semibold uppercase tracking-[0.6px] text-steel">
              <th className="px-4 py-3">Sekolah</th>
              <th className="px-4 py-3">Guru aktif (2.0 / 3.0)</th>
              <th className="px-4 py-3">Murid aktif (2.0 / 3.0)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.kod} className="border-b border-fog/60 last:border-0">
                <td className="min-w-[12rem] px-4 py-3">
                  <button
                    type="button"
                    className="block w-full text-left font-medium leading-snug text-ink hover:underline"
                    onClick={() => onSelect(row)}
                  >
                    {row.nama}
                  </button>
                  <p className="mt-0.5 text-xs text-graphite">{row.kod}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                  <div className="flex items-center gap-2">
                    <PopCell pop={row.guru} />
                    <TahapBadge pop={row.guru} />
                  </div>
                  <V30Line pop={row.guru30} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                  <div className="flex items-center gap-2">
                    <PopCell pop={row.murid} />
                    <TahapBadge pop={row.murid} />
                  </div>
                  <V30Line pop={row.murid30} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-graphite">
                  Tiada sekolah sepadan.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Kad Guru/Murid satu sekolah: DELIMa 2.0 dan 3.0 sebelah-menyebelah (bil. aktif dalam label). */
function versiGroup(
  title: string,
  v20: DelimaSchoolPop | null,
  v30: DelimaLivePop | null | undefined,
) {
  const bil = (p: DelimaLivePop) => `${num(p.aktif)} / ${num(p.jumlah)}`;
  const stats = [
    v20 ? { label: `2.0 · ${bil(v20)}`, value: pct(v20.peratus) } : null,
    v30 ? { label: `3.0 · ${bil(v30)}`, value: pct(v30.peratus) } : null,
    v20 ? { label: "Tahap 2.0", value: v20.tahap } : null,
  ].filter((x): x is { label: string; value: string } => x != null);
  return stats.length > 0 ? { title: `${title} · Aktif`, stats } : null;
}

function SchoolDetail({ detail }: { detail: DelimaSchoolDetail }) {
  const { school, kadMurid } = detail;
  const groups = [
    versiGroup("Guru", school.guru, school.guru30),
    versiGroup("Murid", school.murid, school.murid30),
    kadMurid
      ? {
          title: `Jumlah Aktif Murid · DELIMa 2.0 + 3.0 · Sasaran ${kadMurid.sasaran ?? "—"}%`,
          wide: true,
          stats: [
            { label: kadMurid.capai ? "Capai" : "Belum capai", value: pct(kadMurid.peratus) },
            { label: "Bil. aktif", value: `${num(kadMurid.aktif)} / ${num(kadMurid.jumlah)}` },
            { label: "Kemas kini", value: kadMurid.kemasKini },
          ],
        }
      : null,
  ].filter((g): g is NonNullable<typeof g> => g != null);

  return (
    <>
      <h3 className="mt-3 text-lg font-semibold tracking-tight">{school.nama}</h3>
      <p className="mt-1 text-sm text-graphite">
        {school.kod} · DELIMa 2.0 · {detail.tempoh}
        {school.guru30 || school.murid30 ? " · DELIMa 3.0: sumber Google Sheet DELIMa Perak" : ""}
      </p>
      <div className="mt-4">
        <KpiGroups groups={groups} />
      </div>
      <p className="mt-3 text-xs text-graphite">
        Sumber hanya menyediakan bilangan pengguna aktif setiap sekolah; senarai nama guru atau murid
        tidak dipaparkan.
      </p>
    </>
  );
}

/** undefined (bukan null) bila snapshot tiada 3.0 — V30Line tidak memaparkan apa-apa. */
function histV30(
  aktif: number | null,
  jumlah: number | null,
  pct: number | null,
): DelimaLivePop | undefined {
  return aktif == null || jumlah == null || pct == null
    ? undefined
    : { aktif, jumlah, peratus: pct };
}

function HistoryTable({
  data,
  loading,
  onPage,
  onSelect,
}: {
  data: DelimaSnapshotPage;
  loading: boolean;
  onPage: (page: number) => void;
  onSelect: (row: DelimaSnapshotRow) => void;
}) {
  const dari = (data.page - 1) * data.pageSize + 1;
  const hingga = dari + data.rows.length - 1;
  return (
    <div className={loading ? "opacity-60" : ""}>
      <ul className="space-y-3 sm:hidden">
        {data.rows.map((r) => (
          <li key={r.id} className="card p-4">
            <button
              type="button"
              className="block w-full text-left font-medium text-ink hover:underline"
              onClick={() => onSelect(r)}
            >
              {bulanLabel(r.period)}
            </button>
            <p className="mt-0.5 text-xs text-graphite">{r.tempoh}</p>
            <dl className="mt-3 space-y-1 border-t border-fog pt-3 text-sm tabular-nums">
              <div className="flex justify-between">
                <dt className="text-graphite">Guru aktif</dt>
                <dd>
                  {pct(r.guruPct)}{" "}
                  <span className="text-xs text-graphite">
                    {num(r.guruAktif)}/{num(r.guruJumlah)}
                  </span>
                  <V30Line pop={histV30(r.guru30Aktif, r.guru30Jumlah, r.guru30Pct)} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-graphite">Murid aktif</dt>
                <dd>
                  {pct(r.muridPct)}{" "}
                  <span className="text-xs text-graphite">
                    {num(r.muridAktif)}/{num(r.muridJumlah)}
                  </span>
                  <V30Line pop={histV30(r.murid30Aktif, r.murid30Jumlah, r.murid30Pct)} />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="card hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-fog text-[11px] font-semibold uppercase tracking-[0.6px] text-steel">
              <th className="px-4 py-3">Bulan</th>
              <th className="px-4 py-3">Guru aktif</th>
              <th className="px-4 py-3">Murid aktif</th>
              <th className="px-4 py-3 text-right">Sekolah capai</th>
              <th className="px-4 py-3">Disimpan</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.id} className="border-b border-fog/60 last:border-0">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="font-medium text-ink hover:underline"
                    onClick={() => onSelect(r)}
                  >
                    {bulanLabel(r.period)}
                  </button>
                  <p className="mt-0.5 text-xs text-graphite">{r.tempoh}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                  {pct(r.guruPct)}{" "}
                  <span className="text-xs text-graphite">
                    {num(r.guruAktif)}/{num(r.guruJumlah)}
                  </span>
                  <V30Line pop={histV30(r.guru30Aktif, r.guru30Jumlah, r.guru30Pct)} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                  {pct(r.muridPct)}{" "}
                  <span className="text-xs text-graphite">
                    {num(r.muridAktif)}/{num(r.muridJumlah)}
                  </span>
                  <V30Line pop={histV30(r.murid30Aktif, r.murid30Jumlah, r.murid30Pct)} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {r.bilCapai != null ? `${r.bilCapai} / ${r.bilSekolah ?? "—"}` : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-graphite">{r.capturedOn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-xs text-graphite">
          {dari}–{hingga} daripada {data.total} snapshot
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-outline btn-sm"
            disabled={data.page <= 1 || loading}
            onClick={() => onPage(data.page - 1)}
          >
            ← Sebelum
          </button>
          <span className="tabular-nums text-graphite">
            {data.page} / {data.pageCount}
          </span>
          <button
            type="button"
            className="btn-outline btn-sm"
            disabled={data.page >= data.pageCount || loading}
            onClick={() => onPage(data.page + 1)}
          >
            Seterusnya →
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Terokai DELIMa dalam kad (sama corak dengan OptikExplore):
 * ringkasan → senarai sekolah → butiran sekolah, serta sejarah snapshot bulanan
 * (berhalaman) → sekolah pada bulan itu, semuanya tanpa keluar halaman.
 */
export default function DelimaExplore({
  children,
  onLayerChange,
}: {
  children?: React.ReactNode;
  onLayerChange?: (layer: DelimaExploreLayer) => void;
}) {
  const [layer, setLayer] = useState<DelimaExploreLayer>("overview");
  const [list, setList] = useState<DelimaSchoolList | null>(null);
  const [detail, setDetail] = useState<DelimaSchoolDetail | null>(null);
  const [history, setHistory] = useState<DelimaSnapshotPage | null>(null);
  const [snapshot, setSnapshot] = useState<{
    label: string;
    tempoh: string;
    schools: DelimaSchoolRow[];
  } | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Lapisan asal butiran sekolah — supaya butang kembali betul. */
  const [detailFrom, setDetailFrom] = useState<"schools" | "snapshot">("schools");

  function go(next: DelimaExploreLayer) {
    setLayer(next);
    onLayerChange?.(next);
  }

  async function openSchools() {
    go("schools");
    if (list) return;
    setLoadingList(true);
    setError(null);
    try {
      const data = await loadDelimaSchools();
      if (data) setList(data);
      else setError("Senarai sekolah tidak dapat dimuatkan daripada sumber DELIMa.");
    } catch {
      setError("Senarai sekolah tidak dapat dimuatkan.");
    } finally {
      setLoadingList(false);
    }
  }

  async function loadHistoryPage(page: number) {
    setLoadingHistory(true);
    setError(null);
    try {
      setHistory(await loadDelimaHistory(page));
    } catch {
      setError("Sejarah snapshot tidak dapat dimuatkan.");
    } finally {
      setLoadingHistory(false);
    }
  }

  async function openHistory() {
    go("history");
    if (!history) await loadHistoryPage(1);
  }

  async function openSnapshot(row: DelimaSnapshotRow) {
    go("snapshot");
    setSnapshot(null);
    setLoadingSnapshot(true);
    setError(null);
    try {
      const data = await loadDelimaSnapshotSchools(row.id);
      if (data) {
        setSnapshot({ label: bulanLabel(data.period), tempoh: data.tempoh, schools: data.schools });
      } else {
        setError("Snapshot tidak dijumpai.");
      }
    } catch {
      setError("Snapshot tidak dapat dimuatkan.");
    } finally {
      setLoadingSnapshot(false);
    }
  }

  async function openSchool(row: DelimaSchoolRow) {
    setDetailFrom("schools");
    go("school");
    setDetail(null);
    setLoadingDetail(true);
    setError(null);
    try {
      const data = await loadDelimaSchoolDetail(row.kod);
      if (data) setDetail(data);
      else setError("Butiran sekolah tidak dapat dimuatkan.");
    } catch {
      setError("Butiran sekolah tidak dapat dimuatkan.");
    } finally {
      setLoadingDetail(false);
    }
  }

  /** Sekolah dalam snapshot lama: data sudah ada, tiada ambilan tambahan. */
  function openSnapshotSchool(row: DelimaSchoolRow) {
    setDetailFrom("snapshot");
    setDetail({
      school: row,
      kadMurid: null,
      tempoh: `${snapshot?.label ?? ""} · ${snapshot?.tempoh ?? ""}`,
      sumberUrl: "",
    });
    setError(null);
    go("school");
  }

  const back = "text-sm text-graphite hover:text-ink";

  if (layer === "school") {
    return (
      <div className="mt-4">
        <button
          type="button"
          className={back}
          onClick={() => {
            setError(null);
            go(detailFrom);
          }}
        >
          {detailFrom === "snapshot" ? "← Snapshot" : "← Senarai sekolah"}
        </button>
        {detail ? (
          <SchoolDetail detail={detail} />
        ) : loadingDetail ? (
          <p className="mt-4 text-sm text-graphite">Memuatkan butiran sekolah…</p>
        ) : (
          <p className="mt-4 text-sm text-graphite">{error ?? "Tiada data."}</p>
        )}
      </div>
    );
  }

  if (layer === "history") {
    return (
      <div className="mt-4">
        <button type="button" className={back} onClick={() => go("overview")}>
          ← Carta
        </button>
        <h3 className="mt-3 text-lg font-semibold tracking-tight">Sejarah snapshot DELIMa</h3>
        <p className="mt-1 text-sm text-graphite">
          Satu snapshot setiap bulan, disimpan automatik. Angka utama ialah DELIMa 2.0; DELIMa 3.0 (jika ada) di bawahnya. Klik bulan untuk melihat sekolah.
        </p>
        {error ? <p className="mt-3 text-sm text-graphite">{error}</p> : null}
        {history && history.total > 0 ? (
          <div className="mt-4">
            <HistoryTable
              data={history}
              loading={loadingHistory}
              onPage={(p) => void loadHistoryPage(p)}
              onSelect={(r) => void openSnapshot(r)}
            />
          </div>
        ) : loadingHistory || !history ? (
          <p className="mt-4 text-sm text-graphite">Memuatkan sejarah…</p>
        ) : (
          <p className="mt-4 text-sm text-graphite">Belum ada snapshot.</p>
        )}
      </div>
    );
  }

  if (layer === "snapshot") {
    return (
      <div className="mt-4">
        <button type="button" className={back} onClick={() => go("history")}>
          ← Sejarah
        </button>
        {snapshot ? (
          <>
            <h3 className="mt-3 text-lg font-semibold tracking-tight">
              DELIMa mengikut sekolah · {snapshot.label}
            </h3>
            <p className="mt-1 text-sm text-graphite">
              {snapshot.schools.length} sekolah · DELIMa 2.0 · {snapshot.tempoh}
            </p>
            <div className="mt-4">
              <SchoolTable schools={snapshot.schools} onSelect={openSnapshotSchool} />
            </div>
          </>
        ) : loadingSnapshot ? (
          <p className="mt-4 text-sm text-graphite">Memuatkan snapshot…</p>
        ) : (
          <p className="mt-4 text-sm text-graphite">{error ?? "Tiada data."}</p>
        )}
      </div>
    );
  }

  if (layer === "schools") {
    return (
      <div className="mt-4">
        <button type="button" className={back} onClick={() => go("overview")}>
          ← Carta
        </button>
        <h3 className="mt-3 text-lg font-semibold tracking-tight">DELIMa mengikut sekolah</h3>
        {list ? (
          <p className="mt-1 text-sm text-graphite">
            {list.schools.length} sekolah · DELIMa 2.0 · {list.tempoh}
            {list.schools.some((s) => s.guru30 || s.murid30) ? " · DELIMa 3.0 ditunjuk di bawah angka 2.0" : ""}
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-graphite">{error}</p> : null}
        {loadingList && !list ? (
          <p className="mt-4 text-sm text-graphite">Memuatkan senarai sekolah…</p>
        ) : list ? (
          <div className="mt-4">
            <SchoolTable schools={list.schools} onSelect={(row) => void openSchool(row)} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {children}
      <p className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-outline btn-sm" onClick={() => void openSchools()}>
          Lihat senarai sekolah
        </button>
        <button type="button" className="btn-outline btn-sm" onClick={() => void openHistory()}>
          Sejarah snapshot
        </button>
      </p>
    </>
  );
}
