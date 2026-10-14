import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  contactRoles,
  mjkdMaklumBalas,
  mjkdBahan,
  mjkdKehadiran,
  mjkdMaklumBalasItem,
  mjkdMesyuarat,
  mjkdPerkara,
  pegawaiPpd,
  schools,
} from "@/lib/schema";
import { CARIAN_PEGAWAI_MAKS_HASIL, escapeLike } from "./kehadiran";

export type MesyuaratRow = typeof mjkdMesyuarat.$inferSelect;
export type PerkaraRow = typeof mjkdPerkara.$inferSelect;
export type MaklumBalasRow = typeof mjkdMaklumBalas.$inferSelect;
export type MaklumBalasItemRow = typeof mjkdMaklumBalasItem.$inferSelect;
export type BahanRow = typeof mjkdBahan.$inferSelect;
export type KehadiranRow = typeof mjkdKehadiran.$inferSelect;
export type PegawaiPpdRow = typeof pegawaiPpd.$inferSelect;
export type MaklumBalasLengkap = MaklumBalasRow & { items: MaklumBalasItemRow[] };

export async function getSchoolByCode(
  code: string,
): Promise<{ code: string; name: string; zone: string } | null> {
  const [row] = await db
    .select({ code: schools.code, name: schools.name, zone: schools.zone })
    .from(schools)
    .where(eq(schools.code, code))
    .limit(1);
  return row ?? null;
}

export async function listSekolahSemua() {
  return db
    .select({ code: schools.code, name: schools.name, zone: schools.zone })
    .from(schools)
    .orderBy(schools.code);
}

/** Semua mesyuarat, terkini dahulu. */
export async function listMesyuarat(): Promise<MesyuaratRow[]> {
  return db
    .select()
    .from(mjkdMesyuarat)
    .orderBy(desc(mjkdMesyuarat.tahun), desc(mjkdMesyuarat.bil));
}

export async function getMesyuarat(id: string): Promise<MesyuaratRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db
    .select()
    .from(mjkdMesyuarat)
    .where(eq(mjkdMesyuarat.id, id))
    .limit(1);
  return row ?? null;
}

/** Mesyuarat awam terkini: maklum balas dibuka ATAU sudah ada minit. */
export async function getMesyuaratAwamTerkini(): Promise<MesyuaratRow | null> {
  const [row] = await db
    .select()
    .from(mjkdMesyuarat)
    .where(or(eq(mjkdMesyuarat.maklumBalasDibuka, true), ne(mjkdMesyuarat.minitUrl, "")))
    .orderBy(desc(mjkdMesyuarat.tahun), desc(mjkdMesyuarat.bil))
    .limit(1);
  return row ?? null;
}

export async function listPerkara(
  mesyuaratId: string,
  opts: { aktifSahaja?: boolean } = {},
): Promise<PerkaraRow[]> {
  return db
    .select()
    .from(mjkdPerkara)
    .where(
      opts.aktifSahaja
        ? and(eq(mjkdPerkara.mesyuaratId, mesyuaratId), eq(mjkdPerkara.aktif, true))
        : eq(mjkdPerkara.mesyuaratId, mesyuaratId),
    )
    .orderBy(asc(mjkdPerkara.sort), asc(mjkdPerkara.para));
}

export async function getMaklumBalasBySchool(
  mesyuaratId: string,
  schoolCode: string,
): Promise<MaklumBalasLengkap | null> {
  const [mb] = await db
    .select()
    .from(mjkdMaklumBalas)
    .where(
      and(eq(mjkdMaklumBalas.mesyuaratId, mesyuaratId), eq(mjkdMaklumBalas.schoolCode, schoolCode)),
    )
    .limit(1);
  if (!mb) return null;
  const items = await db
    .select()
    .from(mjkdMaklumBalasItem)
    .where(eq(mjkdMaklumBalasItem.maklumBalasId, mb.id));
  return { ...mb, items };
}

export async function getMaklumBalasByReceipt(
  mesyuaratId: string,
  schoolCode: string,
  receiptToken: string,
): Promise<MaklumBalasLengkap | null> {
  const mb = await getMaklumBalasBySchool(mesyuaratId, schoolCode);
  if (!mb) return null;
  if (!receiptToken || mb.receiptToken.toUpperCase() !== receiptToken.toUpperCase()) return null;
  return mb;
}

/** Semua maklum balas + item satu mesyuarat (untuk admin). */
export async function listMaklumBalasMesyuarat(mesyuaratId: string): Promise<{
  maklumBalas: MaklumBalasRow[];
  items: MaklumBalasItemRow[];
}> {
  const maklumBalas = await db
    .select()
    .from(mjkdMaklumBalas)
    .where(eq(mjkdMaklumBalas.mesyuaratId, mesyuaratId));
  if (maklumBalas.length === 0) return { maklumBalas, items: [] };
  const items = await db
    .select()
    .from(mjkdMaklumBalasItem)
    .where(
      inArray(
        mjkdMaklumBalasItem.maklumBalasId,
        maklumBalas.map((m) => m.id),
      ),
    );
  return { maklumBalas, items };
}

/**
 * Nama PGB daripada direktori (versi semasa). HANYA nama — nombor telefon tidak
 * pernah dibaca/dipulangkan untuk paparan awam.
 */
export async function getNamaPgb(schoolCode: string): Promise<string> {
  return getNamaPeranan(schoolCode, "PGB");
}

/** Nama PK Pentadbiran daripada direktori (nama sahaja). */
export async function getNamaPkPentadbiran(schoolCode: string): Promise<string> {
  return getNamaPeranan(schoolCode, "PK_PENTADBIRAN");
}

async function getNamaPeranan(
  schoolCode: string,
  role: "PGB" | "PK_PENTADBIRAN",
): Promise<string> {
  const [row] = await db
    .select({ nama: contactRoles.teacherName })
    .from(schools)
    .innerJoin(
      contactRoles,
      and(eq(contactRoles.versionId, schools.currentVersionId), eq(contactRoles.role, role)),
    )
    .where(eq(schools.code, schoolCode))
    .limit(1);
  return row?.nama?.trim() ?? "";
}

/** Bilangan maklum balas bagi setiap mesyuarat (untuk senarai admin). */
export async function bilanganMaklumBalasMengikutMesyuarat(): Promise<Map<string, number>> {
  const rows = await db
    .select({ id: mjkdMaklumBalas.mesyuaratId, n: count() })
    .from(mjkdMaklumBalas)
    .groupBy(mjkdMaklumBalas.mesyuaratId);
  return new Map(rows.map((r) => [r.id, Number(r.n)]));
}

/* ============================== Kehadiran ============================== */

/** Mesyuarat terkini yang kehadirannya dibuka (atau null). */
export async function getMesyuaratKehadiranDibuka(): Promise<MesyuaratRow | null> {
  const [row] = await db
    .select()
    .from(mjkdMesyuarat)
    .where(eq(mjkdMesyuarat.kehadiranDibuka, true))
    .orderBy(desc(mjkdMesyuarat.tahun), desc(mjkdMesyuarat.bil))
    .limit(1);
  return row ?? null;
}

/** Rekod kehadiran satu mesyuarat, terbaru dahulu. */
export async function listKehadiran(mesyuaratId: string): Promise<KehadiranRow[]> {
  return db
    .select()
    .from(mjkdKehadiran)
    .where(eq(mjkdKehadiran.mesyuaratId, mesyuaratId))
    .orderBy(desc(mjkdKehadiran.createdAt));
}

export async function getKehadiranByKunci(
  mesyuaratId: string,
  tarikh: string,
  namaKunciNilai: string,
  organisasi: string,
): Promise<KehadiranRow | null> {
  const [row] = await db
    .select()
    .from(mjkdKehadiran)
    .where(
      and(
        eq(mjkdKehadiran.mesyuaratId, mesyuaratId),
        eq(mjkdKehadiran.tarikh, tarikh),
        eq(mjkdKehadiran.namaKunci, namaKunciNilai),
        eq(mjkdKehadiran.organisasi, organisasi),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getPegawaiPpd(id: number): Promise<PegawaiPpdRow | null> {
  if (!Number.isInteger(id)) return null;
  const [row] = await db.select().from(pegawaiPpd).where(eq(pegawaiPpd.id, id)).limit(1);
  return row ?? null;
}

/** Carian awam: pegawai AKTIF mengikut nama, maks 10 hasil. Hanya id, nama, jawatan. */
export async function cariPegawaiPpdAktif(
  q: string,
): Promise<{ id: number; nama: string; jawatan: string }[]> {
  return db
    .select({ id: pegawaiPpd.id, nama: pegawaiPpd.nama, jawatan: pegawaiPpd.jawatan })
    .from(pegawaiPpd)
    .where(and(eq(pegawaiPpd.aktif, true), ilike(pegawaiPpd.nama, `%${escapeLike(q)}%`)))
    .orderBy(asc(pegawaiPpd.sort), asc(pegawaiPpd.nama))
    .limit(CARIAN_PEGAWAI_MAKS_HASIL);
}

/** Senarai pegawai untuk admin (semua, termasuk tidak aktif), carian pilihan. */
export async function listPegawaiPpdAdmin(cari = ""): Promise<PegawaiPpdRow[]> {
  const q = cari.trim();
  return db
    .select()
    .from(pegawaiPpd)
    .where(
      q
        ? or(
            ilike(pegawaiPpd.nama, `%${escapeLike(q)}%`),
            ilike(pegawaiPpd.jawatan, `%${escapeLike(q)}%`),
            ilike(pegawaiPpd.sektor, `%${escapeLike(q)}%`),
          )
        : sql`true`,
    )
    .orderBy(asc(pegawaiPpd.sort), asc(pegawaiPpd.nama));
}

/* ================================= Bahan ================================= */

export async function getBahan(id: string): Promise<BahanRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db.select().from(mjkdBahan).where(eq(mjkdBahan.id, id)).limit(1);
  return row ?? null;
}

export async function listBahan(mesyuaratId: string): Promise<BahanRow[]> {
  return db
    .select()
    .from(mjkdBahan)
    .where(eq(mjkdBahan.mesyuaratId, mesyuaratId))
    .orderBy(asc(mjkdBahan.createdAt));
}

/** Mesyuarat terkini yang muat naik bahannya dibuka (atau null). */
export async function getMesyuaratBahanDibuka(): Promise<MesyuaratRow | null> {
  const [row] = await db
    .select()
    .from(mjkdMesyuarat)
    .where(eq(mjkdMesyuarat.bahanDibuka, true))
    .orderBy(desc(mjkdMesyuarat.tahun), desc(mjkdMesyuarat.bil))
    .limit(1);
  return row ?? null;
}

/** Mesyuarat terkini yang mempunyai sekurang-kurangnya satu bahan. */
export async function getMesyuaratDenganBahan(): Promise<MesyuaratRow | null> {
  const [row] = await db
    .select({ m: mjkdMesyuarat })
    .from(mjkdMesyuarat)
    .where(sql`exists (select 1 from ${mjkdBahan} where ${mjkdBahan.mesyuaratId} = ${mjkdMesyuarat.id})`)
    .orderBy(desc(mjkdMesyuarat.tahun), desc(mjkdMesyuarat.bil))
    .limit(1);
  return row?.m ?? null;
}

/** Nilai sektor mentah (pegawai PPD aktif) dan sektor/unit bahan terdahulu — untuk cadangan. */
export async function listSektorCadangan(): Promise<{ pegawai: string[]; bahan: string[] }> {
  // Berurutan (laluan awam; kolam serverless ~3 sambungan).
  const peg = await db
    .selectDistinct({ v: pegawaiPpd.sektor })
    .from(pegawaiPpd)
    .where(eq(pegawaiPpd.aktif, true));
  const bhn = await db.selectDistinct({ v: mjkdBahan.sektorUnit }).from(mjkdBahan);
  return {
    pegawai: peg.map((r) => r.v).filter(Boolean),
    bahan: bhn.map((r) => r.v).filter(Boolean),
  };
}

/** Senarai ringkas semua mesyuarat (untuk pilihan "Mesyuarat sebelum"). */
export async function listMesyuaratLain(): Promise<
  { id: string; bil: number; tahun: number; tarikh: string }[]
> {
  return db
    .select({
      id: mjkdMesyuarat.id,
      bil: mjkdMesyuarat.bil,
      tahun: mjkdMesyuarat.tahun,
      tarikh: mjkdMesyuarat.tarikh,
    })
    .from(mjkdMesyuarat)
    .orderBy(desc(mjkdMesyuarat.tahun), desc(mjkdMesyuarat.bil));
}

/** Nama PK (Pentadbiran, HEM, Kokurikulum) sekolah daripada direktori — nama sahaja. */
export async function getNamaPkWakil(
  schoolCode: string,
): Promise<{ role: "PK_PENTADBIRAN" | "PK_HEM" | "PK_KOKURIKULUM"; nama: string }[]> {
  const rows = await db
    .select({ role: contactRoles.role, nama: contactRoles.teacherName })
    .from(schools)
    .innerJoin(contactRoles, eq(contactRoles.versionId, schools.currentVersionId))
    .where(
      and(
        eq(schools.code, schoolCode),
        inArray(contactRoles.role, ["PK_PENTADBIRAN", "PK_HEM", "PK_KOKURIKULUM"]),
      ),
    );
  const urutan = ["PK_PENTADBIRAN", "PK_HEM", "PK_KOKURIKULUM"] as const;
  return urutan.flatMap((role) => {
    const baris = rows.find((r) => r.role === role);
    const nama = baris?.nama?.trim() ?? "";
    return nama ? [{ role, nama }] : [];
  });
}
