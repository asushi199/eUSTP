import type { Ringkasan } from "@/lib/tools/semak-ains/peraturan";
import { WARNA_STATUS } from "./warna";

export default function RingkasanWarna({ ringkasan }: { ringkasan: Ringkasan }) {
  const pct = (n: number) => (ringkasan.jumlah ? Math.round((n / ringkasan.jumlah) * 100) : 0);
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {(["hijau", "kuning", "merah"] as const).map((w) => (
        <div key={w} className="card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: WARNA_STATUS[w].teks }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: WARNA_STATUS[w].warna }} aria-hidden />
            {WARNA_STATUS[w].label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {ringkasan[w].toLocaleString("ms-MY")}
          </p>
          <p className="text-xs text-graphite">
            {pct(ringkasan[w])}% daripada {ringkasan.jumlah.toLocaleString("ms-MY")} rekod
          </p>
        </div>
      ))}
    </section>
  );
}
