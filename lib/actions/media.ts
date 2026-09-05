"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { mediaCards } from "@/lib/schema";
import { requireKandunganAccess } from "@/lib/rbac";
import { isLetterMonthKey } from "@/lib/media/drive-path";
import { mediaAdminHref, mediaHref } from "@/lib/media/kategori";
import { uploadMediaFileToDrive } from "@/lib/media/publish";

const kategoriSchema = z.enum(["koleksi"]);

const cardSchema = z.object({
  kategori: kategoriSchema,
  title: z.string().trim().min(1, "Sila isi tajuk").max(300),
  url: z.string().trim().max(2000),
  letterMonth: z.string().trim(),
  sort: z.coerce.number().int().default(0),
  aktif: z.coerce.boolean().default(true),
});

function revalidateMedia(kategori: string) {
  revalidatePath("/admin/media");
  revalidatePath("/media");
  revalidatePath(mediaHref(kategori));
  revalidatePath(mediaAdminHref(kategori));
}

function parseLetterMonth(raw: string): string | null | { error: string } {
  if (!raw) return null;
  if (!isLetterMonthKey(raw)) return { error: "Bulan bahan tidak sah" };
  return raw;
}

export async function saveMediaCard(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; id?: number }> {
  await requireKandunganAccess();
  const parsed = cardSchema.safeParse({
    kategori: formData.get("kategori"),
    title: formData.get("title") ?? "",
    url: formData.get("url") ?? "",
    letterMonth: formData.get("letterMonth") ?? "",
    sort: formData.get("sort") || 0,
    aktif: formData.get("aktif") === "on" || formData.get("aktif") === "true",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah" };
  }

  const letterMonth = parseLetterMonth(parsed.data.letterMonth);
  if (letterMonth && typeof letterMonth === "object") {
    return { ok: false, error: letterMonth.error };
  }

  const file = formData.get("fail");
  let url = parsed.data.url;
  if (file instanceof File && file.size > 0) {
    if (!letterMonth) {
      return { ok: false, error: "Sila pilih bulan bahan sebelum memuat naik fail." };
    }
    try {
      const uploaded = await uploadMediaFileToDrive({
        kategori: parsed.data.kategori,
        title: parsed.data.title,
        letterMonth,
        file: {
          name: file.name,
          type: file.type,
          buffer: Buffer.from(await file.arrayBuffer()),
        },
      });
      url = uploaded.url;
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Gagal memuat naik fail.",
      };
    }
  }

  if (!url) {
    return { ok: false, error: "Sila isi pautan atau muat naik fail video / gambar." };
  }

  const data = {
    kategori: parsed.data.kategori,
    title: parsed.data.title,
    url,
    letterMonth,
    sort: parsed.data.sort,
    aktif: parsed.data.aktif,
  };
  const idRaw = String(formData.get("id") ?? "").trim();

  if (idRaw) {
    const id = Number(idRaw);
    if (!Number.isInteger(id)) return { ok: false, error: "ID tidak sah" };
    await db
      .update(mediaCards)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mediaCards.id, id));
    revalidateMedia(data.kategori);
    return { ok: true, id };
  }

  const [row] = await db.insert(mediaCards).values(data).returning({ id: mediaCards.id });
  revalidateMedia(data.kategori);
  return { ok: true, id: row.id };
}

export async function deleteMediaCard(id: number): Promise<{ ok: boolean }> {
  await requireKandunganAccess();
  const row = await db.query.mediaCards.findFirst({ where: eq(mediaCards.id, id) });
  if (row) {
    await db.delete(mediaCards).where(eq(mediaCards.id, id));
    revalidateMedia(row.kategori);
  }
  return { ok: true };
}

export async function toggleMediaAktif(id: number): Promise<{ ok: boolean }> {
  await requireKandunganAccess();
  const row = await db.query.mediaCards.findFirst({ where: eq(mediaCards.id, id) });
  if (row) {
    await db
      .update(mediaCards)
      .set({ aktif: !row.aktif, updatedAt: new Date() })
      .where(eq(mediaCards.id, id));
    revalidateMedia(row.kategori);
  }
  return { ok: true };
}
