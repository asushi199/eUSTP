import { STATUS_MJKD, type StatusMjkd } from "./enums";
import { perkaraUntukSekolah, type PerkaraSasaran } from "./sasaran";

export type SekolahZon = { code: string; name: string; zone: string };

export type Kemajuan = {
  dijangka: number;
  dihantar: number;
  belum: SekolahZon[];
  belumMengikutZon: { zon: string; sekolah: SekolahZon[] }[];
};

/** Kumpul sekolah mengikut zon (PKG), zon tanpa nama di hujung; isih mengikut nama. */
export function kumpulMengikutZon(
  sekolah: readonly SekolahZon[],
): { zon: string; sekolah: SekolahZon[] }[] {
  const peta = new Map<string, SekolahZon[]>();
  for (const s of sekolah) {
    const zon = s.zone.trim() || "Tiada zon";
    const senarai = peta.get(zon) ?? [];
    senarai.push(s);
    peta.set(zon, senarai);
  }
  return [...peta.entries()]
    .sort(([a], [b]) => {
      if (a === "Tiada zon") return 1;
      if (b === "Tiada zon") return -1;
      return a.localeCompare(b, "ms");
    })
    .map(([zon, senarai]) => ({
      zon,
      sekolah: [...senarai].sort((x, y) => x.name.localeCompare(y.name, "ms")),
    }));
}

/**
 * Kemajuan penghantaran: sekolah yang dijangka = sekolah yang mempunyai sekurang-kurangnya
 * satu perkara terpakai; sekolah belum hantar dikumpul mengikut zon.
 */
export function hitungKemajuan(
  sekolah: readonly SekolahZon[],
  perkara: readonly PerkaraSasaran[],
  kodSudahHantar: ReadonlySet<string>,
): Kemajuan {
  const dijangka = sekolah.filter((s) => perkaraUntukSekolah(perkara, s).length > 0);
  const belum = dijangka.filter((s) => !kodSudahHantar.has(s.code));
  return {
    dijangka: dijangka.length,
    dihantar: dijangka.length - belum.length,
    belum,
    belumMengikutZon: kumpulMengikutZon(belum),
  };
}

export type BilanganStatus = Record<StatusMjkd, number> & { jumlah: number };

/** Bilangan jawapan mengikut status. */
export function kiraStatus(items: readonly { status: string }[]): BilanganStatus {
  const out = { jumlah: 0 } as BilanganStatus;
  for (const s of STATUS_MJKD) out[s] = 0;
  for (const it of items) {
    if ((STATUS_MJKD as readonly string[]).includes(it.status)) {
      out[it.status as StatusMjkd] += 1;
      out.jumlah += 1;
    }
  }
  return out;
}
