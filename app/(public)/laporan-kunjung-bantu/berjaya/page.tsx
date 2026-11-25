import type { Metadata } from "next";
import Link from "next/link";
import MjkdTicketActions from "@/components/mjkd/MjkdTicketActions";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { withDbTimeout } from "@/lib/db";
import { ACCENT_KUNJUNG_BANTU, NAMA_INSTRUMEN } from "@/lib/kunjung-bantu/instrumen";
import { getSekolah } from "@/lib/kunjung-bantu/queries";

export const metadata: Metadata = {
  title: `Instrumen dihantar — ${NAMA_INSTRUMEN}`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ kod?: string; resit?: string; kemaskini?: string }>;
};

export default async function KunjungBantuBerjayaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const kod = (sp.kod ?? "").trim().toUpperCase();
  const resit = (sp.resit ?? "").trim().toUpperCase();
  // Nombor tiket datang daripada URL dan MESTI sentiasa dipaparkan; nama sekolah hanyalah hiasan.
  let nama: string | null = null;
  if (kod) {
    try {
      nama = (await withDbTimeout(getSekolah(kod)))?.name ?? null;
    } catch {
      nama = null;
    }
  }
  const qs = `kod=${encodeURIComponent(kod)}&resit=${encodeURIComponent(resit)}`;

  return (
    <PublicPageShell narrow>
      <PageHeader
        eyebrow={NAMA_INSTRUMEN}
        title={sp.kemaskini === "1" ? "Instrumen berjaya dikemas kini" : "Instrumen berjaya dihantar"}
        accent={ACCENT_KUNJUNG_BANTU}
        description="Simpan nombor tiket sekarang. Ia diperlukan untuk semak status, kemaskini dan cetak."
      />
      <div className="card mt-8 space-y-4 p-6">
        <div className="rounded-xl border border-fog bg-cloud/60 px-4 py-3 text-sm text-charcoal print:border-0 print:bg-transparent print:px-0">
          <p className="font-semibold text-ink">Penting: simpan nombor tiket anda sekarang</p>
          <p className="mt-1">
            Salin, muat turun fail teks, atau cetak halaman ini. Jika nombor tiket hilang, hubungi
            USTP PPD Manjung.
          </p>
        </div>
        <p className="text-sm text-graphite">Sekolah</p>
        <p className="text-lg font-semibold">
          {kod || "—"}
          {nama ? ` — ${nama}` : ""}
        </p>
        <div>
          <p className="text-sm text-graphite">Nombor tiket</p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-wider text-ink">{resit || "—"}</p>
        </div>
        <MjkdTicketActions
          schoolCode={kod}
          schoolName={nama}
          ticket={resit}
          tajuk={NAMA_INSTRUMEN}
          awalanFail="tiket-kunjung-bantu"
        />
        <p className="text-sm text-graphite">
          Langkah seterusnya: pegawai USTP PPD Manjung akan melawat sekolah untuk menyemak bukti.
          Status semakan boleh dilihat di halaman Semak.
        </p>
        <div className="flex flex-wrap gap-3 pt-2 print:hidden">
          <Link href={`/laporan-kunjung-bantu/semak?${qs}`} className="btn-outline-ink">
            Semak status
          </Link>
          <Link href={`/cetak/kunjung-bantu?${qs}`} className="btn-outline-ink" target="_blank">
            Cetak instrumen
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
