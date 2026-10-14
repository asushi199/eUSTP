import type { Metadata } from "next";
import Link from "next/link";
import MjkdTicketActions from "@/components/mjkd/MjkdTicketActions";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { getSchoolByCode } from "@/lib/mjkd/queries";

export const metadata: Metadata = {
  title: "Maklum balas dihantar — MJKD",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ kod?: string; resit?: string }>;
};

export default async function LaporanMjkdBerjayaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const kod = (sp.kod ?? "").trim().toUpperCase();
  const resit = (sp.resit ?? "").trim().toUpperCase();
  const school = kod ? await getSchoolByCode(kod) : null;

  return (
    <PublicPageShell narrow>
      <PageHeader
        eyebrow="Pelaporan"
        title="Maklum balas berjaya dihantar"
        accent="#0E7490"
        description="Simpan nombor tiket sekarang. Ia diperlukan untuk mengemaskini maklum balas."
      />
      <div className="card mt-8 space-y-4 p-6">
        <div className="rounded-xl border border-fog bg-cloud/60 px-4 py-3 text-sm text-charcoal print:border-0 print:bg-transparent print:px-0">
          <p className="font-semibold text-ink">Penting: simpan nombor tiket anda sekarang</p>
          <p className="mt-1">
            Salin, muat turun fail teks, atau cetak halaman ini. Tiada carian awam jika
            nombor tiket hilang — hubungi PPD Manjung untuk bantuan.
          </p>
        </div>

        <p className="text-sm text-graphite">Sekolah</p>
        <p className="text-lg font-semibold">
          {kod || "—"}
          {school ? ` — ${school.name}` : ""}
        </p>
        <div>
          <p className="text-sm text-graphite">Nombor tiket</p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-wider text-ink">
            {resit || "—"}
          </p>
        </div>

        <MjkdTicketActions schoolCode={kod} schoolName={school?.name} ticket={resit} />

        <p className="text-sm text-graphite">
          Maklum balas yang baik mungkin dipilih untuk dibaca pada mesyuarat akan datang.
        </p>
        <div className="flex flex-wrap gap-3 pt-2 print:hidden">
          <Link
            href={`/laporan-mjkd/semak?kod=${encodeURIComponent(kod)}`}
            className="btn-outline-ink"
          >
            Semak maklum balas
          </Link>
          <Link href="/laporan-mjkd" className="btn-outline-ink">
            Kembali
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
