import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BahanPratonton from "@/components/mjkd/BahanPratonton";
import DbPerlahan from "@/components/mjkd/DbPerlahan";
import MaklumBalasMjkdForm from "@/components/mjkd/MaklumBalasMjkdForm";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { withDbTimeout } from "@/lib/db";
import { listSchoolOptions } from "@/lib/direktori/queries";
import {
  MINIT_RUJUKAN,
  NAMA_ACARA,
  fasaAcara,
  julatTarikh,
} from "@/lib/mjkd/acara";
import { formatTarikhMs, hariIniKl, maklumBalasTerbuka } from "@/lib/mjkd/enums";
import {
  getMaklumBalasByReceipt,
  getMesyuaratAwamTerkini,
  listBahan,
  listPerkara,
} from "@/lib/mjkd/queries";
import { pautanMuatSemula } from "@/lib/mjkd/ralat-db";

export const metadata: Metadata = {
  title: "MJKD 2026 — NEXa Manjung",
  description:
    "Mesyuarat Jawatankuasa Kurikulum Daerah Manjung 2026 — kehadiran, minit, maklum balas PGB dan bahan pembentangan.",
};

export const dynamic = "force-dynamic";
/** Muat naik gambar bukti melalui GAS boleh mengambil masa (tindakan pelayan halaman ini). */
export const maxDuration = 60;

const ACCENT = "#0E7490";
const DESKRIPSI =
  "Mesyuarat Jawatankuasa Kurikulum Daerah Manjung 2026 — kehadiran, minit, maklum balas PGB dan bahan pembentangan.";

type Props = {
  searchParams: Promise<{ kod?: string; resit?: string; kemaskini?: string }>;
};

/**
 * MJKD 2026 = SATU acara: semua data pada satu rekod mesyuarat. Dimuat BERURUTAN
 * (kolam serverless ~3 sambungan) dalam satu timeout.
 */
async function muatData(sp: { kod?: string; resit?: string; kemaskini?: string }) {
  const mesyuarat = await getMesyuaratAwamTerkini();
  if (!mesyuarat) return null;
  const bahan = await listBahan(mesyuarat.id);
  const terbuka = maklumBalasTerbuka(mesyuarat);

  let schools: Awaited<ReturnType<typeof listSchoolOptions>> = [];
  let perkara: Awaited<ReturnType<typeof listPerkara>> = [];
  let existing: Awaited<ReturnType<typeof getMaklumBalasByReceipt>> = null;
  if (terbuka) {
    schools = await listSchoolOptions();
    perkara = await listPerkara(mesyuarat.id, { aktifSahaja: true });
    const kod = sp.kod?.trim().toUpperCase();
    const resit = sp.resit?.trim().toUpperCase();
    existing =
      sp.kemaskini === "1" && kod && resit
        ? await getMaklumBalasByReceipt(mesyuarat.id, kod, resit)
        : null;
  }
  return { mesyuarat, bahan, terbuka, schools, perkara, existing };
}

function IkonKalendar() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function IkonLokasi() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

/** Corak geometri halus (diilhamkan songket) untuk latar hero. */
function CorakHero() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.09]"
      aria-hidden
    >
      <defs>
        <pattern id="mjkd-corak" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M22 2 42 22 22 42 2 22Z" fill="none" stroke="#E3B341" strokeWidth="1" />
          <path d="M22 13 31 22 22 31 13 22Z" fill="none" stroke="#fff" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mjkd-corak)" />
    </svg>
  );
}

function TajukBahagian({
  id,
  nombor,
  tajuk,
  sub,
}: {
  id: string;
  nombor: string;
  tajuk: string;
  sub?: string;
}) {
  return (
    <div id={id} className="scroll-mt-24 flex items-end gap-4">
      <span className="font-mono text-4xl font-semibold leading-none text-[#0E7490]/25 sm:text-5xl">
        {nombor}
      </span>
      <div className="min-w-0 border-l-2 border-[#E3B341] pl-4">
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{tajuk}</h2>
        {sub ? <p className="mt-1 text-sm text-graphite">{sub}</p> : null}
      </div>
    </div>
  );
}

export default async function LaporanMjkdPage({ searchParams }: Props) {
  const sp = await searchParams;

  let data: Awaited<ReturnType<typeof muatData>>;
  try {
    data = await withDbTimeout(muatData(sp), 10_000);
  } catch {
    return (
      <PublicPageShell narrow>
        <PageHeader eyebrow="CoE Reports" title={NAMA_ACARA} accent={ACCENT} description={DESKRIPSI} />
        <DbPerlahan href={pautanMuatSemula("/laporan-mjkd", sp)} />
      </PublicPageShell>
    );
  }

  if (!data) {
    return (
      <PublicPageShell narrow>
        <PageHeader eyebrow="CoE Reports" title={NAMA_ACARA} accent={ACCENT} description={DESKRIPSI} />
        <p className="card mt-8 p-6 text-sm text-graphite">
          Belum ada mesyuarat yang dibuka. Sila semak semula kemudian.
        </p>
      </PublicPageShell>
    );
  }

  const { mesyuarat, bahan, terbuka, schools, perkara, existing } = data;
  const resit = sp.resit?.trim().toUpperCase();
  const hariIni = hariIniKl();
  const fasa = fasaAcara(mesyuarat.tarikh, mesyuarat.tarikhTamat, hariIni);
  const tutup = mesyuarat.tarikhTutupMaklumBalas;

  const namaFail = `Minit-MJKD-${MINIT_RUJUKAN.label.replace(/[./]/g, "-")}.pdf`;
  const muatTurunMinit = mesyuarat.minitUrl
    ? `${mesyuarat.minitUrl}?download=${encodeURIComponent(namaFail)}`
    : "";

  const langkah = [
    {
      id: "kehadiran",
      nombor: "01",
      tajuk: "Kehadiran",
      status: mesyuarat.kehadiranDibuka ? "Dibuka — imbas QR / klik" : "Dibuka pada hari mesyuarat",
      aktif: mesyuarat.kehadiranDibuka,
    },
    {
      id: "minit",
      nombor: "02",
      tajuk: "Minit Mesyuarat",
      status: mesyuarat.minitUrl ? `${MINIT_RUJUKAN.label} · tersedia` : "Belum dimuat naik",
      aktif: Boolean(mesyuarat.minitUrl),
    },
    {
      id: "maklum-balas",
      nombor: "03",
      tajuk: "Maklum Balas PGB",
      status: terbuka
        ? tutup
          ? `Dibuka hingga ${formatTarikhMs(tutup)}`
          : "Dibuka"
        : "Ditutup",
      aktif: terbuka,
    },
    {
      id: "bahan",
      nombor: "04",
      tajuk: "Bahan Pembentangan",
      status: bahan.length > 0 ? `${bahan.length} bahan` : "Akan dikemas kini",
      aktif: bahan.length > 0,
    },
  ];

  return (
    <div className="portal-page-enter mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      {/* ============================== HERO ============================== */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b2530] text-white shadow-[0_30px_80px_-40px_rgba(11,37,48,0.8)]">
        <div
          className="absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,#0E7490_0%,transparent_55%),radial-gradient(80%_80%_at_0%_100%,#123b4a_0%,transparent_60%)]"
          aria-hidden
        />
        <CorakHero />
        <div className="relative grid gap-8 p-6 sm:p-10 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center xl:gap-12 xl:p-14">
          <div className="min-w-0">
            <div className="inline-flex rounded-2xl bg-white px-5 py-3 shadow-lg">
              <Image
                src="/mjkd/logo-kpm-ppd-manjung.png"
                alt="Kementerian Pendidikan Malaysia — Pejabat Pendidikan Daerah Manjung"
                width={683}
                height={365}
                priority
                className="h-20 w-auto sm:h-24"
              />
            </div>
            <p className="mt-8 text-xs font-semibold tracking-[0.18em] text-[#E3B341]">
              PEJABAT PENDIDIKAN DAERAH MANJUNG
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl xl:text-[56px]">
              Mesyuarat Jawatankuasa
              <br className="hidden sm:block" /> Kurikulum Daerah{" "}
              <span className="bg-gradient-to-r from-[#F5D27A] to-[#E3B341] bg-clip-text text-transparent">
                2026
              </span>
            </h1>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85 sm:text-base">
              <span className="inline-flex items-center gap-2">
                <IkonKalendar />
                {julatTarikh(mesyuarat.tarikh, mesyuarat.tarikhTamat)}
              </span>
              {mesyuarat.tempat ? (
                <span className="inline-flex items-center gap-2">
                  <IkonLokasi />
                  {mesyuarat.tempat}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <div className="flex-1 rounded-2xl border border-white/15 bg-white/[0.07] px-6 py-5 text-center backdrop-blur-sm xl:min-w-[220px]">
              {fasa.jenis === "akan" ? (
                <>
                  <p className="text-5xl font-semibold tabular-nums text-[#F5D27A] sm:text-6xl">
                    {fasa.hari}
                  </p>
                  <p className="mt-1 text-xs font-semibold tracking-[0.14em] text-white/70">
                    HARI LAGI
                  </p>
                </>
              ) : fasa.jenis === "berlangsung" ? (
                <>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#F5D27A]">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#F5D27A]" aria-hidden />
                    SEDANG BERLANGSUNG
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    Hari {fasa.hariKe}
                    <span className="text-lg text-white/60"> / {fasa.jumlah}</span>
                  </p>
                </>
              ) : (
                <p className="text-lg font-semibold text-white/85">Mesyuarat telah selesai</p>
              )}
            </div>
            {mesyuarat.kehadiranDibuka ? (
              <Link
                href="/laporan-mjkd/hadir"
                className="flex flex-1 items-center justify-center rounded-2xl bg-[#E3B341] px-6 py-4 text-sm font-bold uppercase tracking-[0.7px] text-[#0b2530] transition hover:bg-[#F5D27A]"
              >
                Sahkan kehadiran →
              </Link>
            ) : null}
          </div>
        </div>

        {/* Agenda / navigasi bahagian */}
        <nav
          aria-label="Bahagian MJKD 2026"
          className="relative grid grid-cols-2 border-t border-white/10 lg:grid-cols-4"
        >
          {langkah.map((l, i) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className={`group flex flex-col gap-1 px-5 py-4 transition hover:bg-white/[0.06] sm:px-8 sm:py-5 ${
                i % 2 === 1 ? "border-l border-white/10" : ""
              } ${i >= 2 ? "border-t border-white/10 lg:border-t-0" : ""} ${
                i === 2 ? "lg:border-l lg:border-white/10" : ""
              }`}
            >
              <span className="font-mono text-xs text-[#E3B341]">{l.nombor}</span>
              <span className="text-sm font-semibold sm:text-base">{l.tajuk}</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-white/65">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${l.aktif ? "bg-emerald-400" : "bg-white/35"}`}
                  aria-hidden
                />
                {l.status}
              </span>
            </a>
          ))}
        </nav>
      </section>

      <div className="mx-auto mt-14 max-w-6xl space-y-16 sm:mt-20 sm:space-y-20">
        {/* ============================ 01 KEHADIRAN ============================ */}
        <section>
          <TajukBahagian
            id="kehadiran"
            nombor="01"
            tajuk="Kehadiran"
            sub="PGB, wakil sekolah, pegawai PPD dan jemputan mengesahkan kehadiran setiap hari."
          />
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border hairline bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            {mesyuarat.kehadiranDibuka ? (
              <>
                <div>
                  <p className="text-lg font-semibold text-ink">Pengesahan kehadiran dibuka</p>
                  <p className="mt-1 text-sm text-graphite">
                    Imbas kod QR di dewan atau klik butang untuk mengesahkan kehadiran anda.
                  </p>
                </div>
                <Link href="/laporan-mjkd/hadir" className="btn-primary shrink-0">
                  Sahkan kehadiran
                </Link>
              </>
            ) : (
              <div>
                <p className="text-lg font-semibold text-ink">Belum dibuka</p>
                <p className="mt-1 text-sm text-graphite">
                  Pengesahan kehadiran dibuka pada hari mesyuarat (
                  {julatTarikh(mesyuarat.tarikh, mesyuarat.tarikhTamat)}) melalui kod QR di dewan.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ============================== 02 MINIT ============================== */}
        <section>
          <TajukBahagian
            id="minit"
            nombor="02"
            tajuk={`Minit Mesyuarat ${MINIT_RUJUKAN.label}`}
            sub={`${formatTarikhMs(MINIT_RUJUKAN.tarikh)} · ${MINIT_RUJUKAN.tempat} — sila baca sebelum mengisi maklum balas.`}
          />
          {mesyuarat.minitUrl ? (
            <div className="mt-6 overflow-hidden rounded-2xl border hairline bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b hairline px-5 py-4 sm:px-6">
                <p className="text-sm font-semibold text-ink">{namaFail}</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={mesyuarat.minitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ink btn-sm"
                  >
                    Skrin penuh ↗
                  </a>
                  <a href={muatTurunMinit} className="btn-outline-ink btn-sm">
                    Muat turun
                  </a>
                </div>
              </div>
              <iframe
                title={`Minit Mesyuarat ${MINIT_RUJUKAN.label}`}
                src={mesyuarat.minitUrl}
                loading="lazy"
                className="hidden h-[75vh] w-full bg-cloud md:block"
              />
              <p className="px-5 py-4 text-sm text-graphite md:hidden">
                Klik &quot;Skrin penuh&quot; untuk membaca minit.
              </p>
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border hairline bg-white p-6 text-sm text-graphite">
              Minit belum dimuat naik.
            </p>
          )}
        </section>

        {/* =========================== 03 MAKLUM BALAS =========================== */}
        <section>
          <TajukBahagian
            id="maklum-balas"
            nombor="03"
            tajuk="Maklum Balas PGB"
            sub={`Status pelaksanaan perkara tindakan minit ${MINIT_RUJUKAN.label} oleh setiap sekolah.`}
          />
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-[#0E7490]/[0.06] px-5 py-4 text-sm sm:px-6">
            {terbuka ? (
              <span className="font-semibold text-ink">
                {tutup ? `Dibuka hingga ${formatTarikhMs(tutup)}` : "Dibuka"}
              </span>
            ) : (
              <span className="font-semibold text-ink">Maklum balas ditutup</span>
            )}
            <span className="text-graphite">
              Catatan wajib ikut <strong className="text-ink">5W1H</strong> · Bukti: pautan dan/atau
              gambar
            </span>
            <Link href="/laporan-mjkd/semak" className="link-blue ml-auto">
              Semak status / kemaskini →
            </Link>
          </div>
          <div className="mt-6">
            {terbuka ? (
              <MaklumBalasMjkdForm
                key={existing?.id ?? "baharu"}
                mesyuarat={{ id: mesyuarat.id, bil: mesyuarat.bil, tahun: mesyuarat.tahun }}
                schools={schools}
                perkara={perkara.map((p) => ({
                  id: p.id,
                  para: p.para,
                  mukaSurat: p.mukaSurat,
                  perkara: p.perkara,
                  tindakan: p.tindakan,
                  panduan: p.panduan,
                  sasaran: p.sasaran,
                  sekolahKhusus: p.sekolahKhusus,
                }))}
                initialSchoolCode={sp.kod?.trim().toUpperCase()}
                existing={
                  existing
                    ? {
                        namaPengisi: existing.namaPengisi,
                        jawatanPengisi: existing.jawatanPengisi,
                        items: existing.items.map((it) => ({
                          perkaraId: it.perkaraId,
                          status: it.status,
                          catatan: it.catatan,
                          pautanBukti: it.pautanBukti,
                          fotoBukti: it.fotoBukti,
                        })),
                      }
                    : null
                }
                initialReceiptToken={existing ? resit : undefined}
              />
            ) : (
              <div className="rounded-2xl border hairline bg-white p-6">
                <p className="font-semibold text-ink">Maklum balas ditutup</p>
                <p className="mt-1 text-sm text-graphite">
                  Maklum balas tidak lagi diterima. Hubungi PPD Manjung jika anda perlu membuat
                  pembetulan.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ============================== 04 BAHAN ============================== */}
        <section>
          <TajukBahagian
            id="bahan"
            nombor="04"
            tajuk="Bahan Pembentangan"
            sub="Pilih bahan untuk pratonton terus. Klik “Skrin penuh” untuk membuka di tab baharu."
          />
          <div className="mt-6">
            {bahan.length > 0 ? (
              <BahanPratonton
                bahan={bahan.map((b) => ({
                  id: b.id,
                  sektorUnit: b.sektorUnit,
                  tajuk: b.tajuk,
                  namaPembentang: b.namaPembentang,
                  hari: b.hari,
                  jenis: b.jenis,
                  url: b.url,
                  storagePath: b.storagePath,
                  createdAt: b.createdAt.toISOString(),
                }))}
              />
            ) : (
              <p className="rounded-2xl border hairline bg-white p-6 text-sm text-graphite">
                Bahan pembentangan akan dipaparkan di sini apabila dimuat naik oleh sektor / unit.
              </p>
            )}
          </div>
        </section>

        <p className="text-sm">
          <Link href="/laporan" className="text-graphite hover:text-ink">
            ← CoE Reports
          </Link>
        </p>
      </div>
    </div>
  );
}
