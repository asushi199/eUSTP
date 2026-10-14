/**
 * MJKD 2026 ialah SATU acara (mesyuarat 21–22 Okt): kehadiran, minit + maklum balas perkara
 * tindakan, dan bahan pembentangan semuanya pada satu rekod `mjkd_mesyuarat`. Minit dan perkara
 * tindakan itu berasal daripada Bil.1/2026 — label rujukannya di sini (modul 2026 sahaja).
 */
export const NAMA_ACARA = "MJKD 2026";
export const NAMA_PENUH_ACARA = "Mesyuarat Jawatankuasa Kurikulum Daerah Manjung 2026";

export const MINIT_RUJUKAN = {
  label: "Bil.1/2026",
  tarikh: "2026-02-27",
  tempat: "Park Avenue Hotel, Sungai Petani Kedah",
} as const;

const BULAN = [
  "Januari",
  "Februari",
  "Mac",
  "April",
  "Mei",
  "Jun",
  "Julai",
  "Ogos",
  "September",
  "Oktober",
  "November",
  "Disember",
];

function pecah(iso: string): [number, number, number] | null {
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? [y, m, d] : null;
}

/** "21–22 Oktober 2026", "31 Oktober – 1 November 2026" atau "21 Oktober 2026". */
export function julatTarikh(mula: string, tamat: string | null): string {
  const a = pecah(mula);
  if (!a) return mula;
  const b = tamat && tamat > mula ? pecah(tamat) : null;
  if (!b) return `${a[2]} ${BULAN[a[1] - 1]} ${a[0]}`;
  if (a[0] === b[0] && a[1] === b[1]) return `${a[2]}–${b[2]} ${BULAN[a[1] - 1]} ${a[0]}`;
  if (a[0] === b[0]) return `${a[2]} ${BULAN[a[1] - 1]} – ${b[2]} ${BULAN[b[1] - 1]} ${b[0]}`;
  return `${a[2]} ${BULAN[a[1] - 1]} ${a[0]} – ${b[2]} ${BULAN[b[1] - 1]} ${b[0]}`;
}

export type FasaAcara =
  | { jenis: "akan"; hari: number }
  | { jenis: "berlangsung"; hariKe: number; jumlah: number }
  | { jenis: "selesai" };

/** Fasa acara berbanding `hariIni` (YYYY-MM-DD, waktu KL). */
export function fasaAcara(mula: string, tamat: string | null, hariIni: string): FasaAcara {
  const t = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
  const akhir = tamat && tamat > mula ? tamat : mula;
  if (hariIni < mula) return { jenis: "akan", hari: Math.round((t(mula) - t(hariIni)) / 86_400_000) };
  if (hariIni > akhir) return { jenis: "selesai" };
  return {
    jenis: "berlangsung",
    hariKe: Math.round((t(hariIni) - t(mula)) / 86_400_000) + 1,
    jumlah: Math.round((t(akhir) - t(mula)) / 86_400_000) + 1,
  };
}
