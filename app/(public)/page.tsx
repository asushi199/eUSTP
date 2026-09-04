import { withDbTimeout } from "@/lib/db";
import { HOME_MODULES } from "@/lib/home-modules";
import { getAnalisisHomeSummary } from "@/lib/analisis/summary";
import { getDpdSummary } from "@/lib/stats/dpd";
import { getPssSummary } from "@/lib/stats/pss";
import { HomeAmbientScene } from "@/components/home/HomeAmbientScene";
import HomeAnalisisBand from "@/components/home/HomeAnalisisBand";
import { HomeWelcomeBanner } from "@/components/home/HomeWelcomeBanner";
import { HomeModuleIcon } from "@/components/home/HomeModuleIcon";
import { ModuleCard } from "@/components/home/ModuleCard";

export const dynamic = "force-dynamic";

/**
 * Petak statistik DPD/PSS disorok buat sementara — pelaporan 2026 masih
 * menggunakan Looker Studio. Tukar kepada true selepas migrasi statistik.
 */
const SHOW_LAPORAN_TILES: boolean = false;

function AssuranceIcon() {
  return (
    <span
      className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#0d9488]/12 text-[#0d9488]"
      aria-hidden
    >
      <svg
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3"
      >
        <path d="M2 6l3 3 5-5" />
      </svg>
    </span>
  );
}

export default async function HomePage() {
  /**
   * Halaman utama mesti sentiasa render. Jika DB gagal/lambat (>8s), JANGAN
   * papar angka palsu — papar notis "statistik tidak tersedia" secara jujur,
   * dan log ralat sebenar ke log Vercel untuk diagnosis.
   */
  const [analisis, dpd, pss] = await Promise.all([
    withDbTimeout(getAnalisisHomeSummary()).catch((e) => {
      console.error(
        "[home] getAnalisisHomeSummary gagal:",
        e instanceof Error ? e.message : e,
      );
      return null;
    }),
    SHOW_LAPORAN_TILES
      ? withDbTimeout(getDpdSummary()).catch((e) => {
          console.error("[home] getDpdSummary gagal:", e instanceof Error ? e.message : e);
          return null;
        })
      : Promise.resolve(null),
    SHOW_LAPORAN_TILES
      ? withDbTimeout(getPssSummary()).catch((e) => {
          console.error("[home] getPssSummary gagal:", e instanceof Error ? e.message : e);
          return null;
        })
      : Promise.resolve(null),
  ]);
  const statsOk = dpd !== null && pss !== null;
  const tiles = statsOk
    ? [
        { label: "Program Pendigitalan (DPD)", value: dpd.jumlahProgram },
        { label: "Bil. Murid Terlibat", value: dpd.bilMurid },
        { label: "Bil. Pendidik Terlibat", value: dpd.bilPendidik },
        { label: "Laporan PSS", value: pss.jumlahLaporan },
        { label: "Laporan PSS Bulan Ini", value: pss.laporanBulanIni },
      ]
    : [];

  return (
    <>
      <HomeAmbientScene />

      <HomeWelcomeBanner />

      <section
        id="coe-analytics"
        className="portal-welcome-analytics scroll-mt-20 px-4 pb-8 sm:px-8 sm:pb-10"
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.7px] text-graphite">
              CoE Analytics
            </h2>
          </div>
          {analisis ? (
            <HomeAnalisisBand modules={analisis} />
          ) : (
            <div className="card mt-3 p-4 text-sm text-graphite">
              Analisis tidak dapat dimuatkan buat masa ini. Sila muat semula halaman
              sebentar lagi.
            </div>
          )}
          {SHOW_LAPORAN_TILES ? (
            statsOk ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {tiles.map((t) => (
                  <div key={t.label} className="card p-4">
                    <p className="text-2xl font-semibold tabular-nums tracking-tight text-primary">
                      {t.value.toLocaleString("ms-MY")}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-graphite">{t.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card mt-3 p-4 text-sm text-graphite">
                Statistik laporan tidak dapat dimuatkan buat masa ini.
              </div>
            )
          ) : null}
        </div>
      </section>

      <section id="modul" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {"// 01 — MODUL"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Satu Platform, Semua Sumber.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-graphite">
            Pilih modul yang diperlukan untuk meneruskan urusan anda.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {HOME_MODULES.map((mod, index) => (
            <ModuleCard
              key={mod.internalHref}
              href={mod.href}
              title={mod.title}
              accent={mod.accent}
              index={index}
              cta={mod.cta}
              items={mod.items}
              moreLabel={mod.moreLabel}
              icon={<HomeModuleIcon iconKey={mod.iconKey} />}
            />
          ))}
        </div>
      </section>

      <section
        className="mx-auto flex max-w-6xl flex-col items-start justify-center gap-3 border-t border-fog px-4 py-6 text-sm text-graphite sm:flex-row sm:items-center sm:gap-12 sm:px-8"
        aria-label="Ciri portal"
      >
        <span className="flex items-center gap-2">
          <AssuranceIcon /> Mesra telefon
        </span>
        <span className="flex items-center gap-2">
          <AssuranceIcon /> Akses terus
        </span>
        <span className="flex items-center gap-2">
          <AssuranceIcon /> Tanpa log masuk tambahan
        </span>
      </section>
    </>
  );
}
