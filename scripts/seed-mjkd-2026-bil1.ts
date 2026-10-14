import "./load-env";
import {
  MJKD_2026_BIL1_MESYUARAT,
  MJKD_2026_BIL1_PERKARA,
} from "../lib/mjkd/seed-2026-bil1";

/**
 * Seed Mesyuarat Jawatankuasa Kurikulum Daerah Bil.1/2026 (mesyuarat + 13 perkara tindakan).
 * Idempoten:
 *  - mesyuarat di-upsert mengikut (tahun, bil); hanya tarikh/tempat dikemas kini
 *    (suis buka/tutup tidak disentuh jika sudah wujud; mesyuarat baharu = kedua-dua ditutup);
 *  - perkara diganti HANYA jika belum ada maklum balas; jika sudah ada, skrip berhenti.
 * Sekolah khusus diselesaikan melalui padanan tepat nama dalam `schools` (mesti tepat satu).
 *
 * Guna: npm run db:seed-mjkd [-- --dry-run]
 */
async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const { db } = await import("../lib/db");
  const { mjkdMaklumBalas, mjkdMesyuarat, mjkdPerkara, schools } = await import("../lib/schema");
  const { and, eq, sql } = await import("drizzle-orm");

  // 1. Selesaikan sekolah khusus mengikut nama (gagal dengan jelas jika bukan tepat satu).
  const kodMengikutNama = new Map<string, string>();
  const semuaNama = [
    ...new Set(MJKD_2026_BIL1_PERKARA.flatMap((p) => p.sekolahKhususNama ?? [])),
  ];
  for (const nama of semuaNama) {
    const padan = await db
      .select({ code: schools.code, name: schools.name })
      .from(schools)
      .where(sql`upper(btrim(${schools.name})) = upper(btrim(${nama}))`);
    if (padan.length !== 1) {
      throw new Error(
        `Sekolah "${nama}": dijangka tepat 1 padanan dalam schools, dijumpai ${padan.length}` +
          (padan.length > 1 ? ` (${padan.map((p) => p.code).join(", ")})` : "") +
          ".",
      );
    }
    kodMengikutNama.set(nama, padan[0]!.code);
    console.log(`  ${nama} -> ${padan[0]!.code}`);
  }

  const { bil, tahun, tarikh, tempat } = MJKD_2026_BIL1_MESYUARAT;
  const [sedia] = await db
    .select()
    .from(mjkdMesyuarat)
    .where(and(eq(mjkdMesyuarat.tahun, tahun), eq(mjkdMesyuarat.bil, bil)))
    .limit(1);

  // 2. Semak jawapan sedia ada sebelum mengganti perkara.
  let bilPerkaraSedia = 0;
  if (sedia) {
    const [mb] = await db
      .select({ id: mjkdMaklumBalas.id })
      .from(mjkdMaklumBalas)
      .where(eq(mjkdMaklumBalas.mesyuaratId, sedia.id))
      .limit(1);
    if (mb) {
      throw new Error(
        `Mesyuarat Bil.${bil}/${tahun} sudah ada maklum balas sekolah. ` +
          "Perkara tidak diganti — ubah melalui /admin/mjkd sebaliknya.",
      );
    }
    const perkaraSedia = await db
      .select({ id: mjkdPerkara.id })
      .from(mjkdPerkara)
      .where(eq(mjkdPerkara.mesyuaratId, sedia.id));
    bilPerkaraSedia = perkaraSedia.length;
  }

  console.log(
    `${dryRun ? "[dry-run] " : ""}Mesyuarat Bil.${bil}/${tahun}: ${sedia ? "kemas kini" : "cipta"}; ` +
      `perkara: padam ${bilPerkaraSedia}, masuk ${MJKD_2026_BIL1_PERKARA.length}.`,
  );
  if (dryRun) {
    process.exit(0);
  }

  await db.transaction(async (tx) => {
    let mesyuaratId: string;
    if (sedia) {
      await tx
        .update(mjkdMesyuarat)
        .set({ tarikh, tempat, updatedAt: new Date() })
        .where(eq(mjkdMesyuarat.id, sedia.id));
      mesyuaratId = sedia.id;
    } else {
      const [baru] = await tx
        .insert(mjkdMesyuarat)
        .values({
          bil,
          tahun,
          tarikh,
          tempat,
          maklumBalasDibuka: false,
          kehadiranDibuka: false,
        })
        .returning({ id: mjkdMesyuarat.id });
      mesyuaratId = baru!.id;
    }

    await tx.delete(mjkdPerkara).where(eq(mjkdPerkara.mesyuaratId, mesyuaratId));
    await tx.insert(mjkdPerkara).values(
      MJKD_2026_BIL1_PERKARA.map((p, i) => ({
        mesyuaratId,
        para: p.para,
        mukaSurat: p.mukaSurat,
        perkara: p.perkara,
        tindakan: p.tindakan,
        panduan: p.panduan,
        sasaran: p.sasaran,
        sekolahKhusus: (p.sekolahKhususNama ?? []).map((n) => kodMengikutNama.get(n)!),
        sort: i + 1,
        aktif: true,
      })),
    );
  });

  console.log("Siap.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
