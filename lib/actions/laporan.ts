"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { laporanDpd, laporanPhotos, laporanPss, schools } from "@/lib/schema";
import { requireKandunganAccess } from "@/lib/rbac";
import { LAPORAN_MAX_PHOTOS, type LaporanModul } from "@/lib/laporan/photos";
import { deleteLaporanPhotoFromStorage, uploadLaporanPhoto } from "@/lib/storage";

/* ----------------------------- helpers ----------------------------- */

function intField(value: FormDataEntryValue | null): number {
  const n = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function textField(value: FormDataEntryValue | null, max = 5000): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function photosFromForm(formData: FormData): File[] {
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, LAPORAN_MAX_PHOTOS);
  return files;
}

async function savePhotos(
  modul: LaporanModul,
  laporanId: number,
  tarikh: string,
  program: string,
  files: File[],
): Promise<string[]> {
  const warnings: string[] = [];
  let index = 0;
  for (const file of files) {
    index += 1;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { path, publicUrl } = await uploadLaporanPhoto(
        { name: file.name, type: file.type, buffer },
        { modul, laporanId, tarikh, program, index },
      );
      await db.insert(laporanPhotos).values({
        modul,
        laporanId,
        storagePath: path,
        publicUrl,
        sortOrder: index,
      });
    } catch (e) {
      warnings.push(
        `Gambar ${index} gagal dimuat naik: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  return warnings;
}

/* ----------------------------- DPD ----------------------------- */

const dpdSchema = z.object({
  tarikh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarikh tidak sah"),
  organisasi: z.string().min(1, "Sila isi kod & nama organisasi"),
  namaProgram: z.string().min(1, "Sila isi nama program"),
  emailPelapor: z.string().email("Emel tidak sah").or(z.literal("")),
});

export type CreateLaporanResult = {
  ok: boolean;
  id?: number;
  error?: string;
  warnings?: string[];
};

export async function createLaporanDpd(formData: FormData): Promise<CreateLaporanResult> {
  const parsed = dpdSchema.safeParse({
    tarikh: textField(formData.get("tarikh"), 10),
    organisasi: textField(formData.get("organisasi"), 300),
    namaProgram: textField(formData.get("namaProgram"), 300),
    emailPelapor: textField(formData.get("emailPelapor"), 200),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah" };
  }
  const base = parsed.data;

  const [row] = await db
    .insert(laporanDpd)
    .values({
      tarikh: base.tarikh,
      organisasi: base.organisasi,
      namaProgram: base.namaProgram,
      lokasi: textField(formData.get("lokasi"), 300),
      jenisProgram: textField(formData.get("jenisProgram"), 200),
      bilMurid: intField(formData.get("bilMurid")),
      bilGuru: intField(formData.get("bilGuru")),
      bilPentadbir: intField(formData.get("bilPentadbir")),
      bilSwasta: intField(formData.get("bilSwasta")),
      teras: textField(formData.get("teras")),
      strategi: textField(formData.get("strategi")),
      inisiatif: textField(formData.get("inisiatif")),
      emailPelapor: base.emailPelapor,
    })
    .returning({ id: laporanDpd.id });

  const warnings = await savePhotos(
    "dpd",
    row.id,
    base.tarikh,
    base.namaProgram,
    photosFromForm(formData),
  );

  revalidatePath("/admin/laporan-dpd");
  revalidatePublicStats("dpd");
  return { ok: true, id: row.id, warnings: warnings.length ? warnings : undefined };
}

/* ----------------------------- PSS ----------------------------- */

const pssSchema = z.object({
  schoolCode: z.string().min(1, "Sila pilih sekolah"),
  namaProgram: z.string().min(1, "Sila isi nama program"),
  tarikhMula: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarikh mula tidak sah"),
  tarikhTamat: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal("")),
  pelapor: z.string().min(1, "Sila isi nama pelapor"),
});

export async function createLaporanPss(formData: FormData): Promise<CreateLaporanResult> {
  const parsed = pssSchema.safeParse({
    schoolCode: textField(formData.get("schoolCode"), 20),
    namaProgram: textField(formData.get("namaProgram"), 300),
    tarikhMula: textField(formData.get("tarikhMula"), 10),
    tarikhTamat: textField(formData.get("tarikhTamat"), 10),
    pelapor: textField(formData.get("pelapor"), 200),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah" };
  }
  const base = parsed.data;

  const school = await db.query.schools.findFirst({
    where: eq(schools.code, base.schoolCode),
  });
  if (!school) return { ok: false, error: "Sekolah tidak dijumpai." };

  if (base.tarikhTamat && base.tarikhTamat < base.tarikhMula) {
    return { ok: false, error: "Tarikh tamat lebih awal daripada tarikh mula." };
  }

  const [row] = await db
    .insert(laporanPss)
    .values({
      schoolCode: school.code,
      schoolName: school.name,
      namaProgram: base.namaProgram,
      tarikhMula: base.tarikhMula,
      tarikhTamat: base.tarikhTamat || null,
      pelapor: base.pelapor,
      jawatan: textField(formData.get("jawatan"), 200),
      bilGuru: intField(formData.get("bilGuru")),
      bilMurid: intField(formData.get("bilMurid")),
      objektif: textField(formData.get("objektif")),
      ringkasan: textField(formData.get("ringkasan")),
      impak: textField(formData.get("impak")),
    })
    .returning({ id: laporanPss.id });

  const warnings = await savePhotos(
    "pss",
    row.id,
    base.tarikhMula,
    base.namaProgram,
    photosFromForm(formData),
  );

  revalidatePath("/admin/laporan-pss");
  revalidatePublicStats("pss");
  return { ok: true, id: row.id, warnings: warnings.length ? warnings : undefined };
}

/* ----------------------------- Admin ----------------------------- */

/** Statistik awam dikira terus dari jadual laporan — segarkan selepas setiap perubahan. */
function revalidatePublicStats(modul: LaporanModul) {
  revalidatePath("/");
  revalidatePath("/statistik");
  revalidatePath(modul === "dpd" ? "/laporan-dpd/senarai" : "/laporan-pss/senarai");
}

const statusSchema = z.enum(["BARU", "DISEMAK", "SELESAI"]);

export async function updateLaporanStatus(
  modul: LaporanModul,
  id: number,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Status tidak sah." };

  if (modul === "dpd") {
    await db
      .update(laporanDpd)
      .set({ status: parsed.data, updatedAt: new Date() })
      .where(eq(laporanDpd.id, id));
    revalidatePath("/admin/laporan-dpd");
  } else {
    await db
      .update(laporanPss)
      .set({ status: parsed.data, updatedAt: new Date() })
      .where(eq(laporanPss.id, id));
    revalidatePath("/admin/laporan-pss");
  }
  return { ok: true };
}

export async function deleteLaporan(
  modul: LaporanModul,
  id: number,
): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();

  const photos = await db
    .select()
    .from(laporanPhotos)
    .where(and(eq(laporanPhotos.modul, modul), eq(laporanPhotos.laporanId, id)));

  if (modul === "dpd") {
    await db.delete(laporanDpd).where(eq(laporanDpd.id, id));
  } else {
    await db.delete(laporanPss).where(eq(laporanPss.id, id));
  }
  await db
    .delete(laporanPhotos)
    .where(and(eq(laporanPhotos.modul, modul), eq(laporanPhotos.laporanId, id)));

  // Padam fail Drive best-effort selepas DB berjaya.
  for (const p of photos) {
    void deleteLaporanPhotoFromStorage(p.storagePath);
  }

  revalidatePath(modul === "dpd" ? "/admin/laporan-dpd" : "/admin/laporan-pss");
  revalidatePublicStats(modul);
  return { ok: true };
}
