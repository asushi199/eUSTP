import type { Metadata } from "next";
import Link from "next/link";
import BorangKunjungBantu from "@/components/kunjung-bantu/BorangKunjungBantu";
import DbPerlahan from "@/components/mjkd/DbPerlahan";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { withDbTimeout } from "@/lib/db";
import { listSchoolOptions } from "@/lib/direktori/queries";
import {
  ACCENT_KUNJUNG_BANTU,
  NAMA_INSTRUMEN,
  SESI_KUNJUNG_BANTU,
  TAJUK_RASMI,
} from "@/lib/kunjung-bantu/instrumen";
import {
  getDelimaSekolahTerkini,
  getRekodByResit,
  listKodSudahHantar,
} from "@/lib/kunjung-bantu/queries";
import { pautanMuatSemula } from "@/lib/mjkd/ralat-db";

export const metadata: Metadata = {
  title: `${NAMA_INSTRUMEN} — NEXa Manjung`,
  description: `${TAJUK_RASMI} — pengisian kendiri sekolah daerah Manjung.`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ kod?: string; resit?: string; kemaskini?: string }>;
};

/** Dimuat BERURUTAN (kolam serverless kecil) dalam satu timeout. */
async function muatData(sp: { kod?: string; resit?: string; kemaskini?: string }) {
  const schools = await listSchoolOptions();
  const sudahHantar = await listKodSudahHantar();
  const kod = sp.kod?.trim().toUpperCase() ?? "";
  const resit = sp.resit?.trim().toUpperCase() ?? "";
  const rekod = sp.kemaskini === "1" && kod && resit ? await getRekodByResit(kod, resit) : null;
  const delima = rekod ? (rekod.delimaBeku ?? (await getDelimaSekolahTerkini(kod))) : null;
  return { schools, sudahHantar, rekod, delima };
}

const LANGKAH = [
  ["Isi", "Sekolah menandakan Ya / Tidak bagi setiap item. Jawapan disimpan automatik."],
  ["Hantar", "Simpan nombor tiket — untuk semak status, kemaskini dan cetak."],
  ["Lawatan PPD", "Pegawai USTP menyemak bukti di sekolah berdasarkan jawapan anda."],
  ["Disahkan", "Jika lengkap, PPD mengesahkan dan cop pengesahan dipaparkan pada cetakan."],
] as const;

export default async function LaporanKunjungBantuPage({ searchParams }: Props) {
  const sp = await searchParams;
  const header = (
    <PageHeader
      eyebrow="CoE Reports"
      title={NAMA_INSTRUMEN}
      accent={ACCENT_KUNJUNG_BANTU}
      description={`${TAJUK_RASMI} · Pemerkasaan Pendigitalan DELIMa ${SESI_KUNJUNG_BANTU.replace("-", "–")}`}
    />
  );

  let data: Awaited<ReturnType<typeof muatData>>;
  try {
    data = await withDbTimeout(muatData(sp), 10_000);
  } catch {
    return (
      <PublicPageShell narrow>
        {header}
        <DbPerlahan href={pautanMuatSemula("/laporan-kunjung-bantu", sp)} />
      </PublicPageShell>
    );
  }
  const { schools, sudahHantar, rekod, delima } = data;
  const mintaKemaskini = sp.kemaskini === "1";

  return (
    <PublicPageShell>
      {header}
      <div className="mt-4 text-sm">
        <Link href="/laporan" className="text-graphite hover:text-ink">
          ← Hub laporan
        </Link>
      </div>

      {rekod ? (
        rekod.status === "DISAHKAN" ? (
          <div className="card mt-6 border-2 border-ink p-5 sm:p-6" role="status">
            <p className="text-lg font-semibold text-ink">Rekod ini telah disahkan oleh PPD</p>
            <p className="mt-1 text-[15px] text-charcoal">
              Rekod yang disahkan dikunci dan tidak boleh dikemas kini. Anda masih boleh mencetaknya.
            </p>
            <Link
              href={`/laporan-kunjung-bantu/semak?kod=${encodeURIComponent(rekod.schoolCode)}&resit=${encodeURIComponent(rekod.receiptToken)}`}
              className="btn-outline-ink mt-4 inline-flex"
            >
              Lihat status & cetak
            </Link>
          </div>
        ) : (
          <div className="card mt-6 border-2 border-ink p-5 sm:p-6" role="status">
            <p className="text-lg font-semibold text-ink">Mod kemaskini</p>
            <p className="mt-1 text-[15px] text-charcoal">
              Jawapan yang telah dihantar dimuatkan di bawah.
              {rekod.status === "PERLU_PEMBETULAN"
                ? " Item bertanda merah perlu dibaiki mengikut ulasan PPD."
                : ""}{" "}
              Tekan <span className="font-semibold">Kemaskini</span> selepas selesai.
            </p>
          </div>
        )
      ) : (
        <>
          {mintaKemaskini ? (
            <p className="card mt-6 p-5 text-sm text-bloom-deep">
              Nombor tiket tidak sepadan. Sila semak semula melalui halaman Semak / Kemaskini.
            </p>
          ) : null}
          <div className="card mt-6 flex flex-col gap-4 border-2 border-steel/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <p className="text-lg font-semibold text-ink">Sudah menghantar?</p>
              <p className="mt-1 text-[15px] text-charcoal">
                Semak status semakan PPD, kemaskini jawapan atau cetak dengan kod sekolah dan nombor
                tiket.
              </p>
            </div>
            <Link
              href="/laporan-kunjung-bantu/semak"
              className="btn-outline h-14 w-full shrink-0 text-base sm:w-auto sm:px-8"
            >
              Semak / Kemaskini
            </Link>
          </div>
          <ol className="mt-6 grid gap-3 sm:grid-cols-4">
            {LANGKAH.map(([tajuk, hurai], i) => (
              <li key={tajuk} className="card p-4">
                <p className="text-xs font-semibold text-graphite">Langkah {i + 1}</p>
                <p className="mt-1 font-semibold text-ink">{tajuk}</p>
                <p className="mt-1 text-sm leading-relaxed text-graphite">{hurai}</p>
              </li>
            ))}
          </ol>
        </>
      )}

      {rekod?.status !== "DISAHKAN" ? (
        <div className="mt-8">
          <BorangKunjungBantu
            key={rekod?.id ?? "baharu"}
            schools={schools}
            sudahHantar={sudahHantar}
            existing={
              rekod
                ? {
                    schoolCode: rekod.schoolCode,
                    receiptToken: rekod.receiptToken,
                    maklumat: {
                      namaPgb: rekod.namaPgb,
                      namaPkPentadbiran: rekod.namaPkPentadbiran,
                      namaAdminDelima: rekod.namaAdminDelima,
                    },
                    jawapan: rekod.jawapan,
                    semakan: rekod.status === "PERLU_PEMBETULAN" ? rekod.semakan : {},
                    delima,
                  }
                : null
            }
          />
        </div>
      ) : null}
    </PublicPageShell>
  );
}
