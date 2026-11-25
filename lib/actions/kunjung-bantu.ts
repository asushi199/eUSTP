"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, withDbTimeout } from "@/lib/db";
import { kunjungBantu, kunjungBantuDraf } from "@/lib/schema";
import { requireKandunganAccess } from "@/lib/rbac";
import {
  ID_ITEM_DIISI,
  ITEM_DIISI,
  SESI_KUNJUNG_BANTU,
  itemPerluBaiki,
  semakLengkap,
  type DelimaSekolah,
  type Jawapan,
  type MaklumatSekolah,
  type Semakan,
} from "@/lib/kunjung-bantu/instrumen";
import {
  getDelimaSekolahTerkini,
  getNamaPeranan,
  getRekod,
  getSekolah,
} from "@/lib/kunjung-bantu/queries";
import {
  MESEJ_DB_PERLAHAN,
  MESEJ_PENGHANTARAN_TIDAK_PASTI,
  MESEJ_RALAT_UMUM,
  isRalatTimeoutDb,
} from "@/lib/mjkd/ralat-db";

const SESI = SESI_KUNJUNG_BANTU;

function kodSekolah(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 20);
}

function revalidateKunjungBantu(kod?: string) {
  revalidatePath("/laporan-kunjung-bantu");
  revalidatePath("/laporan-kunjung-bantu/semak");
  revalidatePath("/admin/kunjung-bantu");
  if (kod) revalidatePath(`/admin/kunjung-bantu/${kod}`);
}

const jawapanSchema = z
  .record(
    z.string().max(16),
    z.object({ ya: z.boolean().nullable(), catatan: z.string().max(1000) }),
  )
  .refine((r) => Object.keys(r).length <= 80);

const maklumatSchema = z.object({
  namaPgb: z.string().max(200),
  namaPkPentadbiran: z.string().max(200),
  namaAdminDelima: z.string().max(200),
});

/** Buang item tidak dikenali + kemas ruang kosong. */
function bersihJawapan(raw: Jawapan): Jawapan {
  const out: Jawapan = {};
  for (const [id, j] of Object.entries(raw)) {
    if (!ID_ITEM_DIISI.has(id)) continue;
    out[id] = { ya: j.ya, catatan: j.catatan.trim() };
  }
  return out;
}

function bersihMaklumat(m: MaklumatSekolah): MaklumatSekolah {
  return {
    namaPgb: m.namaPgb.trim(),
    namaPkPentadbiran: m.namaPkPentadbiran.trim(),
    namaAdminDelima: m.namaAdminDelima.trim(),
  };
}

/* ============================ Awam: muat sekolah ============================ */

export type DrafKunjungBantu = {
  maklumat: MaklumatSekolah;
  jawapan: Jawapan;
  /** ISO — masa terakhir disimpan di pelayan. */
  disimpan: string;
};

export type MuatSekolahResult = {
  ok: boolean;
  /** Sekolah sudah menghantar — borang baharu tidak dibenarkan (guna nombor tiket). */
  sudahHantar: boolean;
  prefill: MaklumatSekolah;
  laman: string;
  delima: DelimaSekolah | null;
  draf: DrafKunjungBantu | null;
};

const drafDataSchema = z.object({ maklumat: maklumatSchema, jawapan: jawapanSchema });

/**
 * Awam: dipanggil apabila sekolah dipilih — prefill nama daripada direktori, laman rasmi,
 * peratus DELIMa d3 terkini, dan draf pelayan (jika belum dihantar).
 */
export async function muatSekolahKunjungBantu(schoolCode: string): Promise<MuatSekolahResult> {
  const kosong: MuatSekolahResult = {
    ok: false,
    sudahHantar: false,
    prefill: { namaPgb: "", namaPkPentadbiran: "", namaAdminDelima: "" },
    laman: "",
    delima: null,
    draf: null,
  };
  const kod = kodSekolah(schoolCode);
  if (!kod) return kosong;
  try {
    return await withDbTimeout(
      (async () => {
        const sekolah = await getSekolah(kod);
        if (!sekolah) return kosong;
        // BERURUTAN — kolam serverless kecil.
        const rekod = await getRekod(kod);
        const namaPgb = await getNamaPeranan(kod, "PGB");
        const namaPkPentadbiran = await getNamaPeranan(kod, "PK_PENTADBIRAN");
        const namaAdminDelima = await getNamaPeranan(kod, "DELIMA");
        const delima = await getDelimaSekolahTerkini(kod);
        let draf: DrafKunjungBantu | null = null;
        if (!rekod) {
          const [row] = await db
            .select()
            .from(kunjungBantuDraf)
            .where(and(eq(kunjungBantuDraf.sesi, SESI), eq(kunjungBantuDraf.schoolCode, kod)))
            .limit(1);
          const sah = row ? drafDataSchema.safeParse(row.data) : null;
          if (row && sah?.success) {
            draf = {
              maklumat: sah.data.maklumat,
              jawapan: sah.data.jawapan,
              disimpan: row.updatedAt.toISOString(),
            };
          }
        }
        return {
          ok: true,
          sudahHantar: Boolean(rekod),
          prefill: { namaPgb, namaPkPentadbiran, namaAdminDelima },
          laman: sekolah.website,
          delima,
          draf,
        };
      })(),
    );
  } catch {
    return kosong;
  }
}

/* ============================ Awam: draf ============================ */

/** Awam: simpan draf sekolah (menimpa). Ditolak jika sekolah sudah menghantar. */
export async function simpanDrafKunjungBantu(raw: {
  schoolCode: string;
  maklumat: MaklumatSekolah;
  jawapan: Jawapan;
}): Promise<{ ok: boolean; error?: string; disimpan?: string }> {
  const parsed = drafDataSchema.safeParse({ maklumat: raw?.maklumat, jawapan: raw?.jawapan });
  const kod = kodSekolah(raw?.schoolCode);
  if (!parsed.success || !kod) return { ok: false, error: "Draf tidak sah." };
  const data = { maklumat: parsed.data.maklumat, jawapan: bersihJawapan(parsed.data.jawapan) };
  try {
    return await withDbTimeout(
      (async () => {
        const sekolah = await getSekolah(kod);
        if (!sekolah) return { ok: false, error: "Kod sekolah tidak dijumpai." };
        const [hantar] = await db
          .select({ id: kunjungBantu.id })
          .from(kunjungBantu)
          .where(and(eq(kunjungBantu.sesi, SESI), eq(kunjungBantu.schoolCode, kod)))
          .limit(1);
        if (hantar) return { ok: false, error: "Sekolah ini sudah menghantar." };
        const now = new Date();
        await db
          .insert(kunjungBantuDraf)
          .values({ sesi: SESI, schoolCode: kod, data, updatedAt: now })
          .onConflictDoUpdate({
            target: [kunjungBantuDraf.sesi, kunjungBantuDraf.schoolCode],
            set: { data, updatedAt: now },
          });
        return { ok: true, disimpan: now.toISOString() };
      })(),
    );
  } catch {
    return { ok: false, error: "Draf belum disimpan di pelayan." };
  }
}

export async function padamDrafKunjungBantu(schoolCode: string): Promise<{ ok: boolean }> {
  const kod = kodSekolah(schoolCode);
  if (!kod) return { ok: false };
  try {
    await withDbTimeout(
      db
        .delete(kunjungBantuDraf)
        .where(and(eq(kunjungBantuDraf.sesi, SESI), eq(kunjungBantuDraf.schoolCode, kod))),
    );
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/* ============================ Awam: hantar / kemaskini ============================ */

export type HantarResult = {
  ok: boolean;
  error?: string;
  receiptToken?: string;
  schoolCode?: string;
};

/** Hantar (baharu) atau kemas kini (wajib nombor tiket). Rekod yang sudah disahkan dikunci. */
export async function hantarKunjungBantu(raw: {
  schoolCode: string;
  receiptToken?: string;
  maklumat: MaklumatSekolah;
  jawapan: Jawapan;
}): Promise<HantarResult> {
  const pm = maklumatSchema.safeParse(raw?.maklumat);
  const pj = jawapanSchema.safeParse(raw?.jawapan);
  const kod = kodSekolah(raw?.schoolCode);
  if (!pm.success || !pj.success || !kod) return { ok: false, error: "Input tidak sah." };
  const maklumat = bersihMaklumat(pm.data);
  const jawapan = bersihJawapan(pj.data);
  const ralat = semakLengkap(maklumat, jawapan);
  if (ralat) return { ok: false, error: ralat };
  const resit = String(raw?.receiptToken ?? "")
    .trim()
    .toUpperCase();

  const simpan = async (): Promise<HantarResult> => {
    const sekolah = await getSekolah(kod);
    if (!sekolah) return { ok: false, error: "Kod sekolah tidak dijumpai dalam direktori." };
    const sedia = await getRekod(kod);
    const now = new Date();
    if (!sedia) {
      const token = randomBytes(8).toString("hex").toUpperCase();
      const [baru] = await db
        .insert(kunjungBantu)
        .values({
          sesi: SESI,
          schoolCode: kod,
          ...maklumat,
          jawapan,
          receiptToken: token,
          status: "DIHANTAR",
          tarikhHantar: now,
        })
        .onConflictDoNothing()
        .returning({ id: kunjungBantu.id });
      if (!baru) {
        return {
          ok: false,
          error: "Sekolah ini sudah menghantar. Sila guna nombor tiket untuk mengemaskini.",
        };
      }
      return { ok: true, receiptToken: token, schoolCode: kod };
    }
    if (!resit || resit !== sedia.receiptToken.toUpperCase()) {
      return {
        ok: false,
        error: "Sekolah ini sudah menghantar. Sila guna nombor tiket untuk mengemaskini.",
      };
    }
    if (sedia.status === "DISAHKAN") {
      return {
        ok: false,
        error: "Rekod ini telah disahkan oleh PPD dan dikunci. Hubungi USTP PPD Manjung jika perlu dibuka semula.",
      };
    }
    // Hantar semula selepas pembetulan → kembali "menunggu semakan"; semakan pegawai dikekalkan.
    await db
      .update(kunjungBantu)
      .set({ ...maklumat, jawapan, status: "DIHANTAR", tarikhHantar: now, updatedAt: now })
      .where(eq(kunjungBantu.id, sedia.id));
    return { ok: true, receiptToken: sedia.receiptToken, schoolCode: kod };
  };

  try {
    const hasil = await withDbTimeout(simpan());
    if (hasil.ok) {
      await db
        .delete(kunjungBantuDraf)
        .where(and(eq(kunjungBantuDraf.sesi, SESI), eq(kunjungBantuDraf.schoolCode, kod)))
        .catch(() => undefined);
      revalidateKunjungBantu(kod);
    }
    return hasil;
  } catch (e) {
    if (isRalatTimeoutDb(e)) return { ok: false, error: MESEJ_PENGHANTARAN_TIDAK_PASTI };
    return { ok: false, error: MESEJ_RALAT_UMUM };
  }
}

/* ============================ Admin: semakan pegawai ============================ */

const semakanSchema = z
  .record(
    z.string().max(16),
    z.object({ status: z.enum(["SAH", "BAIKI"]).nullable(), catatan: z.string().max(1000) }),
  )
  .refine((r) => Object.keys(r).length <= 80);

export type TindakanSemakan = "SIMPAN" | "BAIKI" | "SAH" | "BUKA";

export async function adminSemakKunjungBantu(raw: {
  schoolCode: string;
  tindakan: TindakanSemakan;
  semakan: Semakan;
  isu: string;
  ulasanPegawai: string;
  namaPegawai: string;
  jawatanPegawai: string;
  tarikhPenilaian: string;
}): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const kod = kodSekolah(raw?.schoolCode);
  const tindakan = raw?.tindakan;
  const ps = semakanSchema.safeParse(raw?.semakan);
  if (!kod || !ps.success || !["SIMPAN", "BAIKI", "SAH", "BUKA"].includes(tindakan)) {
    return { ok: false, error: "Input tidak sah." };
  }
  const isu = String(raw.isu ?? "").trim().slice(0, 4000);
  const ulasanPegawai = String(raw.ulasanPegawai ?? "").trim().slice(0, 4000);
  const namaPegawai = String(raw.namaPegawai ?? "").trim().slice(0, 200);
  const jawatanPegawai = String(raw.jawatanPegawai ?? "").trim().slice(0, 200);
  const tarikh = String(raw.tarikhPenilaian ?? "").trim();
  const tarikhPenilaian = /^\d{4}-\d{2}-\d{2}$/.test(tarikh) ? tarikh : null;

  const semakan: Semakan = {};
  for (const it of ITEM_DIISI) {
    const s = ps.data[it.id];
    if (s) semakan[it.id] = { status: s.status, catatan: s.catatan.trim() };
  }

  try {
    return await withDbTimeout(
      (async () => {
        const rekod = await getRekod(kod);
        if (!rekod) return { ok: false, error: "Sekolah ini belum menghantar instrumen." };
        const now = new Date();

        if (tindakan === "BUKA") {
          await db
            .update(kunjungBantu)
            .set({ status: "DIHANTAR", disahkanPada: null, delimaBeku: null, updatedAt: now })
            .where(eq(kunjungBantu.id, rekod.id));
          revalidateKunjungBantu(kod);
          return { ok: true };
        }

        if (rekod.status === "DISAHKAN") {
          return { ok: false, error: "Rekod sudah disahkan. Buka semula dahulu untuk membuat perubahan." };
        }

        const asas = {
          semakan,
          isu,
          ulasanPegawai,
          namaPegawai,
          jawatanPegawai,
          tarikhPenilaian,
          disemakPada: now,
          updatedAt: now,
        };

        if (tindakan === "SIMPAN") {
          await db.update(kunjungBantu).set(asas).where(eq(kunjungBantu.id, rekod.id));
        } else if (tindakan === "BAIKI") {
          if (itemPerluBaiki(semakan).length === 0 && !ulasanPegawai) {
            return {
              ok: false,
              error: "Tandakan sekurang-kurangnya satu item \"Perlu dibaiki\" atau tulis ulasan pegawai.",
            };
          }
          await db
            .update(kunjungBantu)
            .set({ ...asas, status: "PERLU_PEMBETULAN" })
            .where(eq(kunjungBantu.id, rekod.id));
        } else {
          if (itemPerluBaiki(semakan).length > 0) {
            return { ok: false, error: "Masih ada item \"Perlu dibaiki\". Tukar kepada Disahkan dahulu." };
          }
          if (!namaPegawai || !jawatanPegawai) {
            return { ok: false, error: "Sila pilih pegawai penilai (nama dan jawatan rasmi)." };
          }
          if (!tarikhPenilaian) return { ok: false, error: "Sila isi tarikh penilaian." };
          // Item yang belum ditanda dianggap disahkan.
          const semuaSah: Semakan = {};
          for (const it of ITEM_DIISI) {
            semuaSah[it.id] = { status: "SAH", catatan: semakan[it.id]?.catatan ?? "" };
          }
          const delimaBeku = await getDelimaSekolahTerkini(kod);
          await db
            .update(kunjungBantu)
            .set({ ...asas, semakan: semuaSah, status: "DISAHKAN", disahkanPada: now, delimaBeku })
            .where(eq(kunjungBantu.id, rekod.id));
        }
        revalidateKunjungBantu(kod);
        return { ok: true };
      })(),
    );
  } catch (e) {
    return { ok: false, error: isRalatTimeoutDb(e) ? MESEJ_DB_PERLAHAN : MESEJ_RALAT_UMUM };
  }
}
