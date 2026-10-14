import "./load-env";

/**
 * USANG (2026-10-14): MJKD 2026 kini satu rekod — lihat scripts/gabung-mjkd-2026.ts. Jangan jalankan semula.
 *
 * Sediakan MJKD Bil.2/2026 (21–22 Okt 2026) dan buka maklum balas Bil.1/2026.
 *  - Bil.2/2026: tarikh 2026-10-21 hingga 2026-10-22, tempat Hotel Rosa Passadena Cameron Highland,
 *    mesyuarat sebelum = Bil.1/2026. Kehadiran dan muat naik bahan KEKAL DITUTUP
 *    (buka di /admin/mjkd/[id] bila sedia).
 *  - Bil.1/2026: maklum balas DIBUKA, tarikh tutup 2026-10-19 (hari akhir masih dibenarkan).
 * Idempoten: jika Bil.2 sudah wujud, hanya tarikh/tempat/mesyuarat sebelum dikemas kini.
 *
 * Guna: npx tsx scripts/setup-mjkd-2026-bil2.ts [--dry-run]
 */

const BIL2 = {
  tahun: 2026,
  bil: 2,
  tarikh: "2026-10-21",
  tarikhTamat: "2026-10-22",
  tempat: "Hotel Rosa Passadena Cameron Highland",
};
const TUTUP_MAKLUM_BALAS_BIL1 = "2026-10-19";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { db } = await import("../lib/db");
  const { mjkdMesyuarat, mjkdPerkara } = await import("../lib/schema");
  const { and, eq, count } = await import("drizzle-orm");

  const cari = async (tahun: number, bil: number) => {
    const [row] = await db
      .select()
      .from(mjkdMesyuarat)
      .where(and(eq(mjkdMesyuarat.tahun, tahun), eq(mjkdMesyuarat.bil, bil)))
      .limit(1);
    return row ?? null;
  };

  const bil1 = await cari(2026, 1);
  if (!bil1) throw new Error("Bil.1/2026 tidak dijumpai. Jalankan `npm run db:seed-mjkd` dahulu.");
  const [{ n: bilPerkara }] = await db
    .select({ n: count() })
    .from(mjkdPerkara)
    .where(eq(mjkdPerkara.mesyuaratId, bil1.id));
  if (!bilPerkara) throw new Error("Bil.1/2026 tiada perkara tindakan. Jalankan seed dahulu.");

  const bil2 = await cari(BIL2.tahun, BIL2.bil);
  console.log(`Bil.1/2026 : ${bil1.id} — ${bilPerkara} perkara, minit ${bil1.minitUrl ? "ADA" : "BELUM DIMUAT NAIK"}`);
  console.log(`  -> maklum balas DIBUKA, tutup ${TUTUP_MAKLUM_BALAS_BIL1}`);
  console.log(`Bil.2/2026 : ${bil2 ? `wujud (${bil2.id}) — dikemas kini` : "akan dicipta"}`);
  console.log(`  -> ${BIL2.tarikh} hingga ${BIL2.tarikhTamat}, ${BIL2.tempat}, mesyuarat sebelum = Bil.1/2026`);
  console.log("  -> kehadiran & muat naik bahan: ditutup (buka sendiri di admin)");
  if (!bil1.minitUrl) {
    console.warn("AMARAN: minit Bil.1 belum dimuat naik — jalankan scripts/upload-minit-mjkd.ts.");
  }
  if (dryRun) {
    console.log("--dry-run: tiada perubahan dibuat.");
    process.exit(0);
  }

  await db.transaction(async (tx) => {
    const now = new Date();
    await tx
      .update(mjkdMesyuarat)
      .set({ maklumBalasDibuka: true, tarikhTutupMaklumBalas: TUTUP_MAKLUM_BALAS_BIL1, updatedAt: now })
      .where(eq(mjkdMesyuarat.id, bil1.id));
    if (bil2) {
      await tx
        .update(mjkdMesyuarat)
        .set({
          tarikh: BIL2.tarikh,
          tarikhTamat: BIL2.tarikhTamat,
          tempat: BIL2.tempat,
          mesyuaratSebelumId: bil1.id,
          updatedAt: now,
        })
        .where(eq(mjkdMesyuarat.id, bil2.id));
    } else {
      await tx.insert(mjkdMesyuarat).values({ ...BIL2, mesyuaratSebelumId: bil1.id });
    }
  });
  console.log("Siap.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
