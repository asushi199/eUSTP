"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { analisisBreakdown, analisisMetrics, analisisModul } from "@/lib/schema";
import { getDelimaConfig } from "@/lib/analisis/queries";
import { captureDelimaSnapshot, deleteDelimaSnapshot } from "@/lib/analisis/delima-snapshot";
import { requireKandunganAccess } from "@/lib/rbac";
import { DELIMA_LIVE_DEFAULT_DAERAH } from "@/lib/analisis/delima-live";
import { parseBelumLoginCsv } from "@/lib/analisis/delima-belum-parse";
import { replaceDelimaBelumLogin } from "@/lib/analisis/delima-belum-store";

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

/* ---------- Snapshot DELIMa ---------- */

export async function simpanSnapshotDelima(): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const cfg = await getDelimaConfig();
  const r = await captureDelimaSnapshot(cfg.url, cfg.daerah);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath("/");
  revalidateAnalisis();
  return { ok: true };
}

/** Muat naik senarai guru belum log masuk DELIMa (CSV eksport DELIMa — hanya nama dipaparkan). */
export async function muatNaikBelumLoginDelima(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Sila pilih fail CSV" };
  }
  const tarikh = String(formData.get("tarikh") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tarikh)) return { ok: false, error: "Tarikh data tidak sah" };
  try {
    const cfg = await getDelimaConfig();
    const daerah = cfg.daerah ?? DELIMA_LIVE_DEFAULT_DAERAH;
    const rows = parseBelumLoginCsv(await file.text(), daerah);
    if (rows.length === 0) {
      return { ok: false, error: `Tiada guru PPD ${daerah} (belum log masuk) dalam fail ini` };
    }
    await replaceDelimaBelumLogin(rows, tarikh);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Fail tidak dapat dibaca" };
  }
  revalidateAnalisis();
  revalidatePath("/");
  return { ok: true };
}

export async function padamSnapshotDelima(id: number): Promise<{ ok: boolean }> {
  await requireKandunganAccess();
  await deleteDelimaSnapshot(id);
  revalidatePath("/");
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
