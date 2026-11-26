import type { ReactNode } from "react";
import { NAMA_PENANDA } from "@/lib/tools/semak-ains/nama";
import ButangPenanda from "./ButangPenanda";
import { Ikon, TitikWarna } from "./Ui";
import { WARNA_STATUS } from "./warna";

const MAKSUD = {
  hijau: "Memenuhi standard daerah — boleh diluluskan secara pukal.",
  kuning: "Ada tanda (cth. agak pendek, sama dengan murid lain) — lihat dahulu.",
  merah: "Tidak memenuhi standard — ditolak dengan komen yang dijana untuk murid.",
} as const;

function Langkah({ n, tajuk, children }: { n: number; tajuk: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">{n}</span>
      <div className="min-w-0 flex-1 pt-1">
        <p className="font-semibold text-ink">{tajuk}</p>
        <div className="mt-0.5 text-sm leading-relaxed text-graphite">{children}</div>
      </div>
    </li>
  );
}

/**
 * Paparan apabila halaman dibuka terus (bukan melalui penanda dalam tab AINS):
 * pasang penanda + cara guna dalam satu halaman. Alat hanya berfungsi apabila
 * dibuka oleh penanda kerana data dibaca daripada tab AINS (NEXa tiada sesi AINS).
 */
export default function Pengenalan() {
  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-ink">Mula dalam 3 langkah</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-graphite">
          Alat ini membaca rekod daripada tab AINS anda, jadi ia dibuka melalui penanda {NAMA_PENANDA} — pasang
          sekali sahaja.
        </p>
        <ol className="mt-6 space-y-6">
          <Langkah n={1} tajuk="Pasang penanda">
            <p>Seret butang ini ke bar penanda (di bawah bar alamat pelayar).</p>
            <ButangPenanda />
          </Langkah>
          <Langkah n={2} tajuk="Buka AINS">
            Log masuk ains.moe.gov.my sebagai guru dan buka Papan Pemuka.
          </Langkah>
          <Langkah n={3} tajuk={`Klik penanda ${NAMA_PENANDA}`}>
            Benarkan pop-up jika diminta. Tab {NAMA_PENANDA} dibuka dan bersambung dengan AINS — pilih tahap/kelas,
            kemudian tekan Mula baca. Tab AINS boleh terus digunakan atau dimuat semula seperti biasa.
          </Langkah>
        </ol>
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
        <div className="mt-6 space-y-3 border-t border-fog pt-5 text-xs leading-relaxed text-graphite">
          <p className="flex gap-3">
            <Ikon nama="kunci" className="mt-0.5 text-ink" />
            <span>
              Semakan berlaku dalam pelayar anda. Teks dan nama murid tidak dihantar ke NEXa — hanya bilangan rekod
              direkod untuk pemantauan.
            </span>
          </p>
          <p className="flex gap-3">
            <Ikon nama="info" className="mt-0.5 text-ink" />
            <span>
              Chrome/Edge komputer sahaja. Kelulusan dan penolakan dibuat atas nama akaun AINS anda; tanggungjawab
              pengesahan kekal pada GPM.
            </span>
          </p>
        </div>
      </aside>
    </div>
  );
}
