import type { Metadata } from "next";
import Link from "next/link";
import KehadiranMjkdForm from "@/components/mjkd/KehadiranMjkdForm";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { listSchoolOptions } from "@/lib/direktori/queries";
import { formatTarikhMs, labelMesyuarat } from "@/lib/mjkd/enums";
import { getMesyuaratKehadiranDibuka } from "@/lib/mjkd/queries";

export const metadata: Metadata = {
  title: "Kehadiran MJKD — NEXa Manjung",
  description: "Sahkan kehadiran anda ke Mesyuarat Jawatankuasa Kurikulum Daerah.",
};

export const dynamic = "force-dynamic";

const ACCENT = "#0E7490";

export default async function HadirMjkdPage() {
  const mesyuarat = await getMesyuaratKehadiranDibuka();

  if (!mesyuarat) {
    return (
      <PublicPageShell narrow>
        <PageHeader
          eyebrow="Pelaporan"
          title="Kehadiran MJKD"
          accent={ACCENT}
          description="Sahkan kehadiran anda ke Mesyuarat Jawatankuasa Kurikulum Daerah."
        />
        <div className="card mt-8 p-6">
          <p className="font-semibold text-ink">Kehadiran belum dibuka</p>
          <p className="mt-1 text-sm text-graphite">
            Imbas semula kod QR apabila mesyuarat bermula, atau hubungi urusetia.
          </p>
        </div>
      </PublicPageShell>
    );
  }

  const schools = await listSchoolOptions();

  return (
    <PublicPageShell narrow>
      <PageHeader
        eyebrow="Pelaporan"
        title={`Kehadiran MJKD ${labelMesyuarat(mesyuarat)}`}
        accent={ACCENT}
        description={[formatTarikhMs(mesyuarat.tarikh), mesyuarat.tempat].filter(Boolean).join(" · ")}
      />
      <div className="mt-8">
        <KehadiranMjkdForm
          mesyuarat={{ id: mesyuarat.id, bil: mesyuarat.bil, tahun: mesyuarat.tahun }}
          schools={schools}
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
