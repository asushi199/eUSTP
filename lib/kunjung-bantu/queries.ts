import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { DELIMA_D3_SUMBER } from "@/lib/analisis/delima-d3-parse";
import {
  analisisDelimaSchools,
  analisisDelimaSnapshots,
  contactRoles,
  kunjungBantu,
  kunjungBantuDraf,
  schools,
} from "@/lib/schema";
import {
  SESI_KUNJUNG_BANTU,
  isStatusRekod,
  type DelimaSekolah,
  type Jawapan,
  type Semakan,
  type StatusRekod,
} from "./instrumen";

export type RekodKunjungBantu = {
  id: string;
  schoolCode: string;
  namaPgb: string;
  namaPkPentadbiran: string;
  namaAdminDelima: string;
  jawapan: Jawapan;
  receiptToken: string;
  status: StatusRekod;
  tarikhHantar: Date;
  semakan: Semakan;
  isu: string;
  ulasanPegawai: string;
  namaPegawai: string;
  jawatanPegawai: string;
  tarikhPenilaian: string | null;
  disemakPada: Date | null;
  disahkanPada: Date | null;
  delimaBeku: DelimaSekolah | null;
};

function keRekod(r: typeof kunjungBantu.$inferSelect): RekodKunjungBantu {
  return {
    id: r.id,
    schoolCode: r.schoolCode,
    namaPgb: r.namaPgb,
    namaPkPentadbiran: r.namaPkPentadbiran,
    namaAdminDelima: r.namaAdminDelima,
    jawapan: (r.jawapan ?? {}) as Jawapan,
    receiptToken: r.receiptToken,
    status: isStatusRekod(r.status) ? r.status : "DIHANTAR",
    tarikhHantar: r.tarikhHantar,
    semakan: (r.semakan ?? {}) as Semakan,
    isu: r.isu,
    ulasanPegawai: r.ulasanPegawai,
    namaPegawai: r.namaPegawai,
    jawatanPegawai: r.jawatanPegawai,
    tarikhPenilaian: r.tarikhPenilaian,
    disemakPada: r.disemakPada,
    disahkanPada: r.disahkanPada,
    delimaBeku: (r.delimaBeku ?? null) as DelimaSekolah | null,
  };
}

export async function getSekolah(
  code: string,
): Promise<{ code: string; name: string; zone: string; website: string } | null> {
  const [row] = await db
    .select({ code: schools.code, name: schools.name, zone: schools.zone, website: schools.website })
    .from(schools)
    .where(eq(schools.code, code))
    .limit(1);
  return row ?? null;
}

export async function getRekod(
  schoolCode: string,
  sesi = SESI_KUNJUNG_BANTU,
): Promise<RekodKunjungBantu | null> {
  const [row] = await db
    .select()
    .from(kunjungBantu)
    .where(and(eq(kunjungBantu.sesi, sesi), eq(kunjungBantu.schoolCode, schoolCode)))
    .limit(1);
  return row ? keRekod(row) : null;
}

/** Rekod sekolah jika nombor tiket sepadan (tidak sensitif huruf). */
export async function getRekodByResit(
  schoolCode: string,
  resit: string,
): Promise<RekodKunjungBantu | null> {
  const rekod = await getRekod(schoolCode);
  if (!rekod || !resit || rekod.receiptToken.toUpperCase() !== resit.toUpperCase()) return null;
  return rekod;
}

/** Admin: ringkasan semua rekod sesi (tanpa lajur jsonb besar kecuali semakan/jawapan kecil). */
export async function listRekodAdmin(sesi = SESI_KUNJUNG_BANTU) {
  const rows = await db
    .select({
      schoolCode: kunjungBantu.schoolCode,
      status: kunjungBantu.status,
      tarikhHantar: kunjungBantu.tarikhHantar,
      jawapan: kunjungBantu.jawapan,
      tarikhPenilaian: kunjungBantu.tarikhPenilaian,
      disahkanPada: kunjungBantu.disahkanPada,
    })
    .from(kunjungBantu)
    .where(eq(kunjungBantu.sesi, sesi));
  return rows.map((r) => ({
    ...r,
    status: isStatusRekod(r.status) ? r.status : ("DIHANTAR" as StatusRekod),
    jawapan: (r.jawapan ?? {}) as Jawapan,
  }));
}

export async function listKodDraf(sesi = SESI_KUNJUNG_BANTU): Promise<string[]> {
  const rows = await db
    .select({ kod: kunjungBantuDraf.schoolCode })
    .from(kunjungBantuDraf)
    .where(eq(kunjungBantuDraf.sesi, sesi));
  return rows.map((r) => r.kod);
}

export async function listKodSudahHantar(sesi = SESI_KUNJUNG_BANTU): Promise<string[]> {
  const rows = await db
    .select({ kod: kunjungBantu.schoolCode })
    .from(kunjungBantu)
    .where(eq(kunjungBantu.sesi, sesi));
  return rows.map((r) => r.kod);
}

/** Nama pemegang peranan direktori (nama sahaja). */
export async function getNamaPeranan(
  schoolCode: string,
  role: "PGB" | "PK_PENTADBIRAN" | "DELIMA",
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

function pop(aktif: number | null, jumlah: number | null, pct: number | null) {
  if (aktif == null || jumlah == null || jumlah <= 0) return null;
  return { aktif, jumlah, peratus: pct ?? Math.round((aktif / jumlah) * 1000) / 10 };
}

/** Peratus DELIMa sekolah daripada snapshot d3 terkini (2 query kecil). null jika tiada data. */
export async function getDelimaSekolahTerkini(schoolCode: string): Promise<DelimaSekolah | null> {
  const [snap] = await db
    .select({ id: analisisDelimaSnapshots.id, tempoh: analisisDelimaSnapshots.tempoh })
    .from(analisisDelimaSnapshots)
    .where(eq(analisisDelimaSnapshots.sumberUrl, DELIMA_D3_SUMBER))
    .orderBy(desc(analisisDelimaSnapshots.period))
    .limit(1);
  if (!snap) return null;
  const [r] = await db
    .select({
      guruAktif: analisisDelimaSchools.guruAktif,
      guruJumlah: analisisDelimaSchools.guruJumlah,
      guruPct: analisisDelimaSchools.guruPct,
      muridAktif: analisisDelimaSchools.muridAktif,
      muridJumlah: analisisDelimaSchools.muridJumlah,
      muridPct: analisisDelimaSchools.muridPct,
    })
    .from(analisisDelimaSchools)
    .where(
      and(eq(analisisDelimaSchools.snapshotId, snap.id), eq(analisisDelimaSchools.kod, schoolCode)),
    )
    .limit(1);
  if (!r) return null;
  const guru = pop(r.guruAktif, r.guruJumlah, r.guruPct);
  const murid = pop(r.muridAktif, r.muridJumlah, r.muridPct);
  const aktif = (guru?.aktif ?? 0) + (murid?.aktif ?? 0);
  const jumlah = (guru?.jumlah ?? 0) + (murid?.jumlah ?? 0);
  return {
    tempoh: snap.tempoh,
    guru,
    murid,
    keseluruhan:
      jumlah > 0 ? { aktif, jumlah, peratus: Math.round((aktif / jumlah) * 1000) / 10 } : null,
  };
}
