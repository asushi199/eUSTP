import Link from "next/link";
import { withDbTimeout } from "@/lib/db";
import { getDpdSummary } from "@/lib/stats/dpd";
import { getPssSummary } from "@/lib/stats/pss";

export const dynamic = "force-dynamic";

const MODULES = [
  {
    href: "/laporan-dpd",
    title: "Laporan DPD",
    description: "Hantar laporan program pendigitalan dan jana laporan rasmi secara automatik.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M7 3h8l4 4v14H7z" />
        <path d="M15 3v4h4" />
        <path d="M10 12h6M10 16h6" />
      </svg>
    ),
  },
  {
    href: "/laporan-pss",
    title: "Laporan PSS",
    description: "Pelaporan aktiviti Pusat Sumber Sekolah untuk semua sekolah daerah Manjung.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
        <path d="M4 19a2 2 0 0 0 2 2h13" />
        <path d="M9 7h6" />
      </svg>
    ),
  },
  {
    href: "/direktori",
    title: "Direktori GPICT",
    description: "Direktori Guru Penyelaras ICT, GP DELIMa dan GPM sekolah — cari dan kemas kini.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
      </svg>
    ),
  },
  {
    href: "/tempahan",
    title: "Tempahan PKG",
    description: "Tempah bilik dan kemudahan di 5 Pusat Kegiatan Guru daerah Manjung.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    ),
  },
  {
    href: "/sumber",
    title: "Sumber USTP",
    description: "Kertas kerja, laporan, hebahan dan bahan sokongan USTP — semua dalam satu tempat.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    href: "/analisis",
    title: "Analisis USTP",
    description: "Analisis DELIMa, DCS, Program Ains, Pensijilan Digital dan AI Tools daerah Manjung.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
      </svg>
    ),
  },
  {
    href: "/maklumat-asas",
    title: "Maklumat Asas",
    description: "Carta organisasi, maklumat PKG/COE, takwim dan pegawai USTP PPD Manjung.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8h.01M11 12h1v4h1" />
      </svg>
    ),
  },
];

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
      {/* Hero — ruang putih editorial, satu aksen biru */}
      <section className="mx-auto max-w-6xl px-4 pb-4 pt-14 sm:px-8 sm:pt-20">
        <p aria-hidden className="mb-4 text-2xl font-bold text-primary">
          {"//"}
        </p>
        <h1 className="max-w-2xl text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">
          Perkhidmatan teknologi pendidikan, satu tempat.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-graphite">
          Platform setempat Unit Sumber Teknologi Pendidikan PPD Manjung untuk
          laporan, sumber, direktori dan tempahan — untuk semua sekolah daerah Manjung.
        </p>
      </section>

      {/* Statistik ringkas — nombor dakwat, tiada carta (carta di /statistik) */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
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
                <p className="text-2xl font-semibold tabular-nums tracking-tight">
                  {t.value.toLocaleString("ms-MY")}
                </p>
                <p className="mt-1 text-xs leading-snug text-graphite">{t.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-cloud mt-3 p-4 text-sm text-graphite">
            Statistik tidak dapat dimuatkan buat masa ini. Sila muat semula
            halaman sebentar lagi.
          </div>
        )}
      </section>

      {/* Grid modul — corak card-category-icon hp */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {MODULES.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="card group flex items-start gap-4 p-6 transition hover:-translate-y-0.5 hover:shadow-modal"
            >
              <span className="mt-0.5 text-ink">{m.icon}</span>
              <span className="flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-lg font-semibold">{m.title}</span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-steel transition group-hover:translate-x-0.5 group-hover:text-primary"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-graphite">
                  {m.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
