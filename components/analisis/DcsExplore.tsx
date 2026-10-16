"use client";

import { useMemo, useState } from "react";
import AnalisisKpiTiles from "@/components/analisis/AnalisisKpiTiles";
import TahunSelect from "@/components/analisis/TahunSelect";
import BreakdownBarChart from "@/components/stats/BreakdownBarChart";
import { DCS_TAHAP, type DcsSekolah, type DcsSnapshot } from "@/lib/analisis/dcs-types";
import type { BreakdownPoint } from "@/lib/stats/types";

/** Data DCS 2025 (metrik KV lama daripada Google Sheet) — dikekalkan sebagai pilihan tahun. */
export type DcsBackup = {
  tahun: number;
  bars: BreakdownPoint[];
  updatedText: string;
  footer: string;
  sourceUrl: string;
  sourceLabel: string;
};

type Status = "semua" | "siap" | "belum" | "tiada";

const num = (n: number) => n.toLocaleString("ms-MY");
const pct = (n: number) => `${n.toLocaleString("ms-MY", { maximumFractionDigits: 1 })}%`;
const bahagi = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const BULAN = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogos", "Sep", "Okt", "Nov", "Dis"];
const tarikh = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
};

function statusSekolah(s: DcsSekolah): Exclude<Status, "semua"> {
  if (s.muridJumlah === 0) return "tiada";
  return s.muridSiap >= s.muridJumlah ? "siap" : "belum";
}

function skorTeks(s: DcsSekolah): string {
  const bahagian = [
    s.skorT6 != null ? `T6 ${s.skorT6}` : "",
    s.skorT3 != null ? `T3 ${s.skorT3}` : "",
    s.skorT5 != null ? `T5 ${s.skorT5}` : "",
  ].filter(Boolean);
  return bahagian.length ? bahagian.join(" · ") : "—";
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-fog" aria-hidden>
      <div className="h-full rounded-full bg-ink" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export default function DcsExplore({
  snapshots,
  backup,
}: {
  snapshots: DcsSnapshot[];
  backup: DcsBackup;
}) {
  const years = useMemo(
    () => [...new Set([...snapshots.map((s) => s.tahun), backup.tahun])].sort((a, b) => b - a),
    [snapshots, backup.tahun],
  );
  const [tahun, setTahun] = useState<number>(years[0] ?? backup.tahun);
  const snap = snapshots.find((s) => s.tahun === tahun) ?? null;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <TahunSelect year={tahun} years={years} onChange={setTahun} />
        {snap ? (
          <p className="text-sm text-graphite">
            Dibaca {tarikh(snap.capturedOn)} · sumber{" "}
            <a href={snap.sumber} target="_blank" rel="noopener noreferrer" className="link-blue">
              dcs.moe.edu.my
            </a>
          </p>
        ) : null}
      </div>
      {snap ? <DcsTahun snap={snap} /> : <DcsSandaran backup={backup} />}
    </div>
  );
}

function DcsSandaran({ backup }: { backup: DcsBackup }) {
  return (
    <>
      <p className="mt-3 text-sm text-graphite">
        Data {backup.tahun} — TOV, KPI dan pencapaian daerah sahaja, tiada pecahan PKG atau sekolah.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <BreakdownBarChart
          title={`TOV · KPI · Pencapaian ${backup.tahun} (%)`}
          data={backup.bars}
          seriesName="%"
        />
        <div className="card p-5 text-sm leading-relaxed text-graphite">
          {backup.updatedText ? (
            <p>
              <span className="font-semibold text-ink">Kemas kini: </span>
              {backup.updatedText}
            </p>
          ) : null}
          {backup.footer ? <p className="mt-2 whitespace-pre-line">{backup.footer}</p> : null}
          {backup.sourceUrl ? (
            <a
              href={backup.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-blue mt-3 inline-block text-sm"
            >
              {backup.sourceLabel || "Buka sumber DCS"}
            </a>
          ) : null}
        </div>
      </div>
    </>
  );
}

function DcsTahun({ snap }: { snap: DcsSnapshot }) {
  const [pkgPilih, setPkgPilih] = useState<string>("");
  const [status, setStatus] = useState<Status>("semua");

  const muridSiap = snap.pkg.reduce((a, p) => a + p.muridSiap, 0);
  const muridJumlah = snap.pkg.reduce((a, p) => a + p.muridJumlah, 0);
  const sekolahSiap = snap.pkg.reduce((a, p) => a + p.sekolahSiap, 0);
  const sekolahJumlah = snap.pkg.reduce((a, p) => a + p.sekolahJumlah, 0);
  const terbaik = [...snap.pkg].sort((a, b) => a.rankPerak - b.rankPerak)[0];
  const pkgUrut = [...snap.pkg].sort((a, b) => a.rankPerak - b.rankPerak);

  const sekolah = useMemo(() => {
    return snap.sekolah
      .filter((s) => (!pkgPilih || s.pkg === pkgPilih) && (status === "semua" || statusSekolah(s) === status))
      .sort((a, b) => {
        const ta = a.muridJumlah === 0 ? -1 : bahagi(a.muridSiap, a.muridJumlah);
        const tb = b.muridJumlah === 0 ? -1 : bahagi(b.muridSiap, b.muridJumlah);
        return tb - ta || b.muridJumlah - a.muridJumlah || a.kod.localeCompare(b.kod);
      });
  }, [snap.sekolah, pkgPilih, status]);

  const bilStatus = (st: Exclude<Status, "semua">) =>
    snap.sekolah.filter((s) => (!pkgPilih || s.pkg === pkgPilih) && statusSekolah(s) === st).length;

  return (
    <>
      <div className="mt-4">
        <AnalisisKpiTiles
          tiles={[
            { label: "Murid selesai menjawab", value: `${num(muridSiap)} / ${num(muridJumlah)}` },
            { label: "Peratus selesai (daerah)", value: pct(bahagi(muridSiap, muridJumlah)) },
            { label: "Sekolah siap (semua kelas)", value: `${num(sekolahSiap)} / ${num(sekolahJumlah)}` },
            {
              label: `Kedudukan terbaik PKG Manjung (daripada ${snap.jumlahPkgPerak} PKG Perak)`,
              value: terbaik ? `#${terbaik.rankPerak} ${terbaik.pkg}` : "",
            },
          ]}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="font-semibold">Kedudukan PKG dalam Perak</p>
          <p className="mt-1 text-xs text-graphite">Peratus murid selesai menjawab · kedudukan daripada {snap.jumlahPkgPerak} PKG</p>
          <ul className="mt-4 space-y-4">
            {pkgUrut.map((p) => (
              <li key={p.pkg}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold">
                    <span className="tabular-nums text-graphite">#{p.rankPerak}</span> PKG {p.pkg}
                  </span>
                  <span className="font-semibold tabular-nums">{pct(p.pct)}</span>
                </div>
                <div className="mt-1.5">
                  <Bar value={p.pct} />
                </div>
                <p className="mt-1 text-xs text-graphite tabular-nums">
                  Murid {num(p.muridSiap)}/{num(p.muridJumlah)} · Sekolah siap {p.sekolahSiap}/{p.sekolahJumlah}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <p className="font-semibold">Peratus murid selesai ikut tahap</p>
          <p className="mt-1 text-xs text-graphite">Angka dalam kurungan = bilangan murid selesai</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[22rem] text-sm">
              <thead>
                <tr className="border-b border-fog text-left text-xs text-graphite">
                  <th className="py-2 pr-2 font-semibold">PKG</th>
                  {DCS_TAHAP.map((t) => (
                    <th key={t.key} className="px-2 py-2 text-right font-semibold">
                      {t.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pkgUrut.map((p) => (
                  <tr key={p.pkg} className="border-b border-fog last:border-0">
                    <td className="py-2 pr-2">{p.pkg}</td>
                    {DCS_TAHAP.map((t) => {
                      const v = p.tahap[t.key];
                      return (
                        <td key={t.key} className="px-2 py-2 text-right tabular-nums">
                          {v ? (
                            <>
                              <span className="font-semibold">{v.pct}%</span>{" "}
                              <span className="text-xs text-graphite">({num(v.bil)})</span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-t border-steel">
                  <td className="py-2 pr-2 font-semibold">Murid selesai</td>
                  {DCS_TAHAP.map((t) => (
                    <td key={t.key} className="px-2 py-2 text-right font-semibold tabular-nums">
                      {num(snap.pkg.reduce((a, p) => a + (p.tahap[t.key]?.bil ?? 0), 0))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-semibold">Pencapaian sekolah</p>
            <p className="mt-1 text-xs text-graphite">
              {sekolah.length} sekolah · murid 100% selesai {bilStatus("siap")} · belum {bilStatus("belum")} · tiada murid
              didaftarkan {bilStatus("tiada")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="input h-9 w-auto px-2 py-0 text-sm"
              value={pkgPilih}
              onChange={(e) => setPkgPilih(e.target.value)}
              aria-label="Tapis PKG"
            >
              <option value="">Semua PKG</option>
              {pkgUrut.map((p) => (
                <option key={p.pkg} value={p.pkg}>
                  PKG {p.pkg}
                </option>
              ))}
            </select>
            <select
              className="input h-9 w-auto px-2 py-0 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              aria-label="Tapis status"
            >
              <option value="semua">Semua status</option>
              <option value="siap">Murid 100% selesai</option>
              <option value="belum">Belum 100%</option>
              <option value="tiada">Tiada murid didaftarkan</option>
            </select>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-fog text-left text-xs text-graphite">
                <th className="py-2 pr-2 font-semibold">Sekolah</th>
                <th className="px-2 py-2 font-semibold">PKG</th>
                <th className="px-2 py-2 text-right font-semibold">Kelas siap</th>
                <th className="w-44 px-2 py-2 font-semibold">Murid selesai</th>
                <th className="py-2 pl-2 text-right font-semibold">Skor purata</th>
              </tr>
            </thead>
            <tbody>
              {sekolah.map((s) => {
                const p = bahagi(s.muridSiap, s.muridJumlah);
                return (
                  <tr key={s.kod} className="border-b border-fog last:border-0">
                    <td className="py-2 pr-2">
                      <span className="font-semibold">{s.nama}</span>
                      <span className="ml-1.5 text-xs text-graphite">{s.kod}</span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-graphite">{s.pkg}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {s.kelasJumlah > 0 ? `${s.kelasSiap}/${s.kelasJumlah}` : "—"}
                    </td>
                    <td className="px-2 py-2">
                      {s.muridJumlah > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Bar value={p} />
                          </div>
                          <span className="w-20 shrink-0 text-right text-xs tabular-nums">
                            {s.muridSiap}/{s.muridJumlah}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-graphite">Tiada murid didaftarkan</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-2 pl-2 text-right text-xs tabular-nums">{skorTeks(s)}</td>
                  </tr>
                );
              })}
              {sekolah.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-graphite">
                    Tiada sekolah sepadan.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-graphite">
          Skor purata sekolah mengikut tahap (T6 = Tahun 6, T3/T5 = Tingkatan 3/5) seperti dalam senarai Top Schools
          DCS; skor 0 bermaksud belum ada murid selesai.
        </p>
      </div>
    </>
  );
}
