"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { resourcesCards } from "@/lib/schema";
import { requireKandunganAccess } from "@/lib/rbac";
import { isLetterMonthKey } from "@/lib/resources/drive-path";
import {
  resourcesAdminHref,
  resourcesHref,
} from "@/lib/resources/kategori";
import { uploadResourcesFileToDrive } from "@/lib/resources/publish";

const kategoriSchema = z.enum([
  "surat-ustp",
  "surat-sekolah",
  "pekeliling",
  "nota",
]);

const cardSchema = z.object({
  kategori: kategoriSchema,
  title: z.string().trim().min(1, "Sila isi tajuk").max(300),
  url: z.string().trim().max(2000),
  letterMonth: z.string().trim(),
  sort: z.coerce.number().int().default(0),
  aktif: z.coerce.boolean().default(true),
});

function revalidateResources(kategori: string) {
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  revalidatePath(resourcesHref(kategori));
  revalidatePath(resourcesAdminHref(kategori));
}

function parseLetterMonth(raw: string): string | null | { error: string } {
  if (!raw) return null;
  if (!isLetterMonthKey(raw)) return { error: "Bulan surat tidak sah" };
  return raw;
}

export async function saveResourcesCard(
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
      return { ok: false, error: "Sila pilih bulan surat sebelum memuat naik fail." };
    }
    try {
      const uploaded = await uploadResourcesFileToDrive({
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
    return { ok: false, error: "Sila isi pautan atau muat naik fail surat." };
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
      .update(resourcesCards)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(resourcesCards.id, id));
    revalidateResources(data.kategori);
    return { ok: true, id };
  }

  const [row] = await db.insert(resourcesCards).values(data).returning({ id: resourcesCards.id });
  revalidateResources(data.kategori);
  return { ok: true, id: row.id };
}

export async function deleteResourcesCard(id: number): Promise<{ ok: boolean }> {
  await requireKandunganAccess();
  const row = await db.query.resourcesCards.findFirst({ where: eq(resourcesCards.id, id) });
  if (row) {
    await db.delete(resourcesCards).where(eq(resourcesCards.id, id));
    revalidateResources(row.kategori);
  }
  return { ok: true };
}

export async function toggleResourcesAktif(id: number): Promise<{ ok: boolean }> {
  await requireKandunganAccess();
  const row = await db.query.resourcesCards.findFirst({ where: eq(resourcesCards.id, id) });
  if (row) {
    await db
      .update(resourcesCards)
      .set({ aktif: !row.aktif, updatedAt: new Date() })
      .where(eq(resourcesCards.id, id));
    revalidateResources(row.kategori);
  }
  return { ok: true };
}
