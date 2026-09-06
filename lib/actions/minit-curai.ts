"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { minitCurai } from "@/lib/schema";
import { parseMinitCurai } from "@/lib/minit-curai/validation";

type Result = { ok: true; id: string } | { ok: false; error: string };
const recordKey = z.object({ id: z.string().uuid(), version: z.coerce.number().int().min(0) });

export async function saveMinitCurai(form: FormData): Promise<Result> {
  const user = await requireUser();
  const key = recordKey.safeParse({ id: form.get("id"), version: form.get("version") });
  const parsed = parseMinitCurai(form);
  if (!key.success) return { ok: false, error: "Rujukan tidak sah. Sila buka semula borang." };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Sila semak borang." };
  const { id, version } = key.data;
  const [existing] = await db.select({ id: minitCurai.id, version: minitCurai.version }).from(minitCurai).where(eq(minitCurai.id, id)).limit(1);
  if ((version === 0 && existing) || (version > 0 && existing?.version !== version)) {
    return { ok: false, error: "Rekod telah disimpan, diubah atau dipadam. Sila buka semula minit sebelum meneruskan." };
  }

  const values = { ...parsed.data, kaedahLain: parsed.data.kaedah.includes("Lain-lain") ? parsed.data.kaedahLain : "", updatedAt: new Date() };
  let saved: Array<{ id: string }>;
  try {
    saved = version === 0
      ? await db.insert(minitCurai).values({ ...values, id, createdBy: Number(user.id) }).onConflictDoNothing().returning({ id: minitCurai.id })
      : await db.update(minitCurai).set({ ...values, version: version + 1 })
        .where(and(eq(minitCurai.id, id), eq(minitCurai.version, version))).returning({ id: minitCurai.id });
  } catch {
    return { ok: false, error: "Simpanan belum dapat disahkan. Semak senarai minit sebelum mencuba lagi." };
  }
  if (!saved.length) return { ok: false, error: "Rekod telah berubah. Sila buka semula minit untuk melihat versi terkini." };
  revalidatePath("/admin/minit-curai");
  revalidatePath(`/admin/minit-curai/${id}`);
  return { ok: true, id };
}

export async function deleteMinitCurai(id: string, version: number): Promise<Result> {
  await requireUser();
  if (!recordKey.safeParse({ id, version }).success || version < 1) return { ok: false, error: "Rujukan minit tidak sah." };
  const [removed] = await db.delete(minitCurai).where(and(eq(minitCurai.id, id), eq(minitCurai.version, version)))
    .returning({ id: minitCurai.id });
  if (!removed) return { ok: false, error: "Rekod telah berubah atau dipadam. Sila muat semula senarai." };
  revalidatePath("/admin/minit-curai");
  revalidatePath(`/admin/minit-curai/${id}`);
  return { ok: true, id };
}
