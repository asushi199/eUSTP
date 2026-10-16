const BULAN_PENUH = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember",
];

/** Hari berbaki hingga tarikh akhir (waktu Malaysia); negatif = sudah lepas. */
function hariBerbaki(iso: string): number {
  const hariIni = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
  return Math.round((Date.parse(iso) - Date.parse(hariIni)) / 86_400_000);
}

/** Jalur dakwat gelap: tarikh akhir + kiraan hari. `teks` = apa yang mesti siap. */
export default function TarikhAkhirBanner({ iso, teks }: { iso: string; teks: string }) {
  const [y, m, d] = iso.split("-").map(Number);
  const baki = hariBerbaki(iso);
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-ink px-4 py-3 text-white">
      <p className="flex items-center gap-2 text-base font-extrabold tracking-tight sm:text-lg">
        <span className="h-2 w-2 shrink-0 rounded-full bg-bloom-coral" aria-hidden />
        Tarikh akhir: {d} {BULAN_PENUH[m - 1]} {y}
      </p>
      <p className="text-sm font-semibold text-white/80" suppressHydrationWarning>
        {teks}
        {baki > 0 ? ` · lagi ${baki} hari` : baki === 0 ? " · hari ini" : " · tarikh akhir telah tamat"}
      </p>
    </div>
  );
}
