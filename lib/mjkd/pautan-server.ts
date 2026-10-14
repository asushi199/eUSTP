import "server-only";

import { isPautanPendekCanva, terbitkanUrlEmbed } from "./bahan";

/**
 * Pautan pendek Canva (canva.link / canva.com/link) -> URL reka bentuk penuh supaya boleh dibenam.
 * Ikut redirect secara manual (maks 4 lompatan, 5 s setiap satu); gagal = kekalkan pautan asal.
 * Dipanggil DI LUAR `withDbTimeout` (rangkaian luar tidak boleh memakan had masa DB).
 */
export async function huraiPautanPendek(url: string): Promise<string> {
  if (!isPautanPendekCanva(url)) return url;
  let semasa = url;
  try {
    for (let i = 0; i < 4; i += 1) {
      const res = await fetch(semasa, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
      });
      const lokasi = res.headers.get("location");
      if (!lokasi || res.status < 300 || res.status >= 400) break;
      semasa = new URL(lokasi, semasa).toString();
      if (terbitkanUrlEmbed(semasa)) return semasa;
    }
  } catch {
    /* rangkaian gagal — guna pautan asal */
  }
  return terbitkanUrlEmbed(semasa) ? semasa : url;
}

/** Huraikan pautan pendek Canva dalam bukti maklum balas (selari; setiap satu ≤ ~5 s). */
export async function huraiPautanBukti<T extends { pautanBukti: string }>(items: T[]): Promise<T[]> {
  return Promise.all(
    items.map(async (it) =>
      isPautanPendekCanva(it.pautanBukti) ? { ...it, pautanBukti: await huraiPautanPendek(it.pautanBukti) } : it,
    ),
  );
}
