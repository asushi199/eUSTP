import { adaHan, adaTamil, kesanBahasa } from "./bahasa";
import type { Keputusan, KodMaklumat, KodSebab, RekodAins, Warna } from "./jenis";
import { normalTeks, tarikhHantar } from "./normal";
import { ukuranUntuk, ukurPanjang } from "./panjang";
import { kesanPendua } from "./pendua";
import { adaSimbolPengisi, kesanRawak } from "./rawak";
import type { ModPeraturan, Standard } from "./standard";
import { huraiKelas } from "./tahap";

const UNSUR_PENGAJARAN =
  /(should|must|learn|lesson|teach|important|never|always|don't|do not|we can|kita|jangan|pengajaran|mengajar|perlulah|hendaklah|mestilah|应该|要|不要|不能|学会|学习|教导|明白|懂得|告诉我们|让我|வேண்டும்|கூடாது)/i;
const FRASA_AI =
  /(delves?|tapestry|thought-provoking|profound|masterful|underscores?|poignant|resonates?|serves as a (?:powerful )?reminder|testament to|intricate|captivating|颠覆传统|生动地展现|发人深省|淋漓尽致)/i;

function ikutMod(mod: ModPeraturan, kod: KodSebab, merah: KodSebab[], kuning: KodSebab[]): void {
  if (mod === "merah") merah.push(kod);
  else if (mod === "kuning") kuning.push(kod);
}

/** Semak semua rekod dalam satu kelompok dan kelaskan kepada hijau/kuning/merah (spesifikasi §6). */
export function semak(rekod: RekodAins[], standard: Standard): Keputusan[] {
  const pendua = kesanPendua(
    rekod.map((r) => ({
      id: r.id,
      murid: r.murid,
      kelas: r.kelas,
      tarikh: tarikhHantar(r.meta),
      tajukN: normalTeks(r.tajuk),
      rumusanN: normalTeks(r.rumusan),
    })),
  );
  const bilMurid = new Map<string, number>();
  for (const r of rekod) {
    const k = `${r.murid}|${r.kelas}`;
    bilMurid.set(k, (bilMurid.get(k) ?? 0) + 1);
  }

  return rekod.map((r) => {
    const teks = `${r.rumusan} ${r.pengajaran}`;
    const bahasa = kesanBahasa(teks);
    const ukuran = ukuranUntuk(bahasa);
    const tahap = huraiKelas(r.kelas);
    const ambang = standard.ambang[ukuran][tahap.jalur];
    const panjang = ukurPanjang(teks, bahasa);
    const merah: KodSebab[] = [];
    const kuning: KodSebab[] = [];
    const maklumat: KodMaklumat[] = [];

    const min = standard.minRuangan[ukuran];
    if (ukurPanjang(r.rumusan, bahasa) < min || ukurPanjang(r.pengajaran, bahasa) < min) {
      merah.push("ruangan-kosong");
    }
    if (panjang < ambang.merah) merah.push("terlalu-pendek");
    else if (panjang < ambang.kuning) kuning.push("agak-pendek");

    const p = pendua.get(r.id)!;
    if (p.templat) merah.push("templat");
    if (p.sama2Buku) kuning.push("rumusan-sama-2-buku");
    if (p.samaMuridLain || (p.aktivitiKelas && standard.aktivitiKelas === "kuning")) {
      kuning.push("sama-murid-lain");
    }
    const rumusanN = normalTeks(r.rumusan);
    if (rumusanN && rumusanN === normalTeks(r.pengajaran)) merah.push("rumusan-sama-pengajaran");
    if (p.hantarSemulaSama) ikutMod(standard.hantarSemulaSama, "hantar-semula-sama", merah, kuning);
    if (p.bukuSamaBerulang) ikutMod(standard.bukuSamaBerulang, "buku-sama-berulang", merah, kuning);

    if (kesanRawak(teks, bahasa)) merah.push("teks-rawak");
    if (adaSimbolPengisi(teks)) kuning.push("simbol-pengisi");
    if (
      standard.bahasaTakSepadan &&
      ((adaHan(r.tajuk) && bahasa !== "zh") || (adaTamil(r.tajuk) && !adaTamil(teks)))
    ) {
      merah.push("bahasa-tak-sepadan");
    }
    const BAHASA_TETAP = ["bm", "en", "zh", "ta"];
    const bhsRumusan = kesanBahasa(r.rumusan);
    const bhsPengajaran = kesanBahasa(r.pengajaran);
    if (
      BAHASA_TETAP.includes(bhsRumusan) &&
      BAHASA_TETAP.includes(bhsPengajaran) &&
      bhsRumusan !== bhsPengajaran
    ) {
      ikutMod(standard.bahasaBercampur, "bahasa-bercampur", merah, kuning);
    }
    if (standard.semakUnsurPengajaran && !UNSUR_PENGAJARAN.test(r.pengajaran)) {
      kuning.push("tiada-unsur-pengajaran");
    }

    if ((bilMurid.get(`${r.murid}|${r.kelas}`) ?? 0) > standard.ambangMuridLuarBiasa) maklumat.push("murid-luar-biasa");
    if (FRASA_AI.test(teks)) maklumat.push("frasa-ai");

    const warna: Warna = merah.length ? "merah" : kuning.length ? "kuning" : "hijau";
    const tandaBuku = [...merah, ...kuning].some((k) => k === "hantar-semula-sama" || k === "buku-sama-berulang");
    return {
      id: r.id,
      warna,
      merah,
      kuning,
      maklumat,
      bahasa,
      jalur: tahap.jalur,
      kodTahap: tahap.kod,
      panjang,
      ...(tandaBuku && p.padanBuku.length ? { padanBuku: p.padanBuku } : {}),
    };
  });
}

export type Ringkasan = { jumlah: number; hijau: number; kuning: number; merah: number };

export function ringkaskan(k: Keputusan[]): Ringkasan {
  const r: Ringkasan = { jumlah: k.length, hijau: 0, kuning: 0, merah: 0 };
  for (const x of k) r[x.warna] += 1;
  return r;
}
