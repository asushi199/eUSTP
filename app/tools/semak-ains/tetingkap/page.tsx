import type { Metadata } from "next";
import SemakAinsApp from "@/components/tools/semak-ains/SemakAinsApp";
import { NAMA_ALAT } from "@/lib/tools/semak-ains/nama";

export const metadata: Metadata = {
  title: NAMA_ALAT,
  robots: { index: false, follow: false },
};

/**
 * Paparan SahPantas di dalam tetingkap penanda (iframe dalam tetingkap berasal AINS — lihat
 * public/tools/semak-ains/penanda.js). Sengaja di luar kumpulan (public): tiada bar sisi, menu
 * atau kaki, supaya GPM tidak boleh menavigasi keluar daripada alat di dalam bingkai. Hanya AINS
 * dibenarkan membingkai laluan ini (frame-ancestors dalam next.config.mjs).
 */
export default function SemakAinsTetingkapPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-fog">
        <div className="mx-auto flex w-full max-w-6xl items-baseline justify-between gap-4 px-4 py-4 sm:px-8">
          <h1 className="text-lg font-semibold tracking-tight text-ink">{NAMA_ALAT}</h1>
          <p className="text-xs text-graphite">CoE Tools · NEXa Manjung</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-8">
        <SemakAinsApp />
      </main>
    </div>
  );
}
