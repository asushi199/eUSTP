import { STATUS_MJKD, STATUS_MJKD_LABEL } from "@/lib/mjkd/enums";
import type { Analisis } from "@/lib/mjkd/pembentangan";

/** Jadual analisis maklum balas: satu baris setiap perkara aktif. */
export default function TabelAnalisisMjkd({ analisis }: { analisis: Analisis }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-lg font-semibold text-ink">Analisis maklum balas</h3>
        <p className="text-sm font-semibold tabular-nums text-charcoal">
          Sekolah telah menghantar: {analisis.sekolahDihantar} / {analisis.sekolahJumlah}
        </p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
              <th className="px-4 py-3 font-semibold">Para</th>
              <th className="px-4 py-3 font-semibold">Perkara</th>
              {STATUS_MJKD.map((s) => (
                <th key={s} className="px-3 py-3 text-right font-semibold">
                  {STATUS_MJKD_LABEL[s]}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold">Dihantar</th>
            </tr>
          </thead>
          <tbody>
            {analisis.baris.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-graphite">
                  Belum ada perkara aktif.
                </td>
              </tr>
            ) : (
              analisis.baris.map((b) => (
                <tr key={b.perkaraId} className="border-b hairline last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {b.para}
                    {b.mukaSurat ? (
                      <span className="block text-xs font-normal text-graphite">m/s {b.mukaSurat}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{b.perkaraRingkas}</td>
                  {STATUS_MJKD.map((s) => (
                    <td key={s} className="px-3 py-3 text-right tabular-nums">
                      {b.bilangan[s]}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                    {b.dihantar} / {b.dijangka}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
