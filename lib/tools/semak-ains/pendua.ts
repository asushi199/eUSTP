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

function bilanganBuku(kumpulan: InputPendua[]): number {
  const wakil: string[] = [];
  for (const r of kumpulan) if (!wakil.some((w) => bukuSama(w, r.tajukN))) wakil.push(r.tajukN);
  return wakil.length;
}

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
    const buku = bilanganBuku(g);
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
      const lain = g.filter((x) => x !== r && x.murid !== r.murid);
      if (lain.length === 0) continue;
      if (lain.every((x) => x.kelas === r.kelas && x.tarikh === r.tarikh)) h.aktivitiKelas = true;
      else h.samaMuridLain = true;
    }
  }

  const ikutMurid = new Map<string, InputPendua[]>();
  for (const r of rekod) {
    const g = ikutMurid.get(r.murid);
    if (g) g.push(r);
    else ikutMurid.set(r.murid, [r]);
  }
  for (const g of ikutMurid.values()) {
    if (g.length < 2) continue;
    for (const r of g) {
      const sama = g.filter((x) => x !== r && bukuSama(x.tajukN, r.tajukN));
      if (sama.length === 0) continue;
      const h = hasil.get(r.id)!;
      if (r.rumusanN && sama.some((x) => x.rumusanN === r.rumusanN)) h.hantarSemulaSama = true;
      else h.bukuSamaBerulang = true;
    }
  }
  return hasil;
}
