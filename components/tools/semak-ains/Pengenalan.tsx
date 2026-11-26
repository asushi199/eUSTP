import Link from "next/link";
import { NAMA_PENANDA } from "@/lib/tools/semak-ains/nama";
import { Ikon, TitikWarna } from "./Ui";
import { WARNA_STATUS } from "./warna";

const LANGKAH = [
  {
    tajuk: "Pasang penanda",
    teks: `Seret butang ${NAMA_PENANDA} ke bar penanda Chrome/Edge. Sekali sahaja bagi setiap pelayar.`,
  },
  {
    tajuk: "Buka AINS",
    teks: "Log masuk ains.moe.gov.my sebagai guru dan buka Papan Pemuka.",
  },
  {
    tajuk: "Klik penanda",
    teks: "Halaman ini dibuka semula dan bersambung dengan tab AINS anda.",
  },
];

const MAKSUD = {
  hijau: "Memenuhi standard daerah — boleh diluluskan secara pukal.",
  kuning: "Ada tanda (cth. agak pendek, sama dengan murid lain) — lihat dahulu.",
  merah: "Tidak memenuhi standard — ditolak dengan komen yang dijana untuk murid.",
} as const;

/** Paparan apabila halaman dibuka terus (bukan melalui penanda dalam tab AINS). */
export default function Pengenalan() {
  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-ink">Mula dalam 3 langkah</h2>
        <p className="mt-1.5 text-sm text-graphite">
          Halaman ini perlu dibuka melalui penanda {NAMA_PENANDA} dari tab AINS.
        </p>
        <ol className="mt-6 space-y-5">
          {LANGKAH.map((l, i) => (
            <li key={l.tajuk} className="flex gap-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">
                {i + 1}
              </span>
              <div className="pt-1">
                <p className="font-semibold text-ink">{l.tajuk}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-graphite">{l.teks}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href="/tools/semak-ains/pasang" className="btn-primary mt-8">
          Pasang penanda
        </Link>
      </section>

      <aside className="card flex flex-col p-6 sm:p-8">
        <h2 className="font-semibold text-ink">Setiap rekod dikelaskan kepada</h2>
        <ul className="mt-5 flex-1 space-y-4">
          {(["hijau", "kuning", "merah"] as const).map((w) => (
            <li key={w} className="flex gap-3">
              <TitikWarna warna={w} className="mt-1.5" />
              <div>
                <p className="text-sm font-semibold" style={{ color: WARNA_STATUS[w].teks }}>
                  {WARNA_STATUS[w].label}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-graphite">{MAKSUD[w]}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex gap-3 border-t border-fog pt-5 text-xs leading-relaxed text-graphite">
          <Ikon nama="kunci" className="mt-0.5 text-ink" />
          <p>
            Semakan berlaku dalam pelayar anda. Teks dan nama murid tidak dihantar ke NEXa — hanya bilangan rekod
            direkod untuk pemantauan.
          </p>
        </div>
      </aside>
    </div>
  );
}
