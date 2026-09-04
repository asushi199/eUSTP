"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { resourcesCards } from "@/lib/schema";
import { requireKandunganAccess } from "@/lib/rbac";
import {
  resourcesAdminHref,
  resourcesHref,
} from "@/lib/resources/kategori";

const kategoriSchema = z.enum([
  "surat-ustp",
  "surat-sekolah",
  "pekeliling",
  "nota",
  "sijil",
]);

const cardSchema = z.object({
  kategori: kategoriSchema,
  title: z.string().trim().min(1, "Sila isi tajuk").max(300),
  url: z.string().trim().min(1, "Sila isi pautan").max(2000),
  sort: z.coerce.number().int().default(0),
  aktif: z.coerce.boolean().default(true),
});

function revalidateResources(kategori: string) {
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  revalidatePath(resourcesHref(kategori));
  revalidatePath(resourcesAdminHref(kategori));
}

export async function saveResourcesCard(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; id?: number }> {
  await requireKandunganAccess();
  const parsed = cardSchema.safeParse({
    kategori: formData.get("kategori"),
    title: formData.get("title") ?? "",
    url: formData.get("url") ?? "",
    sort: formData.get("sort") || 0,
    aktif: formData.get("aktif") === "on" || formData.get("aktif") === "true",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah" };
  }
  const data = parsed.data;
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
