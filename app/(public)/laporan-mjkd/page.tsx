import type { Metadata } from "next";
import Link from "next/link";
import DbPerlahan from "@/components/mjkd/DbPerlahan";
import MaklumBalasMjkdForm from "@/components/mjkd/MaklumBalasMjkdForm";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { withDbTimeout } from "@/lib/db";
import { listSchoolOptions } from "@/lib/direktori/queries";
import { MINIT_RUJUKAN, NAMA_ACARA, julatTarikh } from "@/lib/mjkd/acara";
import { bakiHariTutup, formatTarikhMs, maklumBalasTerbuka } from "@/lib/mjkd/enums";
import {
  getMaklumBalasByReceipt,
  getMesyuaratAwamTerkini,
  listPerkara,
} from "@/lib/mjkd/queries";
import { pautanMuatSemula } from "@/lib/mjkd/ralat-db";

export const metadata: Metadata = {
  title: "MJKD 2026 — NEXa Manjung",
  description:
    "Mesyuarat Jawatankuasa Kurikulum Daerah Manjung 2026 — minit mesyuarat dan maklum balas PGB.",
};

export const dynamic = "force-dynamic";
/** Muat naik gambar bukti melalui GAS boleh mengambil masa (tindakan pelayan halaman ini). */
export const maxDuration = 60;

const ACCENT = "#0E7490";
const DESKRIPSI =
  "Mesyuarat Jawatankuasa Kurikulum Daerah Manjung 2026 — minit mesyuarat dan maklum balas PGB.";

type Props = {
  searchParams: Promise<{ kod?: string; resit?: string; kemaskini?: string }>;
};

/**
 * MJKD 2026 (awam): minit + maklum balas PGB sahaja. Kehadiran (QR) dan bahan dipaparkan dalam
 * mod pembentangan. Dimuat BERURUTAN (kolam serverless ~3 sambungan) dalam satu timeout.
 */
async function muatData(sp: { kod?: string; resit?: string; kemaskini?: string }) {
  const mesyuarat = await getMesyuaratAwamTerkini();
  if (!mesyuarat) return null;
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
  return { mesyuarat, terbuka, schools, perkara, existing };
}

/** Kiraan hari hingga maklum balas ditutup — merah bila ≤ 2 hari. */
function BakiHari({ tutup }: { tutup: string }) {
  const { hari, namaHari } = bakiHariTutup(tutup);
  if (hari < 0) return null;
  const mendesak = hari <= 2;
  const tajuk =
    hari === 0
      ? "Hari terakhir! Maklum balas ditutup malam ini."
      : hari === 1
        ? "Tinggal 1 hari lagi sebelum maklum balas ditutup!"
        : mendesak
          ? `Tinggal ${hari} hari lagi sebelum maklum balas ditutup!`
          : `Lagi ${hari} hari sebelum maklum balas ditutup`;
  return (
    <div
      className={`card mt-6 flex items-center gap-5 p-5 sm:p-6 ${
        mendesak ? "border-bloom-deep/40 bg-bloom-rose/40" : ""
      }`}
      role="status"
    >
      <div
        className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg text-white ${
          mendesak ? "bg-bloom-deep" : "bg-ink"
        }`}
      >
        <span className="text-3xl font-semibold leading-none tabular-nums">
          {hari === 0 ? "!" : hari}
        </span>
        <span className="mt-1 text-[11px] font-semibold tracking-[0.12em]">
          {hari === 0 ? "AKHIR" : "HARI"}
        </span>
      </div>
      <div className="min-w-0">
        <p className={`text-lg font-semibold ${mendesak ? "text-bloom-deep" : "text-ink"}`}>
          {tajuk}
        </p>
        <p className="mt-1 text-sm text-graphite">
          Tarikh tutup: {namaHari}, {formatTarikhMs(tutup)}, jam 11:59 malam. Sekolah yang belum
          menghantar, sila lengkapkan maklum balas segera.
        </p>
      </div>
    </div>
  );
}

function Pengepala() {
  return (
    <PageHeader
      eyebrow="CoE Reports"
      title={NAMA_ACARA}
      accent={ACCENT}
      description={DESKRIPSI}
    />
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
        <Pengepala />
        <DbPerlahan href={pautanMuatSemula("/laporan-mjkd", sp)} />
      </PublicPageShell>
    );
  }

  if (!data) {
    return (
      <PublicPageShell narrow>
        <Pengepala />
        <p className="card mt-8 p-6 text-sm text-graphite">
          Belum ada mesyuarat yang dibuka. Sila semak semula kemudian.
        </p>
      </PublicPageShell>
    );
  }

  const { mesyuarat, terbuka, schools, perkara, existing } = data;
  const resit = sp.resit?.trim().toUpperCase();
  const tutup = mesyuarat.tarikhTutupMaklumBalas;

  const namaFail = `Minit-MJKD-${MINIT_RUJUKAN.label.replace(/[./]/g, "-")}.pdf`;
  const muatTurunMinit = mesyuarat.minitUrl
    ? `${mesyuarat.minitUrl}?download=${encodeURIComponent(namaFail)}`
    : "";

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Reports"
        title={NAMA_ACARA}
        accent={ACCENT}
        description={`Mesyuarat Jawatankuasa Kurikulum Daerah · ${julatTarikh(
          mesyuarat.tarikh,
          mesyuarat.tarikhTamat,
        )}${mesyuarat.tempat ? ` · ${mesyuarat.tempat}` : ""}`}
      />
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link href="/laporan" className="text-graphite hover:text-ink">
          ← Hub laporan
        </Link>
        <Link href="/laporan-mjkd/semak" className="link-blue">
          Semak status / kemaskini
        </Link>
      </div>

      {terbuka && tutup ? <BakiHari tutup={tutup} /> : null}

      <section className="card mt-6">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">Minit Mesyuarat {MINIT_RUJUKAN.label}</h2>
            <p className="mt-1 text-sm text-graphite">
              {formatTarikhMs(MINIT_RUJUKAN.tarikh)} · {MINIT_RUJUKAN.tempat}. Sila baca minit
              sebelum mengisi maklum balas.
            </p>
          </div>
          {mesyuarat.minitUrl ? (
            <div className="flex flex-wrap gap-3">
              <a
                href={mesyuarat.minitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ink"
              >
                Lihat Minit
              </a>
              <a href={muatTurunMinit} className="btn-outline-ink">
                Muat Turun
              </a>
            </div>
          ) : null}
        </div>
        {!mesyuarat.minitUrl ? (
          <p className="border-t hairline px-6 py-4 text-sm text-graphite">
            Minit belum dimuat naik.
          </p>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Maklum Balas PGB</h2>
        <p className="mt-1 text-sm text-graphite">
          {terbuka
            ? `Dibuka${tutup ? ` hingga ${formatTarikhMs(tutup)}` : ""}. `
            : "Maklum balas ditutup. "}
          Catatan wajib ikut 5W1H; bukti boleh berupa pautan dan/atau gambar.
        </p>
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
            <div className="card p-6">
              <p className="font-semibold text-ink">Maklum balas ditutup</p>
              <p className="mt-1 text-sm text-graphite">
                Maklum balas tidak lagi diterima. Hubungi PPD Manjung jika anda perlu membuat
                pembetulan.
              </p>
            </div>
          )}
        </div>
      </section>
    </PublicPageShell>
  );
}
