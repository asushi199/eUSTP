import { bukuSama } from "./normal";

export type InputPendua = {
  id: string;
  murid: string;
  kelas: string;
  tarikh: string;
  /** Tajuk dinormalkan (normalTeks). */
  tajukN: string;
  /** Rumusan dinormalkan (normalTeks). */
  rumusanN: string;
};

export type HasilPendua = {
  templat: boolean;
  sama2Buku: boolean;
  samaMuridLain: boolean;
  aktivitiKelas: boolean;
  hantarSemulaSama: boolean;
  bukuSamaBerulang: boolean;
};

const MIN_RUMUSAN_PENDUA = 40;

/** Kelompokkan rekod mengikut buku (bukuSama); wakil = tajuk rekod pertama kelompok. */
function kelompokBuku(kumpulan: InputPendua[]): InputPendua[][] {
  const kelompok: InputPendua[][] = [];
  for (const r of kumpulan) {
    const k = kelompok.find((g) => bukuSama(g[0]!.tajukN, r.tajukN));
    if (k) k.push(r);
    else kelompok.push([r]);
  }
  return kelompok;
}

/** Murid dikenal melalui nama + kelas (nama sama dalam kelas berbeza ialah murid berlainan). */
const kunciMurid = (r: InputPendua): string => `${r.murid}|${r.kelas}`;

/** Kesan templat, pendua merentas murid, aktiviti kelas dan hantaran semula (spesifikasi §6). */
export function kesanPendua(rekod: InputPendua[]): Map<string, HasilPendua> {
  const hasil = new Map<string, HasilPendua>(
    rekod.map((r) => [
      r.id,
      {
        templat: false,
        sama2Buku: false,
        samaMuridLain: false,
        aktivitiKelas: false,
        hantarSemulaSama: false,
        bukuSamaBerulang: false,
      },
    ]),
  );

  const ikutRumusan = new Map<string, InputPendua[]>();
  for (const r of rekod) {
    if (r.rumusanN.length < MIN_RUMUSAN_PENDUA) continue;
    const g = ikutRumusan.get(r.rumusanN);
    if (g) g.push(r);
    else ikutRumusan.set(r.rumusanN, [r]);
  }
  for (const g of ikutRumusan.values()) {
    if (g.length < 2) continue;
    const kelompok = kelompokBuku(g);
    const buku = kelompok.length;
    const D = kelompok.reduce((p, k) => (k.length > p.length ? k : p), kelompok[0]!);
    const satuKelasHari = g.every((x) => x.kelas === g[0]!.kelas && x.tarikh === g[0]!.tarikh);
    if (satuKelasHari && buku > 1 && D.length >= 2 && D.length * 2 >= g.length) {
      /* Aktiviti kelas: segelintir murid mengubah tajuk — bukan templat. */
      for (const r of g) {
        const h = hasil.get(r.id)!;
        if (D.includes(r)) {
          if (D.some((x) => kunciMurid(x) !== kunciMurid(r))) h.aktivitiKelas = true;
        } else {
          h.samaMuridLain = true;
        }
      }
      continue;
    }
    for (const r of g) {
      const h = hasil.get(r.id)!;
      if (buku >= 3) {
        h.templat = true;
        continue;
      }
      if (buku === 2) {
        h.sama2Buku = true;
        continue;
      }
      const lain = g.filter((x) => x !== r && kunciMurid(x) !== kunciMurid(r));
      if (lain.length === 0) continue;
      if (lain.every((x) => x.kelas === r.kelas && x.tarikh === r.tarikh)) h.aktivitiKelas = true;
      else h.samaMuridLain = true;
    }
  }

  const ikutMurid = new Map<string, InputPendua[]>();
  for (const r of rekod) {
    const k = kunciMurid(r);
    const g = ikutMurid.get(k);
    if (g) g.push(r);
    else ikutMurid.set(k, [r]);
  }
  for (const g of ikutMurid.values()) {
    if (g.length < 2) continue;
    for (const r of g) {
      const sama = g.filter((x) => x !== r && bukuSama(x.tajukN, r.tajukN));
      if (sama.length === 0) continue;
      const h = hasil.get(r.id)!;
      if (r.rumusanN && sama.some((x) => x.rumusanN === r.rumusanN)) {
        /* Salinan pertama (ikut urutan input) tidak ditanda; hanya salinan kemudian. */
        if (sama.some((x) => x.rumusanN === r.rumusanN && g.indexOf(x) < g.indexOf(r))) {
          h.hantarSemulaSama = true;
        }
      } else {
        h.bukuSamaBerulang = true;
      }
    }
  }
  return hasil;
}
