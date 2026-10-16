"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import TahunSelect from "@/components/analisis/TahunSelect";
import TarikhAkhirBanner from "@/components/analisis/TarikhAkhirBanner";
import BreakdownBarChart from "@/components/stats/BreakdownBarChart";
import { DCS_TAHAP, DCS_TARIKH_AKHIR, type DcsBackup, type DcsSekolah, type DcsSnapshot } from "@/lib/analisis/dcs-types";

export type { DcsBackup };

type Status = "semua" | "selesai" | "belum";

const num = (n: number) => n.toLocaleString("ms-MY");
const pct = (n: number) => `${n.toLocaleString("ms-MY", { maximumFractionDigits: 1 })}%`;
const bahagi = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const BULAN = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogos", "Sep", "Okt", "Nov", "Dis"];
const tarikh = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
};

/** Takrif DCS "sekolah siap": ada murid didaftarkan dan semuanya selesai menjawab. */
function statusSekolah(s: DcsSekolah): Exclude<Status, "semua"> {
  return s.muridJumlah > 0 && s.muridSiap >= s.muridJumlah ? "selesai" : "belum";
}

const STATUS_PILIHAN: { id: Status; label: string; pendek: string }[] = [
  { id: "semua", label: "Semua", pendek: "Semua" },
  { id: "selesai", label: "Selesai", pendek: "Selesai" },
  { id: "belum", label: "Belum selesai", pendek: "Belum" },
];

const TAHAP_PENDEK: Record<string, string> = { t6: "T6", t3: "T3", t5: "T5" };
const SAIZ_HALAMAN = 20;
/** Grid jadual tahap: lajur PKG fleksibel + 3 lajur tetap (muat telefon tanpa tatal mendatar). */
const GRID_TAHAP = "grid grid-cols-[minmax(0,1fr)_repeat(3,3.75rem)] gap-x-1 sm:grid-cols-[minmax(0,1fr)_repeat(3,5.5rem)]";

/** sm (≥640px) = jadual; telefon = senarai kad (tiada tatal mendatar). */
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

function StatusLabel({ s }: { s: DcsSekolah }) {
  return statusSekolah(s) === "selesai" ? (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-ink">
      <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden />
      Selesai
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-graphite">
      <span className="h-1.5 w-1.5 rounded-full border border-graphite" aria-hidden />
      Belum selesai
    </span>
  );
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
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <TahunSelect year={tahun} years={years} onChange={setTahun} />
        {snap ? (
          <p className="text-xs text-graphite sm:text-sm">
            Dibaca {tarikh(snap.capturedOn)} ·{" "}
            <a href={snap.sumber} target="_blank" rel="noopener noreferrer" className="link-blue">
              dcs.moe.edu.my
            </a>
          </p>
        ) : null}
      </div>
      {snap && DCS_TARIKH_AKHIR[snap.tahun] ? <TarikhAkhirBanner iso={DCS_TARIKH_AKHIR[snap.tahun]} teks="Semua murid mesti selesai menjawab" /> : null}
      {snap ? <DcsTahun key={snap.tahun} snap={snap} /> : <DcsSandaran backup={backup} />}
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
        <div className="card p-4 text-sm leading-relaxed text-graphite sm:p-5">
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
  const lebar = useSkrinLebar();
  const [pkgPilih, setPkgPilih] = useState<string>("");
  const [status, setStatus] = useState<Status>("semua");
  const [cari, setCari] = useState("");
  const [had, setHad] = useState(SAIZ_HALAMAN);

  const muridSiap = snap.pkg.reduce((a, p) => a + p.muridSiap, 0);
  const muridJumlah = snap.pkg.reduce((a, p) => a + p.muridJumlah, 0);
  const sekolahSiap = snap.pkg.reduce((a, p) => a + p.sekolahSiap, 0);
  const sekolahJumlah = snap.pkg.reduce((a, p) => a + p.sekolahJumlah, 0);
  const pkgUrut = [...snap.pkg].sort((a, b) => a.rankPerak - b.rankPerak);
  const terbaik = pkgUrut[0];

  const dalamPkg = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return snap.sekolah.filter(
      (s) =>
        (!pkgPilih || s.pkg === pkgPilih) &&
        (!q || s.nama.toLowerCase().includes(q) || s.kod.toLowerCase().includes(q)),
    );
  }, [snap.sekolah, pkgPilih, cari]);

  const sekolah = useMemo(() => {
    return dalamPkg
      .filter((s) => status === "semua" || statusSekolah(s) === status)
      .sort((a, b) => {
        const ta = a.muridJumlah === 0 ? -1 : bahagi(a.muridSiap, a.muridJumlah);
        const tb = b.muridJumlah === 0 ? -1 : bahagi(b.muridSiap, b.muridJumlah);
        return tb - ta || b.muridJumlah - a.muridJumlah || a.kod.localeCompare(b.kod);
      });
  }, [dalamPkg, status]);
  const dipapar = sekolah.slice(0, had);

  const bilStatus = (st: Status) =>
    st === "semua" ? dalamPkg.length : dalamPkg.filter((s) => statusSekolah(s) === st).length;
  const belumDaftar = dalamPkg.filter((s) => s.muridJumlah === 0).length;
  /** Tukar tapisan → mula semula dari halaman pertama senarai. */
  const tapis = (fn: () => void) => {
    fn();
    setHad(SAIZ_HALAMAN);
  };

  const tiles = [
    { label: "Murid selesai", value: `${num(muridSiap)} / ${num(muridJumlah)}` },
    { label: "Peratus selesai daerah", value: pct(bahagi(muridSiap, muridJumlah)) },
    { label: "Sekolah selesai", value: `${num(sekolahSiap)} / ${num(sekolahJumlah)}` },
    {
      label: `Kedudukan terbaik (${snap.jumlahPkgPerak} PKG Perak)`,
      value: terbaik ? `#${terbaik.rankPerak} ${terbaik.pkg}` : "—",
    },
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
        <div className="card p-4 sm:p-5">
          <p className="font-semibold">Kedudukan PKG dalam Perak</p>
          <p className="mt-1 text-xs text-graphite">% murid selesai · kedudukan daripada {snap.jumlahPkgPerak} PKG</p>
          <ul className="mt-4 space-y-3.5">
            {pkgUrut.map((p) => (
              <li key={p.pkg}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-semibold">
                    <span className="tabular-nums text-graphite">#{p.rankPerak}</span> {p.pkg}
                  </span>
                  <span className="font-semibold tabular-nums">{pct(p.pct)}</span>
                </div>
                <div className="mt-1.5">
                  <Bar value={p.pct} />
                </div>
                <p className="mt-1 text-xs text-graphite tabular-nums">
                  Murid {num(p.muridSiap)}/{num(p.muridJumlah)} · Sekolah selesai {p.sekolahSiap}/{p.sekolahJumlah}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-4 sm:p-5">
          <p className="font-semibold">% murid selesai ikut tahap</p>
          <p className="mt-1 text-xs text-graphite">Angka kecil = bilangan murid selesai</p>
          <div className="mt-3 text-sm">
            <div className={`${GRID_TAHAP} border-b border-fog py-2 text-xs font-semibold text-graphite`}>
              <span>PKG</span>
              {DCS_TAHAP.map((t) => (
                <span key={t.key} className="text-right">
                  <span className="sm:hidden">{TAHAP_PENDEK[t.key]}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </span>
              ))}
            </div>
            {pkgUrut.map((p) => (
              <div key={p.pkg} className={`${GRID_TAHAP} items-center border-b border-fog py-2`}>
                <span className="truncate">{p.pkg}</span>
                {DCS_TAHAP.map((t) => {
                  const v = p.tahap[t.key];
                  return (
                    <span key={t.key} className="text-right tabular-nums leading-tight">
                      {v ? (
                        <>
                          <span className="block font-semibold">{v.pct}%</span>
                          <span className="block text-[11px] text-graphite">{num(v.bil)}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                  );
                })}
              </div>
            ))}
            <div className={`${GRID_TAHAP} py-2 font-semibold`}>
              <span>Jumlah</span>
              {DCS_TAHAP.map((t) => (
                <span key={t.key} className="text-right tabular-nums">
                  {num(snap.pkg.reduce((a, p) => a + (p.tahap[t.key]?.bil ?? 0), 0))}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-2 text-xs text-graphite">T6 = Tahun 6 · T3 = Tingkatan 3 · T5 = Tingkatan 5</p>
        </div>
      </div>

      <div className="card mt-4 p-4 sm:p-5">
        <p className="font-semibold">Senarai sekolah selesai / belum selesai</p>
        <p className="mt-1 text-xs text-graphite">
          Selesai = semua murid yang didaftarkan sudah menjawab (takrif &quot;sekolah siap&quot; DCS).
          {belumDaftar > 0 ? ` Belum selesai termasuk ${belumDaftar} sekolah yang belum mendaftarkan murid.` : ""}
        </p>
        <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap sm:items-center">
          <div className="grid grid-cols-3 gap-1.5 sm:flex" role="group" aria-label="Tapis status">
            {STATUS_PILIHAN.map((it) => {
              const aktif = status === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => tapis(() => setStatus(it.id))}
                  className={`h-9 rounded border px-2 text-sm font-semibold tabular-nums transition-colors sm:px-3 ${
                    aktif ? "border-ink bg-ink text-white" : "border-fog bg-white text-graphite hover:border-steel"
                  }`}
                >
                  <span className="sm:hidden">{it.pendek}</span>
                  <span className="hidden sm:inline">{it.label}</span> ({bilStatus(it.id)})
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2 sm:contents">
            <select
              className="input h-9 w-full px-2 py-0 text-sm sm:w-auto"
              value={pkgPilih}
              onChange={(e) => tapis(() => setPkgPilih(e.target.value))}
              aria-label="Tapis PKG"
            >
              <option value="">Semua PKG</option>
              {pkgUrut.map((p) => (
                <option key={p.pkg} value={p.pkg}>
                  {p.pkg}
                </option>
              ))}
            </select>
            <input
              type="search"
              className="input h-9 w-full px-2 py-0 text-sm sm:w-56"
              placeholder="Cari sekolah / kod"
              value={cari}
              onChange={(e) => tapis(() => setCari(e.target.value))}
              aria-label="Cari sekolah"
            />
          </div>
        </div>

        {sekolah.length === 0 ? (
          <p className="py-6 text-center text-sm text-graphite">Tiada sekolah sepadan.</p>
        ) : lebar ? (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-fog text-left text-xs text-graphite">
                <th className="py-2 pr-2 font-semibold">Sekolah</th>
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 text-right font-semibold">Kelas</th>
                <th className="w-40 px-2 py-2 font-semibold">Murid selesai</th>
                <th className="py-2 pl-2 text-right font-semibold">Skor purata</th>
              </tr>
            </thead>
            <tbody>
              {dipapar.map((s) => (
                <tr key={s.kod} className="border-b border-fog last:border-0">
                  <td className="py-2 pr-2">
                    <span className="font-semibold">{s.nama}</span>
                    <span className="block text-xs text-graphite">
                      {s.kod} · {s.pkg}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <StatusLabel s={s} />
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {s.kelasJumlah > 0 ? `${s.kelasSiap}/${s.kelasJumlah}` : "—"}
                  </td>
                  <td className="px-2 py-2">
                    {s.muridJumlah > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Bar value={bahagi(s.muridSiap, s.muridJumlah)} />
                        </div>
                        <span className="w-12 shrink-0 text-right text-xs tabular-nums">
                          {s.muridSiap}/{s.muridJumlah}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-graphite">Belum daftar murid</span>
                    )}
                  </td>
                  <td className="py-2 pl-2 text-right text-xs tabular-nums">{skorTeks(s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <ul className="mt-3 divide-y divide-fog">
            {dipapar.map((s) => (
              <li key={s.kod} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">{s.nama}</p>
                    <p className="text-xs text-graphite">
                      {s.kod} · {s.pkg}
                    </p>
                  </div>
                  <StatusLabel s={s} />
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
                <p className="mt-1 text-xs text-graphite tabular-nums">
                  Kelas {s.kelasJumlah > 0 ? `${s.kelasSiap}/${s.kelasJumlah}` : "—"} · Skor {skorTeks(s)}
                </p>
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
        <p className="mt-3 text-xs text-graphite">
          Skor purata sekolah ikut tahap seperti senarai Top Schools DCS; skor 0 = belum ada murid selesai.
        </p>
      </div>
    </>
  );
}
