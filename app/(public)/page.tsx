import Link from "next/link";
import { withDbTimeout } from "@/lib/db";
import { HOME_MODULES } from "@/lib/home-modules";
import { getDpdSummary } from "@/lib/stats/dpd";
import { getPssSummary } from "@/lib/stats/pss";
import { AmbientScene } from "@/components/home/AmbientScene";
import { HeroVisual } from "@/components/home/HeroVisual";
import { HomeModuleIcon } from "@/components/home/HomeModuleIcon";
import { ModuleCard } from "@/components/home/ModuleCard";

export const dynamic = "force-dynamic";

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
  const [dpd, pss] = await Promise.all([
    withDbTimeout(getDpdSummary()).catch((e) => {
      console.error("[home] getDpdSummary gagal:", e instanceof Error ? e.message : e);
      return null;
    }),
    withDbTimeout(getPssSummary()).catch((e) => {
      console.error("[home] getPssSummary gagal:", e instanceof Error ? e.message : e);
      return null;
    }),
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
      <AmbientScene />

      <section className="portal-home mx-auto grid max-w-6xl items-center gap-10 px-4 pb-8 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-10">
        <div>
          <p className="portal-home-hero-delay-1 mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <span className="h-0.5 w-7 rounded bg-primary" aria-hidden />
            PPD Manjung · Unit Sumber dan Teknologi Pendidikan
          </p>
          <h1 className="portal-home-hero-delay-2 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.25rem]">
            <span className="block text-graphite">Portal Digital</span>
            <span className="block text-ink">eUSTP Manjung</span>
          </h1>
          <p className="portal-home-hero-delay-3 mt-5 max-w-xl text-lg leading-relaxed text-graphite">
            Platform setempat untuk laporan, sumber, direktori dan tempahan —
            perkhidmatan teknologi pendidikan untuk semua sekolah daerah Manjung.
          </p>
          <a
            href="#modul"
            className="portal-home-hero-delay-3 btn-primary mt-8 inline-flex normal-case tracking-normal"
          >
            Terokai Modul
            <span aria-hidden>↓</span>
          </a>
          <div
            className="portal-home-hero-delay-3 mt-10 flex flex-wrap gap-0 border-l-0 sm:gap-0"
            aria-label="Ringkasan portal"
          >
            {[
              { value: "07", label: "MODUL DIGITAL" },
              { value: "05", label: "PKG DAERAH" },
              { value: "01", label: "PINTU MASUK" },
            ].map((item, i) => (
              <div
                key={item.label}
                className={`px-6 py-0 ${i === 0 ? "pl-0" : "border-l-2 border-primary/12"}`}
              >
                <p className="text-2xl font-bold tabular-nums text-primary">{item.value}</p>
                <p className="mt-1 text-[10px] font-semibold tracking-[0.16em] text-graphite">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
        <HeroVisual />
      </section>

      <div className="portal-hero-wave" aria-hidden>
        <svg viewBox="0 0 1440 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="currentColor"
            d="M0,24 C240,48 480,0 720,24 C960,48 1200,0 1440,24 L1440,48 L0,48 Z"
          />
        </svg>
      </div>

      <section className="portal-stats-band px-4 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.7px] text-graphite">
              Statistik Semasa
            </h2>
            <Link href="/statistik" className="link-blue text-sm">
              Lihat statistik penuh
            </Link>
          </div>
          {statsOk ? (
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
              Statistik tidak dapat dimuatkan buat masa ini. Sila muat semula halaman
              sebentar lagi.
            </div>
          )}
        </div>
      </section>

      <section id="modul" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {"// 01 — MODUL"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Satu portal, tujuh laluan kerja.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-graphite">
            Pilih modul yang diperlukan untuk meneruskan urusan anda.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {HOME_MODULES.map((mod, index) => (
            <ModuleCard
              key={mod.href}
              href={mod.href}
              title={mod.title}
              description={mod.description}
              accent={mod.accent}
              index={index}
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
