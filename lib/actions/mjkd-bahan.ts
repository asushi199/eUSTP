"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, withDbTimeout } from "@/lib/db";
import { mjkdBahan, mjkdMesyuarat } from "@/lib/schema";
import { requireKandunganAccess } from "@/lib/rbac";
import {
  deleteLaporanPhotoViaGas,
  isGasStorageConfigured,
  uploadFileViaGas,
} from "@/lib/gas-upload";
import {
  BAHAN_PDF_MAKS_BYTE,
  idDriveDariPath,
  sahkanBahanInput,
  sahkanPautanBahan,
  urlPratontonDrive,
  type JenisBahan,
} from "@/lib/mjkd/bahan";
import { janaKodMuatNaik, semakKodMuatNaik } from "@/lib/mjkd/bahan-kod";
import { hariMesyuarat, labelBeberapaHari } from "@/lib/mjkd/hari";
import { getBahan, getMesyuarat, getMesyuaratBahanDibuka } from "@/lib/mjkd/queries";
import {
  MESEJ_BAHAN_TIDAK_PASTI,
  MESEJ_DB_PERLAHAN,
  MESEJ_RALAT_UMUM,
  isRalatTimeoutDb,
} from "@/lib/mjkd/ralat-db";

export type BahanActionResult = { ok: boolean; error?: string; kod?: string };

export type BahanDisimpan = {
  sektorUnit: string;
  tajuk: string;
  namaPembentang: string;
  hariLabel: string;
  jenis: string;
  url: string;
};

export type MuatNaikBahanResult = { ok: boolean; error?: string; bahan?: BahanDisimpan };

function textField(value: FormDataEntryValue | null, max = 2000): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function revalidateBahan(mesyuaratId?: string) {
  revalidatePath("/laporan-mjkd");
  revalidatePath("/laporan-mjkd/bahan/muat-naik");
  if (mesyuaratId) {
    revalidatePath(`/admin/mjkd/${mesyuaratId}`);
    revalidatePath(`/admin/mjkd/${mesyuaratId}/pembentangan`);
  }
}

function slugFail(teks: string, maks = 40): string {
  return (
    teks
      .normalize("NFKD")
      .replace(/[^\x00-\x7f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, maks) || "bahan"
  );
}

type Mesyuarat = NonNullable<Awaited<ReturnType<typeof getMesyuarat>>>;

type BahanSiap = {
  sektorUnit: string;
  tajuk: string;
  namaPembentang: string;
  hari: string[];
  jenis: JenisBahan;
  url: string;
  storagePath: string;
};

/**
 * Sahkan medan borang dan (jika PDF) muat naik fail ke Google Drive melalui GAS.
 * `lama` ialah bahan sedia ada (suntingan): tiada fail baharu = kekal fail/pautan lama bagi jenis yang sama.
 */
async function sediakanBahan(
  mesyuarat: Mesyuarat,
  formData: FormData,
  lama: typeof mjkdBahan.$inferSelect | null,
): Promise<{ ok: true; data: BahanSiap } | { ok: false; error: string }> {
  const sah = sahkanBahanInput(
    {
      sektorUnit: textField(formData.get("sektorUnit"), 300),
      tajuk: textField(formData.get("tajuk"), 600),
      namaPembentang: textField(formData.get("namaPembentang"), 400),
      hariNilai: textField(formData.get("hari"), 200),
    },
    hariMesyuarat(mesyuarat),
  );
  if (!sah.ok) return { ok: false, error: sah.error };

  const jenisRaw = textField(formData.get("jenis"), 10);
  if (jenisRaw === "PAUTAN") {
    const pautan = sahkanPautanBahan(textField(formData.get("url"), 1200));
    if (!pautan.ok) return { ok: false, error: pautan.error };
    return {
      ok: true,
      data: { ...sah.data, jenis: "PAUTAN", url: pautan.url, storagePath: "" },
    };
  }
  if (jenisRaw !== "PDF") return { ok: false, error: "Sila pilih jenis bahan (Pautan atau Fail PDF)." };

  const fail = formData.get("fail");
  const adaFail = fail instanceof File && fail.size > 0;
  if (!adaFail) {
    if (lama && lama.jenis === "PDF") {
      return {
        ok: true,
        data: { ...sah.data, jenis: "PDF", url: lama.url, storagePath: lama.storagePath },
      };
    }
    return { ok: false, error: "Sila pilih fail PDF." };
  }
  if (fail.size > BAHAN_PDF_MAKS_BYTE) {
    return { ok: false, error: "Fail PDF melebihi 3 MB. Sila kecilkan fail atau guna pautan." };
  }
  const buffer = Buffer.from(await fail.arrayBuffer());
  // Semak jenis sebenar (nama fail dan MIME boleh dipalsukan): PDF bermula "%PDF-".
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    return { ok: false, error: "Hanya fail PDF dibenarkan." };
  }
  if (!isGasStorageConfigured()) {
    return { ok: false, error: "Storan fail belum dikonfigurasi. Sila guna pautan atau hubungi admin." };
  }

  try {
    const fileName = `${slugFail(sah.data.sektorUnit)}_${slugFail(sah.data.tajuk, 60)}_${randomUUID().slice(0, 8)}.pdf`;
    const uploaded = await uploadFileViaGas(
      { name: fileName, type: "application/pdf", buffer },
      { fileName, subPath: ["MJKD", `${mesyuarat.tahun}-Bil${mesyuarat.bil}`, "Bahan"] },
    );
    const id = idDriveDariPath(uploaded.path);
    return {
      ok: true,
      data: {
        ...sah.data,
        jenis: "PDF",
        url: id ? urlPratontonDrive(id) : uploaded.publicUrl,
        storagePath: uploaded.path,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memuat naik fail." };
  }
}

function ringkas(d: BahanSiap): BahanDisimpan {
  return {
    sektorUnit: d.sektorUnit,
    tajuk: d.tajuk,
    namaPembentang: d.namaPembentang,
    hariLabel: labelBeberapaHari(d.hari),
    jenis: d.jenis,
    url: d.url,
  };
}

/** Awam: pembentang muat naik bahan. Hanya jika muat naik dibuka DAN kod kongsi betul (masa-malar). */
export async function muatNaikBahanAwam(formData: FormData): Promise<MuatNaikBahanResult> {
  let mesyuarat: Awaited<ReturnType<typeof getMesyuaratBahanDibuka>>;
  try {
    mesyuarat = await withDbTimeout(getMesyuaratBahanDibuka());
  } catch (e) {
    return { ok: false, error: isRalatTimeoutDb(e) ? MESEJ_DB_PERLAHAN : MESEJ_RALAT_UMUM };
  }
  if (!mesyuarat) return { ok: false, error: "Muat naik bahan belum dibuka." };
  if (!semakKodMuatNaik(textField(formData.get("kod"), 64), mesyuarat.kodMuatNaikBahan)) {
    return { ok: false, error: "Kod muat naik tidak betul." };
  }

  const siap = await sediakanBahan(mesyuarat, formData, null);
  if (!siap.ok) return { ok: false, error: siap.error };
  try {
    await withDbTimeout(
      db.insert(mjkdBahan).values({
        mesyuaratId: mesyuarat.id,
        ...siap.data,
        dimuatNaikOleh: "awam",
      }),
    );
  } catch (e) {
    // Timeout: INSERT mungkin masih berjaya kemudian — jangan padam fail Drive; status tidak pasti.
    if (isRalatTimeoutDb(e)) return { ok: false, error: MESEJ_BAHAN_TIDAK_PASTI };
    // Fail sudah di Drive tetapi baris gagal — buang fail yatim (best-effort).
    if (siap.data.storagePath) await deleteLaporanPhotoViaGas(siap.data.storagePath);
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan bahan." };
  }
  revalidateBahan(mesyuarat.id);
  return { ok: true, bahan: ringkas(siap.data) };
}

/* ================================ Admin ================================ */

export async function adminSetBahanDibukaMjkd(
  id: string,
  dibuka: boolean,
): Promise<BahanActionResult> {
  await requireKandunganAccess();
  const mesyuarat = await getMesyuarat(String(id ?? ""));
  if (!mesyuarat) return { ok: false, error: "Mesyuarat tidak dijumpai." };
  // Jana kod pada kali pertama dibuka supaya muat naik tidak pernah terbuka tanpa kod.
  const kod = mesyuarat.kodMuatNaikBahan || (dibuka ? janaKodMuatNaik() : "");
  await db
    .update(mjkdMesyuarat)
    .set({ bahanDibuka: dibuka === true, kodMuatNaikBahan: kod, updatedAt: new Date() })
    .where(eq(mjkdMesyuarat.id, mesyuarat.id));
  revalidateBahan(mesyuarat.id);
  return { ok: true, kod };
}

/** Jana kod muat naik baharu (kod lama tidak sah lagi). */
export async function adminJanaKodBahanMjkd(id: string): Promise<BahanActionResult> {
  await requireKandunganAccess();
  const mesyuarat = await getMesyuarat(String(id ?? ""));
  if (!mesyuarat) return { ok: false, error: "Mesyuarat tidak dijumpai." };
  const kod = janaKodMuatNaik();
  await db
    .update(mjkdMesyuarat)
    .set({ kodMuatNaikBahan: kod, updatedAt: new Date() })
    .where(eq(mjkdMesyuarat.id, mesyuarat.id));
  revalidateBahan(mesyuarat.id);
  return { ok: true, kod };
}

/** Admin: tambah (mesyuaratId) atau sunting (id bahan) bahan. Fail baharu menggantikan yang lama. */
export async function adminSimpanBahanMjkd(formData: FormData): Promise<BahanActionResult> {
  const user = await requireKandunganAccess();
  const idBahan = textField(formData.get("id"), 64);
  const lama = idBahan ? await getBahan(idBahan) : null;
  if (idBahan && !lama) return { ok: false, error: "Bahan tidak dijumpai." };

  const mesyuarat = await getMesyuarat(lama?.mesyuaratId ?? textField(formData.get("mesyuaratId"), 64));
  if (!mesyuarat) return { ok: false, error: "Mesyuarat tidak dijumpai." };

  const siap = await sediakanBahan(mesyuarat, formData, lama);
  if (!siap.ok) return { ok: false, error: siap.error };

  try {
    if (lama) {
      await db
        .update(mjkdBahan)
        .set({ ...siap.data, updatedAt: new Date() })
        .where(eq(mjkdBahan.id, lama.id));
      // Fail lama diganti/ditinggalkan — buang daripada Drive (best-effort).
      if (lama.storagePath && lama.storagePath !== siap.data.storagePath) {
        await deleteLaporanPhotoViaGas(lama.storagePath);
      }
    } else {
      await db.insert(mjkdBahan).values({
        mesyuaratId: mesyuarat.id,
        ...siap.data,
        dimuatNaikOleh: `admin:${user.nama || "pentadbir"}`.slice(0, 200),
      });
    }
  } catch (e) {
    if (siap.data.storagePath && siap.data.storagePath !== lama?.storagePath) {
      await deleteLaporanPhotoViaGas(siap.data.storagePath);
    }
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan bahan." };
  }
  revalidateBahan(mesyuarat.id);
  return { ok: true };
}

export async function adminPadamBahanMjkd(id: string): Promise<BahanActionResult> {
  await requireKandunganAccess();
  const bahan = await getBahan(String(id ?? ""));
  if (!bahan) return { ok: false, error: "Bahan tidak dijumpai." };
  await db.delete(mjkdBahan).where(eq(mjkdBahan.id, bahan.id));
  if (bahan.storagePath) await deleteLaporanPhotoViaGas(bahan.storagePath);
  revalidateBahan(bahan.mesyuaratId);
  return { ok: true };
}
