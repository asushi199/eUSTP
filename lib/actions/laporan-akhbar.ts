"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { laporanAkhbar } from "@/lib/schema";
import { requireKandunganAccess, requireUser } from "@/lib/rbac";
import {
  AKHBAR_YEAR,
  computeBaki,
  isKategoriSekolah,
  isStatusAkhbar,
  isYaTidak,
  parseRm,
  resolveAkhbarPegawaiPpd,
} from "@/lib/laporan-akhbar/enums";
import {
  getLaporanAkhbarBySchool,
  getSchoolByCode,
} from "@/lib/laporan-akhbar/queries";

export type AkhbarActionResult = {
  ok: boolean;
  error?: string;
  receiptToken?: string;
  schoolCode?: string;
};

function textField(value: FormDataEntryValue | null, max = 2000): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function newReceiptToken(): string {
  return randomBytes(8).toString("hex").toUpperCase();
}

const surveySchema = z.object({
  schoolCode: z.string().min(1),
  kategoriSekolah: z.string().refine(isKategoriSekolah, "Kategori sekolah tidak sah"),
  liputanPkb: z.string().refine(isYaTidak, "Liputan PKB tidak sah"),
  peruntukanDiterimaRm: z.number({ invalid_type_error: "Peruntukan 2026 tidak sah" }),
  perbelanjaanDigunakanRm: z.number({ invalid_type_error: "Perbelanjaan 2026 tidak sah" }),
  bayaranTertunggakRm: z.number({ invalid_type_error: "Bayaran tertunggak 2026 tidak sah" }),
  dipulangkanJpnRm: z.number({ invalid_type_error: "Jumlah dipulangkan 2026 tidak sah" }),
  tambahanDipohonRm: z.number({ invalid_type_error: "Tambahan dipohon tidak sah" }),
  terimaanTahun20242025Rm: z.number({
    invalid_type_error: "Terimaan tahun 2024–2025 tidak sah",
  }),
  bakiPeruntukan20242025Rm: z.number({
    invalid_type_error: "Baki peruntukan tahun 2024–2025 tidak sah",
  }),
  bayaranTertunggakSelesai: z.string().refine(isYaTidak, "Checklist tidak sah"),
  bakiDipulangkan: z.string().refine(isYaTidak, "Checklist tidak sah"),
  tiadaBakiKwk: z.string().refine(isYaTidak, "Checklist tidak sah"),
  mohonTambahan: z.string().refine(isYaTidak, "Checklist tidak sah"),
  dokumenLengkap: z.string().refine(isYaTidak, "Checklist tidak sah"),
  statusSekolah: z.string().refine(isStatusAkhbar, "Status tidak sah"),
  catatan: z.string().max(2000),
});

function parseSurveyForm(formData: FormData) {
  const fields = [
    "peruntukanDiterimaRm",
    "perbelanjaanDigunakanRm",
    "bayaranTertunggakRm",
    "dipulangkanJpnRm",
    "tambahanDipohonRm",
    "terimaanTahun20242025Rm",
    "bakiPeruntukan20242025Rm",
  ] as const;

  const amounts: Partial<Record<(typeof fields)[number], number>> = {};
  for (const f of fields) {
    const n = parseRm(formData.get(f));
    if (n == null) {
      return {
        success: false as const,
        error: {
          issues: [{ message: "Sila isi semua amaun RM dengan nombor ≥ 0." }],
        },
      };
    }
    amounts[f] = n;
  }

  return surveySchema.safeParse({
    schoolCode: textField(formData.get("schoolCode"), 20),
    kategoriSekolah: textField(formData.get("kategoriSekolah"), 40),
    liputanPkb: textField(formData.get("liputanPkb"), 10),
    ...amounts,
    bayaranTertunggakSelesai: textField(formData.get("bayaranTertunggakSelesai"), 10),
    bakiDipulangkan: textField(formData.get("bakiDipulangkan"), 10),
    tiadaBakiKwk: textField(formData.get("tiadaBakiKwk"), 10),
    mohonTambahan: textField(formData.get("mohonTambahan"), 10),
    dokumenLengkap: textField(formData.get("dokumenLengkap"), 10),
    statusSekolah: textField(formData.get("statusSekolah"), 40) || "Belum",
    catatan: textField(formData.get("catatan"), 2000),
  });
}

function surveyValues(data: z.infer<typeof surveySchema>, receiptToken: string) {
  const baki = computeBaki(data.peruntukanDiterimaRm, data.perbelanjaanDigunakanRm);
  return {
    year: AKHBAR_YEAR,
    schoolCode: data.schoolCode,
    kategoriSekolah: data.kategoriSekolah,
    liputanPkb: data.liputanPkb,
    peruntukanDiterimaRm: data.peruntukanDiterimaRm,
    perbelanjaanDigunakanRm: data.perbelanjaanDigunakanRm,
    bayaranTertunggakRm: data.bayaranTertunggakRm,
    bakiPeruntukanRm: baki,
    dipulangkanJpnRm: data.dipulangkanJpnRm,
    tambahanDipohonRm: data.tambahanDipohonRm,
    terimaanTahun20242025Rm: data.terimaanTahun20242025Rm,
    bakiPeruntukan20242025Rm: data.bakiPeruntukan20242025Rm,
    bayaranTertunggakSelesai: data.bayaranTertunggakSelesai,
    bakiDipulangkan: data.bakiDipulangkan,
    tiadaBakiKwk: data.tiadaBakiKwk,
    mohonTambahan: data.mohonTambahan,
    dokumenLengkap: data.dokumenLengkap,
    statusSekolah: data.statusSekolah,
    tarikhHantar: new Date(),
    catatan: data.catatan,
    receiptToken,
    updatedAt: new Date(),
  };
}

function revalidateAkhbar(schoolCode?: string) {
  revalidatePath("/laporan-akhbar");
  revalidatePath("/laporan-akhbar/semak");
  revalidatePath("/admin/laporan-akhbar");
  revalidatePath("/admin/pelaporan");
  if (schoolCode) revalidatePath(`/admin/laporan-akhbar/${schoolCode}`);
}

/** Hantar atau kemaskini tinjauan awam. Kemaskini wajib nombor tiket jika rekod wujud. */
export async function submitLaporanAkhbar(formData: FormData): Promise<AkhbarActionResult> {
  const parsed = parseSurveyForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues?.[0]?.message ?? "Input tidak sah",
    };
  }

  const declarationAccepted =
    textField(formData.get("declarationAccepted"), 10).toLowerCase() === "yes";
  if (!declarationAccepted) {
    return {
      ok: false,
      error: "Sila tandakan kotak perakuan sebelum menghantar.",
    };
  }

  const data = parsed.data;
  const school = await getSchoolByCode(data.schoolCode);
  if (!school) return { ok: false, error: "Kod sekolah tidak dijumpai dalam direktori." };

  const existing = await getLaporanAkhbarBySchool(data.schoolCode);
  const receiptInput = textField(formData.get("receiptToken"), 64).toUpperCase();

  try {
    if (!existing) {
      const token = newReceiptToken();
      await db.insert(laporanAkhbar).values(surveyValues(data, token));
      revalidateAkhbar(data.schoolCode);
      return { ok: true, receiptToken: token, schoolCode: data.schoolCode };
    }

    if (!receiptInput || receiptInput !== existing.receiptToken.toUpperCase()) {
      return {
        ok: false,
        error:
          "Sekolah ini sudah menghantar. Sila masukkan nombor tiket untuk mengemaskini.",
      };
    }

    await db
      .update(laporanAkhbar)
      .set(surveyValues(data, existing.receiptToken))
      .where(
        and(
          eq(laporanAkhbar.schoolCode, data.schoolCode),
          eq(laporanAkhbar.year, AKHBAR_YEAR),
        ),
      );
    revalidateAkhbar(data.schoolCode);
    return { ok: true, receiptToken: existing.receiptToken, schoolCode: data.schoolCode };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal menyimpan tinjauan.",
    };
  }
}

/** Admin: simpan tinjauan + semakan PPD. */
export async function adminSaveLaporanAkhbar(formData: FormData): Promise<AkhbarActionResult> {
  await requireKandunganAccess();
  const user = await requireUser();

  const parsed = parseSurveyForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues?.[0]?.message ?? "Input tidak sah",
    };
  }
  const data = parsed.data;
  const school = await getSchoolByCode(data.schoolCode);
  if (!school) return { ok: false, error: "Kod sekolah tidak dijumpai." };

  const optionalYaTidak = (key: string): string | null => {
    const v = textField(formData.get(key), 10);
    if (!v) return null;
    if (!isYaTidak(v)) throw new Error(`${key} tidak sah`);
    return v;
  };

  let semakanLengkap: string | null;
  let disahkan: string | null;
  let perluPembetulan: string | null;
  try {
    semakanLengkap = optionalYaTidak("semakanLengkap");
    disahkan = optionalYaTidak("disahkan");
    perluPembetulan = optionalYaTidak("perluPembetulan");
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Semakan PPD tidak sah" };
  }

  const pegawaiPpd = resolveAkhbarPegawaiPpd(
    textField(formData.get("pegawaiPpd"), 200),
    user.nama,
  );
  const tarikhSemakanRaw = textField(formData.get("tarikhSemakan"), 10);
  const tarikhSemakan =
    tarikhSemakanRaw && /^\d{4}-\d{2}-\d{2}$/.test(tarikhSemakanRaw)
      ? tarikhSemakanRaw
      : null;
  const catatanPpd = textField(formData.get("catatanPpd"), 2000);

  const existing = await getLaporanAkhbarBySchool(data.schoolCode);
  const token = existing?.receiptToken ?? newReceiptToken();
  const base = surveyValues(data, token);

  try {
    if (!existing) {
      await db.insert(laporanAkhbar).values({
        ...base,
        semakanLengkap,
        disahkan,
        perluPembetulan,
        pegawaiPpd,
        tarikhSemakan,
        catatanPpd,
      });
    } else {
      await db
        .update(laporanAkhbar)
        .set({
          ...base,
          semakanLengkap,
          disahkan,
          perluPembetulan,
          pegawaiPpd,
          tarikhSemakan,
          catatanPpd,
        })
        .where(
          and(
            eq(laporanAkhbar.schoolCode, data.schoolCode),
            eq(laporanAkhbar.year, AKHBAR_YEAR),
          ),
        );
    }
    revalidateAkhbar(data.schoolCode);
    return { ok: true, receiptToken: token, schoolCode: data.schoolCode };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal menyimpan.",
    };
  }
}

export async function adminRegenerateAkhbarReceipt(
  schoolCode: string,
): Promise<AkhbarActionResult> {
  await requireKandunganAccess();
  const existing = await getLaporanAkhbarBySchool(schoolCode);
  if (!existing) return { ok: false, error: "Tiada rekod untuk sekolah ini." };
  const token = newReceiptToken();
  await db
    .update(laporanAkhbar)
    .set({ receiptToken: token, updatedAt: new Date() })
    .where(
      and(eq(laporanAkhbar.schoolCode, schoolCode), eq(laporanAkhbar.year, AKHBAR_YEAR)),
    );
  revalidateAkhbar(schoolCode);
  return { ok: true, receiptToken: token, schoolCode };
}
