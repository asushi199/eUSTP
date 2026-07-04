"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { pegawai } from "@/lib/schema";
import { requireKandunganAccess } from "@/lib/rbac";

const pegawaiSchema = z.object({
  nama: z.string().trim().min(1, "Sila isi nama").max(200),
  jawatan: z.string().trim().max(300).default(""),
  telefon: z.string().trim().max(100).default(""),
  photoUrl: z.string().trim().max(2000).default(""),
  detailUrl: z.string().trim().max(2000).default(""),
  sort: z.coerce.number().int().default(0),
  aktif: z.coerce.boolean().default(true),
});

function revalidatePegawai() {
  revalidatePath("/admin/pegawai");
  revalidatePath("/maklumat-asas");
}

export async function savePegawai(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const parsed = pegawaiSchema.safeParse({
    nama: formData.get("nama") ?? "",
    jawatan: formData.get("jawatan") ?? "",
    telefon: formData.get("telefon") ?? "",
    photoUrl: formData.get("photoUrl") ?? "",
    detailUrl: formData.get("detailUrl") ?? "",
    sort: formData.get("sort") || 0,
    aktif: formData.get("aktif") === "on" || formData.get("aktif") === "true",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah" };
  }
  const idRaw = String(formData.get("id") ?? "").trim();
  if (idRaw) {
    await db
      .update(pegawai)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(pegawai.id, Number(idRaw)));
  } else {
    await db.insert(pegawai).values(parsed.data);
  }
  revalidatePegawai();
  return { ok: true };
}

export async function deletePegawai(id: number): Promise<{ ok: boolean }> {
  await requireKandunganAccess();
  await db.delete(pegawai).where(eq(pegawai.id, id));
  revalidatePegawai();
  return { ok: true };
}
