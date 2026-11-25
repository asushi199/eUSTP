import type { Metadata } from "next";
import CetakDraf from "@/components/kunjung-bantu/CetakDraf";
import { NAMA_INSTRUMEN } from "@/lib/kunjung-bantu/instrumen";

export const metadata: Metadata = {
  title: `Cetak draf — ${NAMA_INSTRUMEN}`,
  robots: { index: false, follow: false },
};

/**
 * Cetak draf A4 (belum dihantar). Data dibaca daripada localStorage peranti yang mengisi
 * borang — tiada akses DB, jadi tiada semakan tiket diperlukan.
 */
export default function CetakDrafKunjungBantuPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-6 print:p-0">
      <CetakDraf />
    </main>
  );
}
