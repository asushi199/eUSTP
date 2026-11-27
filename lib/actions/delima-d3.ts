"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { withDbTimeout } from "@/lib/db";
import { canManageKandungan, isKnownPeranan } from "@/lib/roles";
import { bacaMuatanD3 } from "@/lib/analisis/delima-d3-penanda";
import { prosesDelimaD3, RalatDataD3, type RingkasanD3 } from "@/lib/analisis/delima-d3-simpan";

export type HasilTerimaD3 =
  | { ok: true; ringkasan: RingkasanD3 }
  | { ok: false; kod: "log-masuk" | "tidak-dibenarkan" | "data" | "ralat"; error: string };

/**
 * Terima data penanda DELIMa d3 (`/penanda/delima-d3`). `simpan = false` = semak sahaja (pratonton);
 * `true` = tulis snapshot + batalkan cache. Halaman itu awam (supaya data penanda tidak hilang
 * semasa log masuk), jadi kebenaran disemak DI SINI tanpa `redirect()`: Admin/Pegawai sahaja.
 */
export async function terimaDelimaD3(raw: unknown, simpan: boolean): Promise<HasilTerimaD3> {
  const session = await auth();
  const user = session?.user;
  if (!user || user.authKind === "moe-dl" || !isKnownPeranan(user.peranan ?? "")) {
    return { ok: false, kod: "log-masuk", error: "Sila log masuk sebagai pegawai NEXa dahulu." };
  }
  if (!canManageKandungan(user.peranan)) {
    return { ok: false, kod: "tidak-dibenarkan", error: "Akaun ini tidak dibenarkan mengemas kini data DELIMa." };
  }

  const muatan = bacaMuatanD3(raw);
  if (!muatan.ok) return { ok: false, kod: "data", error: muatan.error };

  try {
    const ringkasan = await withDbTimeout(prosesDelimaD3(muatan.data, muatan.tarikh, simpan === true), 20_000);
    if (ringkasan.disimpan) {
      revalidateTag(CACHE_TAGS.home);
      revalidatePath("/admin/analisis");
      revalidatePath("/analisis");
    }
    return { ok: true, ringkasan };
  } catch (e) {
    if (e instanceof RalatDataD3) return { ok: false, kod: "data", error: e.message };
    console.error("[delima-d3] gagal memproses data penanda", e);
    return { ok: false, kod: "ralat", error: "Pangkalan data tidak bertindak balas. Sila cuba lagi." };
  }
}
