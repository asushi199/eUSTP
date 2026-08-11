import type { Metadata } from "next";
import Link from "next/link";
import TicketSaveActions from "@/components/laporan-akhbar/TicketSaveActions";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { getSchoolByCode } from "@/lib/laporan-akhbar/queries";

export const metadata: Metadata = {
  title: "Tinjauan dihantar — Laporan Akhbar",
};

type Props = {
  searchParams: Promise<{ kod?: string; resit?: string }>;
};

export default async function LaporanAkhbarBerjayaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const kod = (sp.kod ?? "").trim().toUpperCase();
  const resit = (sp.resit ?? "").trim().toUpperCase();
  const school = kod ? await getSchoolByCode(kod) : null;

  return (
    <PublicPageShell narrow>
      <PageHeader
        eyebrow="Pelaporan"
        title="Tinjauan berjaya dihantar"
        accent="#024ad8"
        description="Simpan nombor tiket sekarang. Ia diperlukan untuk mengemaskini atau menyemak status."
      />
      <div className="card mt-8 space-y-4 p-6">
        <div className="rounded-xl border border-fog bg-cloud/60 px-4 py-3 text-sm text-charcoal print:border-0 print:bg-transparent print:px-0">
          <p className="font-semibold text-ink">
            Penting: simpan nombor tiket anda sekarang
          </p>
          <p className="mt-1">
            Salin, muat turun fail teks, atau cetak halaman ini. Tiada carian awam
            jika nombor tiket hilang — hubungi PPD Manjung untuk bantuan.
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

        <TicketSaveActions
          schoolCode={kod}
          schoolName={school?.name}
          ticket={resit}
        />

        <p className="text-sm text-graphite">
          PPD Manjung akan menyemak maklumat anda. Sila tunggu pemberitahuan jika
          pembetulan diperlukan.
        </p>
        <div className="flex flex-wrap gap-3 pt-2 print:hidden">
          <Link
            href={`/laporan-akhbar/semak?kod=${encodeURIComponent(kod)}`}
            className="btn-primary"
          >
            Semak status
          </Link>
          <Link href="/laporan-akhbar" className="btn-outline-ink">
            Borang baharu
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
