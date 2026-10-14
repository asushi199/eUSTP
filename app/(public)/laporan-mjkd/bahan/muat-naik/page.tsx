import type { Metadata } from "next";
import Link from "next/link";
import DbPerlahan from "@/components/mjkd/DbPerlahan";
import MuatNaikBahanForm from "@/components/mjkd/MuatNaikBahanForm";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { withDbTimeout } from "@/lib/db";
import { cadanganSektor, sektorBolehBaca } from "@/lib/mjkd/bahan";
import { hariMesyuarat, nilaiPilihanHari, pilihanTarikhPembentangan } from "@/lib/mjkd/hari";
import { getMesyuaratBahanDibuka, listSektorCadangan } from "@/lib/mjkd/queries";
import { pautanMuatSemula } from "@/lib/mjkd/ralat-db";

export const metadata: Metadata = {
  title: "Muat Naik Bahan — MJKD 2026 — NEXa Manjung",
  description: "Muat naik bahan pembentangan Mesyuarat Jawatankuasa Kurikulum Daerah.",
};

export const dynamic = "force-dynamic";

const ACCENT = "#0E7490";

/** Berurutan dalam satu timeout. */
async function muatData() {
  const mesyuarat = await getMesyuaratBahanDibuka();
  const sektor = mesyuarat ? await listSektorCadangan() : { pegawai: [], bahan: [] };
  return { mesyuarat, sektor };
}

export default async function MuatNaikBahanPage() {
  let data: Awaited<ReturnType<typeof muatData>>;
  try {
    data = await withDbTimeout(muatData());
  } catch {
    return (
      <PublicPageShell narrow>
        <PageHeader
          eyebrow="Pelaporan"
          title="Muat Naik Bahan MJKD 2026"
          accent={ACCENT}
          description="Muat naik bahan pembentangan oleh Sektor / Unit."
        />
        <DbPerlahan href={pautanMuatSemula("/laporan-mjkd/bahan/muat-naik")} />
      </PublicPageShell>
    );
  }
  const { mesyuarat, sektor } = data;

  if (!mesyuarat) {
    return (
      <PublicPageShell narrow>
        <PageHeader
          eyebrow="Pelaporan"
          title="Muat Naik Bahan MJKD 2026"
          accent={ACCENT}
          description="Muat naik bahan pembentangan oleh Sektor / Unit."
        />
        <div className="card mt-8 p-6">
          <p className="font-semibold text-ink">Muat naik bahan belum dibuka</p>
          <p className="mt-1 text-sm text-graphite">
            Hubungi urusetia MJKD untuk mengetahui bila muat naik dibuka.
          </p>
        </div>
      </PublicPageShell>
    );
  }

  const pilihan = pilihanTarikhPembentangan(hariMesyuarat(mesyuarat));

  return (
    <PublicPageShell narrow>
      <PageHeader
        eyebrow="Pelaporan"
        title="Muat Naik Bahan MJKD 2026"
        accent={ACCENT}
        description="Isi maklumat dan muat naik pautan atau fail PDF bahan pembentangan anda."
      />
      <div className="mt-8">
        <MuatNaikBahanForm
          pilihanHari={pilihan.map((p) => ({ label: p.label, nilai: nilaiPilihanHari(p.hari) }))}
          cadanganSektor={cadanganSektor(sektor.pegawai.map(sektorBolehBaca), sektor.bahan)}
        />
      </div>
      <p className="mt-6 text-sm">
        <Link href="/laporan-mjkd" className="text-graphite hover:text-ink">
          ← MJKD 2026
        </Link>
      </p>
    </PublicPageShell>
  );
}
