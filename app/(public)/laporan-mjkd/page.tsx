import type { Metadata } from "next";
import Link from "next/link";
import BahanAwam from "@/components/mjkd/BahanAwam";
import DbPerlahan from "@/components/mjkd/DbPerlahan";
import MaklumBalasMjkdForm from "@/components/mjkd/MaklumBalasMjkdForm";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { withDbTimeout } from "@/lib/db";
import { listSchoolOptions } from "@/lib/direktori/queries";
import {
  formatTarikhMs,
  labelMesyuarat,
  maklumBalasTerbuka,
} from "@/lib/mjkd/enums";
import {
  getMaklumBalasByReceipt,
  getMesyuaratAwamTerkini,
  getMesyuaratDenganBahan,
  listBahan,
  listPerkara,
} from "@/lib/mjkd/queries";
import { pautanMuatSemula } from "@/lib/mjkd/ralat-db";

export const metadata: Metadata = {
  title: "Maklum Balas MJKD — NEXa Manjung",
  description:
    "Minit mesyuarat dan maklum balas PGB bagi Mesyuarat Jawatankuasa Kurikulum Daerah.",
};

export const dynamic = "force-dynamic";

const ACCENT = "#0E7490";

type Props = {
  searchParams: Promise<{ kod?: string; resit?: string; kemaskini?: string }>;
};

/** Semua data halaman, dimuat BERURUTAN (kolam serverless ~3 sambungan) dalam satu timeout. */
async function muatData(sp: { kod?: string; resit?: string; kemaskini?: string }) {
  const mesyuarat = await getMesyuaratAwamTerkini();
  const mesyuaratBahan = await getMesyuaratDenganBahan();
  const bahan = mesyuaratBahan ? await listBahan(mesyuaratBahan.id) : [];
  const terbuka = mesyuarat ? maklumBalasTerbuka(mesyuarat) : false;

  let schools: Awaited<ReturnType<typeof listSchoolOptions>> = [];
  let perkara: Awaited<ReturnType<typeof listPerkara>> = [];
  let existing: Awaited<ReturnType<typeof getMaklumBalasByReceipt>> = null;
  if (mesyuarat && terbuka) {
    schools = await listSchoolOptions();
    perkara = await listPerkara(mesyuarat.id, { aktifSahaja: true });
    const kod = sp.kod?.trim().toUpperCase();
    const resit = sp.resit?.trim().toUpperCase();
    existing =
      sp.kemaskini === "1" && kod && resit
        ? await getMaklumBalasByReceipt(mesyuarat.id, kod, resit)
        : null;
  }
  return { mesyuarat, mesyuaratBahan, bahan, terbuka, schools, perkara, existing };
}

export default async function LaporanMjkdPage({ searchParams }: Props) {
  const sp = await searchParams;

  let data: Awaited<ReturnType<typeof muatData>>;
  try {
    data = await withDbTimeout(muatData(sp), 10_000);
  } catch {
    return (
      <PublicPageShell narrow>
        <PageHeader
          eyebrow="Pelaporan"
          title="Maklum Balas MJKD"
          accent={ACCENT}
          description="Minit mesyuarat dan maklum balas PGB bagi Mesyuarat Jawatankuasa Kurikulum Daerah."
        />
        <DbPerlahan href={pautanMuatSemula("/laporan-mjkd", sp)} />
      </PublicPageShell>
    );
  }
  const { mesyuarat, mesyuaratBahan, bahan, terbuka, schools, perkara, existing } = data;
  const bahanPaparan = mesyuaratBahan && bahan.length > 0 ? (
    <BahanAwam label={labelMesyuarat(mesyuaratBahan)} bahan={bahan} />
  ) : null;

  if (!mesyuarat) {
    return (
      <PublicPageShell narrow>
        <PageHeader
          eyebrow="Pelaporan"
          title="Maklum Balas MJKD"
          accent={ACCENT}
          description="Minit mesyuarat dan maklum balas PGB bagi Mesyuarat Jawatankuasa Kurikulum Daerah."
        />
        <p className="card mt-8 p-6 text-sm text-graphite">
          Belum ada mesyuarat yang dibuka. Sila semak semula kemudian.
        </p>
        {bahanPaparan}
        <p className="mt-6 text-sm">
          <Link href="/laporan" className="text-graphite hover:text-ink">
            ← Hub laporan
          </Link>
        </p>
      </PublicPageShell>
    );
  }

  const kod = sp.kod?.trim().toUpperCase();
  const resit = sp.resit?.trim().toUpperCase();

  const namaFail = `Minit-MJKD-Bil${mesyuarat.bil}-${mesyuarat.tahun}.pdf`;
  const muatTurunHref = mesyuarat.minitUrl
    ? `${mesyuarat.minitUrl}?download=${encodeURIComponent(namaFail)}`
    : "";

  return (
    <PublicPageShell narrow>
      <PageHeader
        eyebrow="Pelaporan"
        title={`Mesyuarat Jawatankuasa Kurikulum Daerah ${labelMesyuarat(mesyuarat)}`}
        accent={ACCENT}
        description={[formatTarikhMs(mesyuarat.tarikh), mesyuarat.tempat]
          .filter(Boolean)
          .join(" · ")}
      />
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/laporan" className="text-graphite hover:text-ink">
          ← Hub laporan
        </Link>
        <Link href="/laporan-mjkd/semak" className="link-blue">
          Semak status / kemaskini
        </Link>
      </div>

      <section className="card mt-8 p-6">
        <h2 className="text-lg font-semibold">Minit mesyuarat</h2>
        {mesyuarat.minitUrl ? (
          <>
            <p className="mt-1 text-sm text-graphite">
              Sila baca minit sebelum mengisi maklum balas.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={mesyuarat.minitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ink"
              >
                Lihat Minit
              </a>
              <a href={muatTurunHref} className="btn-outline-ink">
                Muat Turun
              </a>
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-graphite">Minit belum dimuat naik.</p>
        )}
      </section>

      {bahanPaparan}

      <div className="mt-8">
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
            initialSchoolCode={kod}
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
              Maklum balas bagi mesyuarat ini tidak lagi diterima. Hubungi PPD Manjung jika
              anda perlu membuat pembetulan.
            </p>
          </div>
        )}
      </div>
    </PublicPageShell>
  );
}
