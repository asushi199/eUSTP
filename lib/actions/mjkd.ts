"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  mjkdMaklumBalas,
  mjkdMaklumBalasItem,
  mjkdMesyuarat,
  mjkdPerkara,
  schools,
} from "@/lib/schema";
import { requireKandunganAccess } from "@/lib/rbac";
import { uploadPublicStorageObject } from "@/lib/tempahan/room-photos";
import { isSasaranMjkd, maklumBalasTerbuka } from "@/lib/mjkd/enums";
import { lebihAwal } from "@/lib/mjkd/hari";
import { jawatanPgb } from "@/lib/mjkd/jawatan-pgb";
import { kenalJenisSekolah } from "@/lib/mjkd/jenis-sekolah";
import {
  getMaklumBalasBySchool,
  getMesyuarat,
  getNamaPgb,
  getSchoolByCode,
  listPerkara,
} from "@/lib/mjkd/queries";
import { perkaraUntukSekolah } from "@/lib/mjkd/sasaran";
import { sahkanMaklumBalas, type MaklumBalasData } from "@/lib/mjkd/validation";

export type MjkdActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
  receiptToken?: string;
  schoolCode?: string;
};

const MINIT_MAKS_BYTE = 8 * 1024 * 1024;

function textField(value: FormDataEntryValue | null, max = 2000): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function newReceiptToken(): string {
  return randomBytes(8).toString("hex").toUpperCase();
}

function isTarikhIso(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

function revalidateMjkd(mesyuaratId?: string) {
  revalidatePath("/laporan-mjkd");
  revalidatePath("/laporan-mjkd/semak");
  revalidatePath("/admin/mjkd");
  revalidatePath("/admin/pelaporan");
  if (mesyuaratId) revalidatePath(`/admin/mjkd/${mesyuaratId}`);
}

function ralatPangkalanData(e: unknown, lalai: string): string {
  const mesej = e instanceof Error ? e.message : "";
  // Pelanggaran indeks unik (bil + tahun) dari Postgres.
  if (/mjkd_mesyuarat_tahun_bil_uq|duplicate key/i.test(mesej)) {
    return "Mesyuarat dengan Bil. dan tahun ini sudah wujud.";
  }
  return mesej || lalai;
}

/* ============================ Awam: maklum balas ============================ */

const payloadSchema = z.object({
  mesyuaratId: z.string().min(1).max(64),
  schoolCode: z.string().min(1).max(20),
  namaPengisi: z.string().max(400),
  jawatanPengisi: z.string().max(400),
  receiptToken: z.string().max(64).optional(),
  items: z
    .array(
      z.object({
        perkaraId: z.string().max(64),
        status: z.string().max(40),
        catatan: z.string().max(4000),
        pautanBukti: z.string().max(1000),
      }),
    )
    .max(200),
});

export type MaklumBalasPayload = z.infer<typeof payloadSchema>;

type PersediaanSimpan =
  | {
      ok: true;
      mesyuarat: NonNullable<Awaited<ReturnType<typeof getMesyuarat>>>;
      school: { code: string; name: string; zone: string };
      data: MaklumBalasData;
      receiptInput: string;
    }
  | { ok: false; error: string };

/** Semak muatan + sahkan terhadap perkara yang terpakai kepada sekolah. */
async function sediakanSimpan(raw: unknown): Promise<PersediaanSimpan> {
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };
  const payload = parsed.data;

  const mesyuarat = await getMesyuarat(payload.mesyuaratId);
  if (!mesyuarat) return { ok: false, error: "Mesyuarat tidak dijumpai." };

  const schoolCode = payload.schoolCode.trim().toUpperCase();
  const school = await getSchoolByCode(schoolCode);
  if (!school) return { ok: false, error: "Kod sekolah tidak dijumpai dalam direktori." };

  const perkara = await listPerkara(mesyuarat.id, { aktifSahaja: true });
  const terpakai = perkaraUntukSekolah(perkara, school);
  if (terpakai.length === 0) {
    return { ok: false, error: "Tiada perkara tindakan untuk sekolah ini." };
  }

  const sah = sahkanMaklumBalas(
    {
      namaPengisi: payload.namaPengisi,
      jawatanPengisi: payload.jawatanPengisi,
      items: payload.items,
    },
    terpakai.map((p) => ({ id: p.id, para: p.para })),
  );
  if (!sah.ok) return { ok: false, error: sah.error };

  return {
    ok: true,
    mesyuarat,
    school,
    data: sah.data,
    receiptInput: (payload.receiptToken ?? "").trim().toUpperCase(),
  };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function simpanItem(tx: Tx, maklumBalasId: string, data: MaklumBalasData) {
  if (data.items.length === 0) return;
  // dipilih / susunan_bacaan (pilihan admin) sengaja tidak diubah semasa kemas kini.
  await tx
    .insert(mjkdMaklumBalasItem)
    .values(
      data.items.map((it) => ({
        maklumBalasId,
        perkaraId: it.perkaraId,
        status: it.status,
        catatan: it.catatan,
        pautanBukti: it.pautanBukti,
      })),
    )
    .onConflictDoUpdate({
      target: [mjkdMaklumBalasItem.maklumBalasId, mjkdMaklumBalasItem.perkaraId],
      set: {
        status: sql`excluded.status`,
        catatan: sql`excluded.catatan`,
        pautanBukti: sql`excluded.pautan_bukti`,
      },
    });
}

/** Hantar atau kemas kini maklum balas (awam). Kemas kini wajib nombor tiket; ditolak bila ditutup. */
export async function submitMaklumBalasMjkd(
  payload: MaklumBalasPayload,
): Promise<MjkdActionResult> {
  const siap = await sediakanSimpan(payload);
  if (!siap.ok) return { ok: false, error: siap.error };
  const { mesyuarat, school, data, receiptInput } = siap;

  if (!maklumBalasTerbuka(mesyuarat)) {
    return { ok: false, error: "Maklum balas ditutup." };
  }

  try {
    const existing = await getMaklumBalasBySchool(mesyuarat.id, school.code);
    const now = new Date();

    if (!existing) {
      const token = newReceiptToken();
      const dicipta = await db.transaction(async (tx) => {
        const [mb] = await tx
          .insert(mjkdMaklumBalas)
          .values({
            mesyuaratId: mesyuarat.id,
            schoolCode: school.code,
            namaPengisi: data.namaPengisi,
            jawatanPengisi: data.jawatanPengisi,
            receiptToken: token,
            tarikhHantar: now,
          })
          .onConflictDoNothing()
          .returning({ id: mjkdMaklumBalas.id });
        if (!mb) return false;
        await simpanItem(tx, mb.id, data);
        return true;
      });
      if (!dicipta) {
        return {
          ok: false,
          error: "Sekolah ini sudah menghantar. Sila masukkan nombor tiket untuk mengemaskini.",
        };
      }
      revalidateMjkd(mesyuarat.id);
      return { ok: true, receiptToken: token, schoolCode: school.code };
    }

    if (!receiptInput || receiptInput !== existing.receiptToken.toUpperCase()) {
      return {
        ok: false,
        error: "Sekolah ini sudah menghantar. Sila masukkan nombor tiket untuk mengemaskini.",
      };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(mjkdMaklumBalas)
        .set({
          namaPengisi: data.namaPengisi,
          jawatanPengisi: data.jawatanPengisi,
          tarikhHantar: now,
          updatedAt: now,
        })
        .where(eq(mjkdMaklumBalas.id, existing.id));
      await simpanItem(tx, existing.id, data);
    });
    revalidateMjkd(mesyuarat.id);
    return { ok: true, receiptToken: existing.receiptToken, schoolCode: school.code };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan maklum balas." };
  }
}

/** Awam: nama PGB (sahaja) daripada direktori + jawatan mengikut jenis sekolah. */
export async function getPrefillPgbMjkd(
  schoolCode: string,
): Promise<{ nama: string; jawatan: string }> {
  const kod = String(schoolCode ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 20);
  const school = kod ? await getSchoolByCode(kod) : null;
  if (!school) return { nama: "", jawatan: "" };
  const nama = await getNamaPgb(school.code);
  return { nama, jawatan: jawatanPgb(kenalJenisSekolah(school.name, school.code), school.name) };
}

/* ============================ Admin: maklum balas ============================ */

/** Admin: simpan maklum balas satu sekolah (tiada semakan tutup/tiket). */
export async function adminSimpanMaklumBalasMjkd(
  payload: MaklumBalasPayload,
): Promise<MjkdActionResult> {
  await requireKandunganAccess();
  const siap = await sediakanSimpan(payload);
  if (!siap.ok) return { ok: false, error: siap.error };
  const { mesyuarat, school, data } = siap;

  try {
    const existing = await getMaklumBalasBySchool(mesyuarat.id, school.code);
    const now = new Date();
    let token = existing?.receiptToken ?? "";

    await db.transaction(async (tx) => {
      if (!existing) {
        token = newReceiptToken();
        const [mb] = await tx
          .insert(mjkdMaklumBalas)
          .values({
            mesyuaratId: mesyuarat.id,
            schoolCode: school.code,
            namaPengisi: data.namaPengisi,
            jawatanPengisi: data.jawatanPengisi,
            receiptToken: token,
            tarikhHantar: now,
          })
          .returning({ id: mjkdMaklumBalas.id });
        await simpanItem(tx, mb!.id, data);
      } else {
        await tx
          .update(mjkdMaklumBalas)
          .set({
            namaPengisi: data.namaPengisi,
            jawatanPengisi: data.jawatanPengisi,
            updatedAt: now,
          })
          .where(eq(mjkdMaklumBalas.id, existing.id));
        await simpanItem(tx, existing.id, data);
      }
    });
    revalidateMjkd(mesyuarat.id);
    return { ok: true, receiptToken: token, schoolCode: school.code };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan." };
  }
}

export async function adminJanaTiketMjkd(
  mesyuaratId: string,
  schoolCode: string,
): Promise<MjkdActionResult> {
  await requireKandunganAccess();
  const existing = await getMaklumBalasBySchool(mesyuaratId, schoolCode);
  if (!existing) return { ok: false, error: "Tiada rekod untuk sekolah ini." };
  const token = newReceiptToken();
  await db
    .update(mjkdMaklumBalas)
    .set({ receiptToken: token, updatedAt: new Date() })
    .where(eq(mjkdMaklumBalas.id, existing.id));
  revalidateMjkd(mesyuaratId);
  return { ok: true, receiptToken: token, schoolCode };
}

/** Admin: tanda "Pilih untuk dibaca" pada satu jawapan; susunan = hujung senarai perkara itu. */
export async function adminPilihBacaMjkd(
  itemId: string,
  dipilih: boolean,
): Promise<MjkdActionResult> {
  await requireKandunganAccess();
  const [item] = await db
    .select()
    .from(mjkdMaklumBalasItem)
    .where(eq(mjkdMaklumBalasItem.id, itemId))
    .limit(1);
  if (!item) return { ok: false, error: "Jawapan tidak dijumpai." };
  const [mb] = await db
    .select({ mesyuaratId: mjkdMaklumBalas.mesyuaratId })
    .from(mjkdMaklumBalas)
    .where(eq(mjkdMaklumBalas.id, item.maklumBalasId))
    .limit(1);

  if (!dipilih) {
    await db
      .update(mjkdMaklumBalasItem)
      .set({ dipilih: false, susunanBacaan: null })
      .where(eq(mjkdMaklumBalasItem.id, itemId));
  } else {
    const [maks] = await db
      .select({ nilai: sql<number>`coalesce(max(${mjkdMaklumBalasItem.susunanBacaan}), 0)` })
      .from(mjkdMaklumBalasItem)
      .where(
        and(eq(mjkdMaklumBalasItem.perkaraId, item.perkaraId), eq(mjkdMaklumBalasItem.dipilih, true)),
      );
    await db
      .update(mjkdMaklumBalasItem)
      .set({ dipilih: true, susunanBacaan: Number(maks?.nilai ?? 0) + 1 })
      .where(eq(mjkdMaklumBalasItem.id, itemId));
  }
  revalidateMjkd(mb?.mesyuaratId);
  return { ok: true };
}

/** Admin: naik/turun susunan bacaan antara jawapan yang dipilih bagi perkara yang sama. */
export async function adminUbahSusunanBacaMjkd(
  itemId: string,
  arah: "naik" | "turun",
): Promise<MjkdActionResult> {
  await requireKandunganAccess();
  const [item] = await db
    .select()
    .from(mjkdMaklumBalasItem)
    .where(eq(mjkdMaklumBalasItem.id, itemId))
    .limit(1);
  if (!item || !item.dipilih) return { ok: false, error: "Jawapan belum dipilih." };

  const [mb] = await db
    .select({ mesyuaratId: mjkdMaklumBalas.mesyuaratId })
    .from(mjkdMaklumBalas)
    .where(eq(mjkdMaklumBalas.id, item.maklumBalasId))
    .limit(1);

  const dipilih = await db
    .select({ id: mjkdMaklumBalasItem.id })
    .from(mjkdMaklumBalasItem)
    .where(
      and(eq(mjkdMaklumBalasItem.perkaraId, item.perkaraId), eq(mjkdMaklumBalasItem.dipilih, true)),
    )
    .orderBy(asc(mjkdMaklumBalasItem.susunanBacaan), asc(mjkdMaklumBalasItem.id));

  const idx = dipilih.findIndex((x) => x.id === itemId);
  const sasaran = arah === "naik" ? idx - 1 : idx + 1;
  if (idx < 0 || sasaran < 0 || sasaran >= dipilih.length) return { ok: true };
  [dipilih[idx], dipilih[sasaran]] = [dipilih[sasaran]!, dipilih[idx]!];

  await db.transaction(async (tx) => {
    for (let i = 0; i < dipilih.length; i += 1) {
      await tx
        .update(mjkdMaklumBalasItem)
        .set({ susunanBacaan: i + 1 })
        .where(eq(mjkdMaklumBalasItem.id, dipilih[i]!.id));
    }
  });
  revalidateMjkd(mb?.mesyuaratId);
  return { ok: true };
}

/* ============================ Admin: mesyuarat ============================ */

const mesyuaratSchema = z.object({
  bil: z.coerce.number().int().min(1, "Bil. mesti sekurang-kurangnya 1.").max(99),
  tahun: z.coerce.number().int().min(2020, "Tahun tidak sah.").max(2100, "Tahun tidak sah."),
  tarikh: z.string().refine(isTarikhIso, "Tarikh mesyuarat tidak sah."),
  tempat: z.string().max(300),
});

/** Tarikh tamat (pilihan, mesti selepas tarikh mula) dan mesyuarat sebelum (mesti wujud dan lebih awal). */
async function semakHariDanSebelum(
  formData: FormData,
  tarikh: string,
  sasaran: { tahun: number; bil: number },
  dirinyaId?: string,
): Promise<
  | { ok: true; tarikhTamat: string | null; mesyuaratSebelumId: string | null }
  | { ok: false; error: string }
> {
  const tamatRaw = textField(formData.get("tarikhTamat"), 10);
  let tarikhTamat: string | null = null;
  if (tamatRaw) {
    if (!isTarikhIso(tamatRaw)) return { ok: false, error: "Tarikh tamat tidak sah." };
    if (tamatRaw < tarikh) {
      return { ok: false, error: "Tarikh tamat tidak boleh sebelum tarikh mula." };
    }
    tarikhTamat = tamatRaw === tarikh ? null : tamatRaw;
  }
  const sebelumRaw = textField(formData.get("mesyuaratSebelumId"), 64);
  let mesyuaratSebelumId: string | null = null;
  if (sebelumRaw) {
    if (sebelumRaw === dirinyaId) {
      return { ok: false, error: "Mesyuarat sebelum tidak boleh mesyuarat ini sendiri." };
    }
    const sebelum = await getMesyuarat(sebelumRaw);
    if (!sebelum) return { ok: false, error: "Mesyuarat sebelum tidak dijumpai." };
    if (!lebihAwal(sebelum, sasaran)) {
      return { ok: false, error: "Mesyuarat sebelum mesti lebih awal (Bil./tahun lebih kecil)." };
    }
    mesyuaratSebelumId = sebelum.id;
  }
  return { ok: true, tarikhTamat, mesyuaratSebelumId };
}

export async function adminBuatMesyuaratMjkd(formData: FormData): Promise<MjkdActionResult> {
  await requireKandunganAccess();
  const parsed = mesyuaratSchema.safeParse({
    bil: formData.get("bil"),
    tahun: formData.get("tahun"),
    tarikh: textField(formData.get("tarikh"), 10),
    tempat: textField(formData.get("tempat"), 300),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }
  const hari = await semakHariDanSebelum(formData, parsed.data.tarikh, parsed.data);
  if (!hari.ok) return { ok: false, error: hari.error };
  try {
    const [row] = await db
      .insert(mjkdMesyuarat)
      .values({
        ...parsed.data,
        tarikhTamat: hari.tarikhTamat,
        mesyuaratSebelumId: hari.mesyuaratSebelumId,
      })
      .returning({
      id: mjkdMesyuarat.id,
    });
    revalidateMjkd(row?.id);
    return { ok: true, id: row?.id };
  } catch (e) {
    return { ok: false, error: ralatPangkalanData(e, "Gagal mencipta mesyuarat.") };
  }
}

/** Tetapan mesyuarat: Bil./tahun/tarikh (+ tamat)/tempat/mesyuarat sebelum + buka/tutup maklum balas + tarikh tutup. */
export async function adminKemaskiniMesyuaratMjkd(
  formData: FormData,
): Promise<MjkdActionResult> {
  await requireKandunganAccess();
  const id = textField(formData.get("id"), 64);
  const mesyuarat = await getMesyuarat(id);
  if (!mesyuarat) return { ok: false, error: "Mesyuarat tidak dijumpai." };

  const parsed = mesyuaratSchema.safeParse({
    bil: formData.get("bil"),
    tahun: formData.get("tahun"),
    tarikh: textField(formData.get("tarikh"), 10),
    tempat: textField(formData.get("tempat"), 300),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }
  const tutupRaw = textField(formData.get("tarikhTutupMaklumBalas"), 10);
  if (tutupRaw && !isTarikhIso(tutupRaw)) {
    return { ok: false, error: "Tarikh tutup maklum balas tidak sah." };
  }
  const hari = await semakHariDanSebelum(formData, parsed.data.tarikh, parsed.data, id);
  if (!hari.ok) return { ok: false, error: hari.error };

  try {
    await db
      .update(mjkdMesyuarat)
      .set({
        ...parsed.data,
        tarikhTamat: hari.tarikhTamat,
        mesyuaratSebelumId: hari.mesyuaratSebelumId,
        maklumBalasDibuka: textField(formData.get("maklumBalasDibuka"), 10) === "yes",
        tarikhTutupMaklumBalas: tutupRaw || null,
        updatedAt: new Date(),
      })
      .where(eq(mjkdMesyuarat.id, id));
    revalidateMjkd(id);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: ralatPangkalanData(e, "Gagal menyimpan tetapan.") };
  }
}

/** Muat naik / ganti minit PDF (Supabase Storage; PDF sahaja, maks 8 MB). */
export async function adminMuatNaikMinitMjkd(formData: FormData): Promise<MjkdActionResult> {
  await requireKandunganAccess();
  const id = textField(formData.get("id"), 64);
  const mesyuarat = await getMesyuarat(id);
  if (!mesyuarat) return { ok: false, error: "Mesyuarat tidak dijumpai." };

  const fail = formData.get("minit");
  if (!(fail instanceof File) || fail.size === 0) {
    return { ok: false, error: "Sila pilih fail PDF minit." };
  }
  if (fail.size > MINIT_MAKS_BYTE) {
    return { ok: false, error: "Fail minit melebihi 8 MB." };
  }
  const buffer = Buffer.from(await fail.arrayBuffer());
  // Semak jenis sebenar (tajuk fail dan MIME boleh dipalsukan): PDF bermula "%PDF-".
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    return { ok: false, error: "Hanya fail PDF dibenarkan." };
  }

  const path = `mjkd/${mesyuarat.tahun}-bil${mesyuarat.bil}/minit-${Date.now()}.pdf`;
  try {
    const url = await uploadPublicStorageObject(
      path,
      { name: fail.name, type: "application/pdf", buffer },
      "Muat naik minit MJKD",
    );
    await db
      .update(mjkdMesyuarat)
      .set({ minitUrl: url, minitStoragePath: path, updatedAt: new Date() })
      .where(eq(mjkdMesyuarat.id, id));
    revalidateMjkd(id);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memuat naik minit." };
  }
}

/* ============================ Admin: perkara ============================ */

const perkaraSchema = z.object({
  para: z.string().trim().min(1, "Sila isi nombor para.").max(100),
  mukaSurat: z.string().trim().max(50),
  perkara: z.string().trim().min(1, "Sila isi perkara.").max(4000),
  tindakan: z.string().trim().min(1, "Sila isi tindakan.").max(500),
  panduan: z.string().trim().max(1000),
  sasaran: z.string().refine(isSasaranMjkd, "Sasaran tidak sah."),
});

export async function adminSimpanPerkaraMjkd(formData: FormData): Promise<MjkdActionResult> {
  await requireKandunganAccess();
  const mesyuaratId = textField(formData.get("mesyuaratId"), 64);
  const mesyuarat = await getMesyuarat(mesyuaratId);
  if (!mesyuarat) return { ok: false, error: "Mesyuarat tidak dijumpai." };

  const parsed = perkaraSchema.safeParse({
    para: formData.get("para") ?? "",
    mukaSurat: formData.get("mukaSurat") ?? "",
    perkara: formData.get("perkara") ?? "",
    tindakan: formData.get("tindakan") ?? "",
    panduan: formData.get("panduan") ?? "",
    sasaran: textField(formData.get("sasaran"), 10),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const khususRaw = [
    ...new Set(
      formData
        .getAll("sekolahKhusus")
        .map((v) => String(v).trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
  if (khususRaw.length > 0) {
    const ada = await db
      .select({ code: schools.code })
      .from(schools)
      .where(inArray(schools.code, khususRaw));
    if (ada.length !== khususRaw.length) {
      return { ok: false, error: "Terdapat kod sekolah khusus yang tidak dijumpai." };
    }
  }

  const aktif = textField(formData.get("aktif"), 10) === "yes";
  const id = textField(formData.get("id"), 64);

  try {
    if (id) {
      const [updated] = await db
        .update(mjkdPerkara)
        .set({ ...parsed.data, sekolahKhusus: khususRaw, aktif })
        .where(and(eq(mjkdPerkara.id, id), eq(mjkdPerkara.mesyuaratId, mesyuaratId)))
        .returning({ id: mjkdPerkara.id });
      if (!updated) return { ok: false, error: "Perkara tidak dijumpai." };
    } else {
      const [maks] = await db
        .select({ nilai: sql<number>`coalesce(max(${mjkdPerkara.sort}), 0)` })
        .from(mjkdPerkara)
        .where(eq(mjkdPerkara.mesyuaratId, mesyuaratId));
      await db.insert(mjkdPerkara).values({
        ...parsed.data,
        mesyuaratId,
        sekolahKhusus: khususRaw,
        aktif,
        sort: Number(maks?.nilai ?? 0) + 1,
      });
    }
    revalidateMjkd(mesyuaratId);
    return { ok: true, id: mesyuaratId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan perkara." };
  }
}

export async function adminTogolPerkaraAktifMjkd(
  id: string,
  aktif: boolean,
): Promise<MjkdActionResult> {
  await requireKandunganAccess();
  const [row] = await db
    .update(mjkdPerkara)
    .set({ aktif })
    .where(eq(mjkdPerkara.id, id))
    .returning({ mesyuaratId: mjkdPerkara.mesyuaratId });
  if (!row) return { ok: false, error: "Perkara tidak dijumpai." };
  revalidateMjkd(row.mesyuaratId);
  return { ok: true };
}

/** Padam perkara — hanya jika belum ada jawapan (jika sudah, nyahaktifkan sahaja). */
export async function adminPadamPerkaraMjkd(id: string): Promise<MjkdActionResult> {
  await requireKandunganAccess();
  const [perkara] = await db.select().from(mjkdPerkara).where(eq(mjkdPerkara.id, id)).limit(1);
  if (!perkara) return { ok: false, error: "Perkara tidak dijumpai." };
  const [jawapan] = await db
    .select({ id: mjkdMaklumBalasItem.id })
    .from(mjkdMaklumBalasItem)
    .where(eq(mjkdMaklumBalasItem.perkaraId, id))
    .limit(1);
  if (jawapan) {
    return {
      ok: false,
      error: "Perkara ini sudah ada jawapan sekolah dan tidak boleh dipadam. Nyahaktifkan sahaja.",
    };
  }
  await db.delete(mjkdPerkara).where(eq(mjkdPerkara.id, id));
  revalidateMjkd(perkara.mesyuaratId);
  return { ok: true };
}

export async function adminUbahSusunPerkaraMjkd(
  id: string,
  arah: "naik" | "turun",
): Promise<MjkdActionResult> {
  await requireKandunganAccess();
  const [perkara] = await db.select().from(mjkdPerkara).where(eq(mjkdPerkara.id, id)).limit(1);
  if (!perkara) return { ok: false, error: "Perkara tidak dijumpai." };

  const semua = await listPerkara(perkara.mesyuaratId);
  const idx = semua.findIndex((p) => p.id === id);
  const sasaran = arah === "naik" ? idx - 1 : idx + 1;
  if (idx < 0 || sasaran < 0 || sasaran >= semua.length) return { ok: true };
  [semua[idx], semua[sasaran]] = [semua[sasaran]!, semua[idx]!];

  await db.transaction(async (tx) => {
    for (let i = 0; i < semua.length; i += 1) {
      await tx
        .update(mjkdPerkara)
        .set({ sort: i + 1 })
        .where(eq(mjkdPerkara.id, semua[i]!.id));
    }
  });
  revalidateMjkd(perkara.mesyuaratId);
  return { ok: true };
}
