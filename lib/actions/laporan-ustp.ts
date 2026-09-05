"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { laporanUstp, type UstpReportPhoto } from "@/lib/schema";
import { deleteLaporanPhotoViaGas, uploadFileViaGas } from "@/lib/gas-upload";
import { USTP_PHOTO_COUNT, USTP_PHOTO_MAX_BYTES } from "@/lib/laporan-ustp/options";
import { parseUstpReport, ustpPhotoSubPath } from "@/lib/laporan-ustp/validation";

type Result = { ok: true; id: string; warning?: string } | { ok: false; error: string };
const recordKey = z.object({ id: z.string().uuid(), version: z.coerce.number().int().min(0) });

export async function saveUstpReport(form: FormData): Promise<Result> {
  const user = await requireUser();
  const key = recordKey.safeParse({ id: form.get("id"), version: form.get("version") });
  const parsed = parseUstpReport(form);
  if (!key.success) return { ok: false, error: "Rujukan tidak sah. Sila buka semula borang." };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Sila semak borang." };
  const { id, version } = key.data;
  const [existing] = await db.select().from(laporanUstp).where(eq(laporanUstp.id, id)).limit(1);
  if ((version === 0 && existing) || (version > 0 && existing?.version !== version)) {
    return { ok: false, error: "Rekod telah disimpan, diubah atau dipadam. Sila buka semula laporan sebelum meneruskan." };
  }

  const files: Array<{ buffer: Buffer; type: string; name: string } | null> = [];
  for (let index = 0; index < USTP_PHOTO_COUNT; index++) {
    const file = form.get(`photo${index}`);
    if (file instanceof File && file.size > 0) {
      if (file.size > USTP_PHOTO_MAX_BYTES) return { ok: false, error: `Gambar ${index + 1} melebihi 3 MB. Sila pilih gambar lebih kecil.` };
      const buffer = Buffer.from(await file.arrayBuffer());
      const jpeg = file.type === "image/jpeg" && buffer[0] === 0xff && buffer[1] === 0xd8;
      const png = file.type === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      if (!jpeg && !png) return { ok: false, error: `Gambar ${index + 1} mesti dalam format JPG atau PNG. Sila pilih semula gambar.` };
      files.push({ buffer, type: file.type, name: `gambar-${index + 1}.${jpeg ? "jpg" : "png"}` });
    } else if (existing?.photos[index]) files.push(null);
    else return { ok: false, error: "Sila pilih dua gambar program." };
  }

  const photos: UstpReportPhoto[] = [];
  const uploaded: UstpReportPhoto[] = [];
  try {
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      if (!file) { photos.push(existing!.photos[index]); continue; }
      const result = await uploadFileViaGas(file, {
        fileName: `${parsed.data.startDate}_${randomUUID()}_${file.name}`,
        subPath: ustpPhotoSubPath(parsed.data.startDate, id),
      });
      const photo = { storagePath: result.path, publicUrl: result.publicUrl };
      uploaded.push(photo);
      photos.push(photo);
    }
  } catch {
    await Promise.all(uploaded.map((photo) => deleteLaporanPhotoViaGas(photo.storagePath)));
    return { ok: false, error: "Gagal memuat naik gambar. Laporan belum disimpan. Sila cuba lagi." };
  }

  let saved: Array<{ id: string }>;
  try {
    const values = { ...parsed.data, photos, updatedAt: new Date() };
    saved = version === 0
      ? await db.insert(laporanUstp).values({ ...values, id, createdBy: Number(user.id) }).onConflictDoNothing().returning({ id: laporanUstp.id })
      : await db.update(laporanUstp).set({ ...values, version: version + 1 })
        .where(and(eq(laporanUstp.id, id), eq(laporanUstp.version, version))).returning({ id: laporanUstp.id });
  } catch {
    // Sambungan boleh terputus selepas COMMIT; jangan padam gambar yang mungkin telah dirujuk.
    return { ok: false, error: "Simpanan belum dapat disahkan. Semak senarai laporan sebelum mencuba lagi." };
  }
  if (!saved.length) {
    await Promise.all(uploaded.map((photo) => deleteLaporanPhotoViaGas(photo.storagePath)));
    return { ok: false, error: "Rekod telah berubah. Sila buka semula laporan untuk melihat versi terkini." };
  }
  const removed = (existing?.photos ?? []).filter((old) => !photos.some((photo) => photo.storagePath === old.storagePath));
  const cleanup = await Promise.all(removed.map((photo) => deleteLaporanPhotoViaGas(photo.storagePath)));
  revalidatePath("/admin/laporan-ustp");
  revalidatePath(`/admin/laporan-ustp/${id}`);
  return { ok: true, id, warning: cleanup.includes(false) ? "Laporan disimpan. Sebahagian gambar lama belum dapat dibuang daripada Drive." : undefined };
}

export async function deleteUstpReport(id: string, version: number): Promise<Result> {
  await requireUser();
  if (!recordKey.safeParse({ id, version }).success || version < 1) return { ok: false, error: "Rujukan laporan tidak sah." };
  const [removed] = await db.delete(laporanUstp).where(and(eq(laporanUstp.id, id), eq(laporanUstp.version, version)))
    .returning({ photos: laporanUstp.photos });
  if (!removed) return { ok: false, error: "Rekod telah berubah atau dipadam. Sila muat semula senarai." };
  const cleanup = await Promise.all(removed.photos.map((photo) => deleteLaporanPhotoViaGas(photo.storagePath)));
  revalidatePath("/admin/laporan-ustp");
  revalidatePath(`/admin/laporan-ustp/${id}`);
  return { ok: true, id, warning: cleanup.includes(false) ? "Laporan dipadam. Sebahagian gambar belum dapat dibuang daripada Drive." : undefined };
}
