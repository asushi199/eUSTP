import "./load-env";

/**
 * Gabung MJKD 2026 menjadi SATU acara (keputusan pengurusan 2026-10-14).
 *  - Bil.2/2026 (21–22 Okt) dikekalkan sebagai rekod tunggal "MJKD 2026".
 *  - Perkara tindakan + minit Bil.1/2026 dipindah ke Bil.2; maklum balas dibuka, tutup 19 Okt.
 *  - SEMUA data ujian dipadam: maklum balas, kehadiran dan bahan (kedua-dua mesyuarat);
 *    fail Drive bahan/gambar bukti dibuang (best-effort).
 *  - Rekod Bil.1/2026 dipadam.
 * Idempoten: jika Bil.1 sudah tiada, hanya pembersihan data ujian Bil.2 dilaporkan.
 *
 * Guna: npx tsx scripts/gabung-mjkd-2026.ts [--dry-run]
 */

const TUTUP_MAKLUM_BALAS = "2026-10-19";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { db } = await import("../lib/db");
  const {
    mjkdBahan,
    mjkdKehadiran,
    mjkdMaklumBalas,
    mjkdMaklumBalasItem,
    mjkdMesyuarat,
    mjkdPerkara,
  } = await import("../lib/schema");
  const { and, count, eq, inArray } = await import("drizzle-orm");
  const { deleteLaporanPhotoViaGas } = await import("../lib/gas-upload");

  const cari = async (bil: number) => {
    const [row] = await db
      .select()
      .from(mjkdMesyuarat)
      .where(and(eq(mjkdMesyuarat.tahun, 2026), eq(mjkdMesyuarat.bil, bil)))
      .limit(1);
    return row ?? null;
  };
  const bil1 = await cari(1);
  const bil2 = await cari(2);
  if (!bil2) throw new Error("Bil.2/2026 tidak dijumpai. Jalankan scripts/setup-mjkd-2026-bil2.ts dahulu.");
  const ids = [bil2.id, ...(bil1 ? [bil1.id] : [])];

  const kira = async (jadual: typeof mjkdMaklumBalas | typeof mjkdKehadiran | typeof mjkdBahan | typeof mjkdPerkara) =>
    Number((await db.select({ n: count() }).from(jadual).where(inArray(jadual.mesyuaratId, ids)))[0]?.n ?? 0);

  const fotoLama = (
    await db
      .select({ foto: mjkdMaklumBalasItem.fotoBukti })
      .from(mjkdMaklumBalasItem)
      .innerJoin(mjkdMaklumBalas, eq(mjkdMaklumBalas.id, mjkdMaklumBalasItem.maklumBalasId))
      .where(inArray(mjkdMaklumBalas.mesyuaratId, ids))
  ).flatMap((r) => r.foto);
  const bahanDrive = (
    await db
      .select({ path: mjkdBahan.storagePath })
      .from(mjkdBahan)
      .where(inArray(mjkdBahan.mesyuaratId, ids))
  )
    .map((r) => r.path)
    .filter((p) => p.startsWith("drive/"));

  console.log(`Bil.2/2026 : ${bil2.id} (${bil2.tarikh}–${bil2.tarikhTamat ?? ""}, ${bil2.tempat})`);
  console.log(`Bil.1/2026 : ${bil1 ? `${bil1.id} — minit ${bil1.minitUrl ? "ADA" : "TIADA"}` : "sudah tiada"}`);
  console.log(`Akan dipadam (data ujian): ${await kira(mjkdMaklumBalas)} maklum balas, ${await kira(mjkdKehadiran)} kehadiran, ${await kira(mjkdBahan)} bahan`);
  console.log(`Fail Drive dibuang: ${fotoLama.length} gambar bukti, ${bahanDrive.length} PDF bahan`);
  console.log(`Perkara dipindah ke Bil.2: ${bil1 ? Number((await db.select({ n: count() }).from(mjkdPerkara).where(eq(mjkdPerkara.mesyuaratId, bil1.id)))[0]?.n ?? 0) : 0}`);
  console.log(`Bil.2 -> maklum balas DIBUKA, tutup ${TUTUP_MAKLUM_BALAS}; Bil.1 dipadam`);
  if (bil1 && !bil1.minitUrl && !bil2.minitUrl) console.warn("AMARAN: tiada minit pada kedua-dua rekod.");
  if (dryRun) {
    console.log("--dry-run: tiada perubahan dibuat.");
    process.exit(0);
  }

  await db.transaction(async (tx) => {
    const now = new Date();
    await tx.delete(mjkdMaklumBalas).where(inArray(mjkdMaklumBalas.mesyuaratId, ids));
    await tx.delete(mjkdKehadiran).where(inArray(mjkdKehadiran.mesyuaratId, ids));
    await tx.delete(mjkdBahan).where(inArray(mjkdBahan.mesyuaratId, ids));
    if (bil1) {
      await tx.update(mjkdPerkara).set({ mesyuaratId: bil2.id }).where(eq(mjkdPerkara.mesyuaratId, bil1.id));
    }
    await tx
      .update(mjkdMesyuarat)
      .set({
        ...(bil1 && bil1.minitUrl
          ? { minitUrl: bil1.minitUrl, minitStoragePath: bil1.minitStoragePath }
          : {}),
        mesyuaratSebelumId: null,
        maklumBalasDibuka: true,
        tarikhTutupMaklumBalas: TUTUP_MAKLUM_BALAS,
        updatedAt: now,
      })
      .where(eq(mjkdMesyuarat.id, bil2.id));
    if (bil1) await tx.delete(mjkdMesyuarat).where(eq(mjkdMesyuarat.id, bil1.id));
  });
  console.log("Pangkalan data dikemas kini.");

  const buang = await Promise.all([...fotoLama, ...bahanDrive].map((p) => deleteLaporanPhotoViaGas(p)));
  if (buang.length) console.log(`Drive: ${buang.filter(Boolean).length}/${buang.length} fail dibuang.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
