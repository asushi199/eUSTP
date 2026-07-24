import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { getModuleAccent } from "@/lib/module-theme";

export const metadata: Metadata = {
  title: "Peminjaman Peralatan — CoE Booking — eUSTP Manjung",
  description: "Perkhidmatan peminjaman peralatan USTP akan disediakan tidak lama lagi.",
};

export default function PeminjamanPeralatanPage() {
  const accent = getModuleAccent("/tempahan/peralatan");

  return (
    <PublicPageShell narrow>
      <Link href="/tempahan" className="text-sm text-graphite hover:text-ink">
        ← CoE Booking
      </Link>
      <PageHeader
        eyebrow="CoE Booking"
        title="Peminjaman Peralatan"
        accent={accent}
        description="Perkhidmatan peminjaman peralatan USTP akan disediakan tidak lama lagi."
        className="mt-2"
      />
      <div className="card mt-8 p-6 text-center">
        <p className="text-lg font-semibold text-ink">Akan datang</p>
        <p className="mt-2 text-sm text-graphite">
          Sila kembali semula untuk menggunakan perkhidmatan ini.
        </p>
      </div>
    </PublicPageShell>
  );
}
