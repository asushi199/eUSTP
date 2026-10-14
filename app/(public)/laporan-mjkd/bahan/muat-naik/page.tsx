import type { Metadata } from "next";
import Link from "next/link";
import MuatNaikBahanForm from "@/components/mjkd/MuatNaikBahanForm";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { cadanganSektor, sektorBolehBaca } from "@/lib/mjkd/bahan";
import { labelMesyuarat } from "@/lib/mjkd/enums";
import { hariMesyuarat, nilaiPilihanHari, pilihanTarikhPembentangan } from "@/lib/mjkd/hari";
import { getMesyuaratBahanDibuka, listSektorCadangan } from "@/lib/mjkd/queries";

export const metadata: Metadata = {
  title: "Muat Naik Bahan MJKD — NEXa Manjung",
  description: "Muat naik bahan pembentangan Mesyuarat Jawatankuasa Kurikulum Daerah.",
};

export const dynamic = "force-dynamic";

const ACCENT = "#0E7490";

export default async function MuatNaikBahanPage() {
  const mesyuarat = await getMesyuaratBahanDibuka();

  if (!mesyuarat) {
    return (
      <PublicPageShell narrow>
        <PageHeader
          eyebrow="Pelaporan"
          title="Muat Naik Bahan MJKD"
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

  const [sektor, pilihan] = await Promise.all([
    listSektorCadangan(),
    Promise.resolve(pilihanTarikhPembentangan(hariMesyuarat(mesyuarat))),
  ]);

  return (
    <PublicPageShell narrow>
      <PageHeader
        eyebrow="Pelaporan"
        title={`Muat Naik Bahan MJKD ${labelMesyuarat(mesyuarat)}`}
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
          ← Maklum balas MJKD
        </Link>
      </p>
    </PublicPageShell>
  );
}
