"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { kandunganCards, kandunganCardType, kandunganTopik } from "@/lib/schema";
import { requireKandunganAccess } from "@/lib/rbac";
import { TOPIK_META } from "@/lib/kandungan/topik";

const topikSchema = z.enum(kandunganTopik.enumValues);
const typeSchema = z.enum(kandunganCardType.enumValues);

const cardSchema = z.object({
  topik: topikSchema,
  subtopikKey: z.string().trim().max(120).default(""),
  subtopikTitle: z.string().trim().max(300).default(""),
  subtopikSort: z.coerce.number().int().default(999),
  subtopikBlurb: z.string().trim().max(500).default(""),
  subtopikIcon: z.string().trim().max(20).default(""),
  sort: z.coerce.number().int().default(0),
  title: z.string().trim().min(1, "Sila isi tajuk").max(300),
  blurb: z.string().trim().max(500).default(""),
  url: z.string().trim().min(1, "Sila isi URL").max(2000),
  type: typeSchema,
  previewUrl: z.string().trim().max(2000).default(""),
  aktif: z.coerce.boolean().default(true),
});

/** Segarkan halaman awam topik berkenaan + senarai admin. */
function revalidateKandungan(topik: string) {
  revalidatePath("/admin/kandungan");
  revalidatePath("/sumber");
  const meta = TOPIK_META.find((t) => t.topik === topik);
  if (meta) revalidatePath(`/sumber/${meta.slug}`);
}

export async function saveKandunganCard(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; id?: number }> {
  await requireKandunganAccess();
  const parsed = cardSchema.safeParse({
    topik: formData.get("topik"),
    subtopikKey: formData.get("subtopikKey") ?? "",
    subtopikTitle: formData.get("subtopikTitle") ?? "",
    subtopikSort: formData.get("subtopikSort") || 999,
    subtopikBlurb: formData.get("subtopikBlurb") ?? "",
    subtopikIcon: formData.get("subtopikIcon") ?? "",
    sort: formData.get("sort") || 0,
    title: formData.get("title") ?? "",
    blurb: formData.get("blurb") ?? "",
    url: formData.get("url") ?? "",
    type: formData.get("type"),
    previewUrl: formData.get("previewUrl") ?? "",
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
      .update(kandunganCards)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(kandunganCards.id, id));
    revalidateKandungan(data.topik);
    return { ok: true, id };
  }

  const [row] = await db.insert(kandunganCards).values(data).returning({ id: kandunganCards.id });
  revalidateKandungan(data.topik);
  return { ok: true, id: row.id };
}

export async function deleteKandunganCard(id: number): Promise<{ ok: boolean }> {
  await requireKandunganAccess();
  const row = await db.query.kandunganCards.findFirst({ where: eq(kandunganCards.id, id) });
  if (row) {
    await db.delete(kandunganCards).where(eq(kandunganCards.id, id));
    revalidateKandungan(row.topik);
  }
  return { ok: true };
}

export async function toggleKandunganAktif(id: number): Promise<{ ok: boolean }> {
  await requireKandunganAccess();
  const row = await db.query.kandunganCards.findFirst({ where: eq(kandunganCards.id, id) });
  if (row) {
    await db
      .update(kandunganCards)
      .set({ aktif: !row.aktif, updatedAt: new Date() })
      .where(eq(kandunganCards.id, id));
    revalidateKandungan(row.topik);
  }
  return { ok: true };
}

const groupSchema = z.object({
  topik: topikSchema,
  subtopikKey: z.string().trim().min(1),
  subtopikTitle: z.string().trim().max(300).default(""),
  subtopikSort: z.coerce.number().int().default(999),
  subtopikBlurb: z.string().trim().max(500).default(""),
  subtopikIcon: z.string().trim().max(20).default(""),
});

/** Kemas kini medan subtopik untuk SEMUA kad dalam kumpulan (satu UPDATE). */
export async function updateSubtopikGroup(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const parsed = groupSchema.safeParse({
    topik: formData.get("topik"),
    subtopikKey: formData.get("subtopikKey") ?? "",
    subtopikTitle: formData.get("subtopikTitle") ?? "",
    subtopikSort: formData.get("subtopikSort") || 999,
    subtopikBlurb: formData.get("subtopikBlurb") ?? "",
    subtopikIcon: formData.get("subtopikIcon") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah" };
  }
  const d = parsed.data;
  await db
    .update(kandunganCards)
    .set({
      subtopikTitle: d.subtopikTitle,
      subtopikSort: d.subtopikSort,
      subtopikBlurb: d.subtopikBlurb,
      subtopikIcon: d.subtopikIcon,
      updatedAt: new Date(),
    })
    .where(
      and(eq(kandunganCards.topik, d.topik), eq(kandunganCards.subtopikKey, d.subtopikKey)),
    );
  revalidateKandungan(d.topik);
  return { ok: true };
}
