"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { analisisBreakdown, analisisMetrics, analisisModul, analisisMonthly } from "@/lib/schema";
import { requireKandunganAccess } from "@/lib/rbac";

const modulSchema = z.enum(analisisModul.enumValues);

function revalidateAnalisis() {
  revalidatePath("/admin/analisis");
  revalidatePath("/analisis");
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").replace(",", ".").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/* ---------- Metrik KV ---------- */

export async function saveMetric(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const modul = modulSchema.safeParse(formData.get("modul"));
  const key = String(formData.get("key") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  if (!modul.success || !key) return { ok: false, error: "Input tidak sah" };
  await db
    .insert(analisisMetrics)
    .values({ modul: modul.data, key, value })
    .onConflictDoUpdate({
      target: [analisisMetrics.modul, analisisMetrics.key],
      set: { value, updatedAt: sql`now()` },
    });
  revalidateAnalisis();
  return { ok: true };
}

export async function deleteMetric(id: number): Promise<{ ok: boolean }> {
  await requireKandunganAccess();
  await db.delete(analisisMetrics).where(eq(analisisMetrics.id, id));
  revalidateAnalisis();
  return { ok: true };
}

/* ---------- Siri bulanan ---------- */

export async function saveMonthly(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const modul = modulSchema.safeParse(formData.get("modul"));
  const monthLabel = String(formData.get("monthLabel") ?? "").trim();
  if (!modul.success || !monthLabel) return { ok: false, error: "Input tidak sah" };
  const values = {
    modul: modul.data,
    monthLabel,
    chartLabel: String(formData.get("chartLabel") ?? "").trim(),
    guruPct: numOrNull(formData.get("guruPct")),
    muridPct: numOrNull(formData.get("muridPct")),
    includeChart: formData.get("includeChart") === "on",
    sort: numOrNull(formData.get("sort")) ?? 0,
  };
  const idRaw = String(formData.get("id") ?? "").trim();
  if (idRaw) {
    await db.update(analisisMonthly).set(values).where(eq(analisisMonthly.id, Number(idRaw)));
  } else {
    await db.insert(analisisMonthly).values(values);
  }
  revalidateAnalisis();
  return { ok: true };
}

export async function deleteMonthly(id: number): Promise<{ ok: boolean }> {
  await requireKandunganAccess();
  await db.delete(analisisMonthly).where(eq(analisisMonthly.id, id));
  revalidateAnalisis();
  return { ok: true };
}

/* ---------- Pecahan kategori ---------- */

export async function saveBreakdown(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const modul = modulSchema.safeParse(formData.get("modul"));
  const kind = String(formData.get("kind") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const value = numOrNull(formData.get("value"));
  if (!modul.success || !kind || !label || value == null) {
    return { ok: false, error: "Input tidak sah" };
  }
  const values = {
    modul: modul.data,
    kind,
    label,
    value,
    sort: numOrNull(formData.get("sort")) ?? 0,
  };
  const idRaw = String(formData.get("id") ?? "").trim();
  if (idRaw) {
    await db.update(analisisBreakdown).set(values).where(eq(analisisBreakdown.id, Number(idRaw)));
  } else {
    await db.insert(analisisBreakdown).values(values);
  }
  revalidateAnalisis();
  return { ok: true };
}

export async function deleteBreakdown(id: number): Promise<{ ok: boolean }> {
  await requireKandunganAccess();
  await db.delete(analisisBreakdown).where(eq(analisisBreakdown.id, id));
  revalidateAnalisis();
  return { ok: true };
}
