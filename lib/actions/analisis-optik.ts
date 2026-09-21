"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { analisisOptikSnapshots } from "@/lib/schema";
import { requireKandunganAccess } from "@/lib/rbac";
import { chartLabelFromDate, parseOptikUpload } from "@/lib/analisis/optik-parse";
import { getOptikSnapshotById } from "@/lib/analisis/optik-queries";
import {
  insertOptikSnapshot,
  syncOptikCurrentMetrics,
  upsertOptikMetric,
} from "@/lib/analisis/optik-store";

function revalidateOptik() {
  revalidatePath("/admin/analisis");
  revalidatePath("/analisis");
  revalidatePath("/analisis/ai-tools");
  revalidatePath("/analisis/ai-tools", "layout");
  revalidatePath("/");
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").replace(",", ".").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const ymdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarikh tidak sah");

export async function saveOptikKpi(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const year = String(formData.get("kpiYear") ?? "").trim();
  const value = numOrNull(formData.get("kpiValue"));
  const prevYear = String(formData.get("kpiPrevYear") ?? "").trim();
  const prevValue = numOrNull(formData.get("kpiPrevValue"));
  const displayRaw = String(formData.get("kpiDisplay") ?? "both").trim().toLowerCase();
  const display = displayRaw === "one" ? "one" : "both";
  if (!/^\d{4}$/.test(year) || value == null || value < 0 || value > 100) {
    return { ok: false, error: "Tahun atau sasaran KPI semasa tidak sah" };
  }
  if (prevYear && !/^\d{4}$/.test(prevYear)) {
    return { ok: false, error: "Tahun KPI terdahulu tidak sah" };
  }
  if (prevValue != null && (prevValue < 0 || prevValue > 100)) {
    return { ok: false, error: "Sasaran KPI terdahulu tidak sah" };
  }
  if ((prevYear && prevValue == null) || (!prevYear && prevValue != null)) {
    return { ok: false, error: "Isi kedua-dua tahun dan sasaran KPI terdahulu, atau kosongkan kedua-duanya." };
  }
  await upsertOptikMetric("kpi_year", year);
  await upsertOptikMetric("kpi_kebangsaan", String(value));
  await upsertOptikMetric("kpi_prev_year", prevYear);
  await upsertOptikMetric("kpi_prev_value", prevValue == null ? "" : String(prevValue));
  await upsertOptikMetric("kpi_display", display);
  revalidateOptik();
  return { ok: true };
}

export async function saveOptikTov(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const year = String(formData.get("tovYear") ?? "").trim();
  const value = numOrNull(formData.get("tovValue"));
  if (!/^\d{4}$/.test(year) || value == null || value > 100 || value < 0) {
    return { ok: false, error: "Tahun atau nilai TOV tidak sah" };
  }
  await upsertOptikMetric("tov_year", year);
  await upsertOptikMetric("tov", String(value));
  await upsertOptikMetric(`tov${year}`, String(value));
  revalidateOptik();
  return { ok: true };
}

export async function uploadOptikSnapshot(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireKandunganAccess();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Sila pilih fail CSV atau Excel" };
  }
  const captured = ymdSchema.safeParse(String(formData.get("capturedOn") ?? "").trim());
  if (!captured.success) return { ok: false, error: "Tarikh snapshot tidak sah" };
  const label =
    String(formData.get("chartLabel") ?? "").trim() || chartLabelFromDate(captured.data);
  try {
    const parsed = await parseOptikUpload(file);
    const userId = Number(user.id);
    await insertOptikSnapshot({
      parsed,
      capturedOn: captured.data,
      chartLabel: label,
      filename: file.name,
      userId: Number.isFinite(userId) ? userId : null,
      makeCurrent: true,
    });
    await syncOptikCurrentMetrics(captured.data, parsed);
    revalidateOptik();
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fail tidak dapat dibaca";
    return { ok: false, error: message };
  }
}

export async function restoreOptikSnapshot(
  id: number,
): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const row = await getOptikSnapshotById(id);
  if (!row) return { ok: false, error: "Snapshot tidak dijumpai" };
  await db.transaction(async (tx) => {
    await tx
      .update(analisisOptikSnapshots)
      .set({ isCurrent: false })
      .where(eq(analisisOptikSnapshots.isCurrent, true));
    await tx
      .update(analisisOptikSnapshots)
      .set({ isCurrent: true })
      .where(eq(analisisOptikSnapshots.id, id));
  });
  await syncOptikCurrentMetrics(String(row.capturedOn).slice(0, 10), {
    selesaiPct: row.selesaiPct,
    selesaiBil: row.selesaiBil,
    belumPct: row.belumPct,
    belumBil: row.belumBil,
  });
  revalidateOptik();
  return { ok: true };
}

export async function updateOptikSnapshotMeta(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { ok: false, error: "Snapshot tidak sah" };
  const chartLabel = String(formData.get("chartLabel") ?? "").trim();
  if (!chartLabel) return { ok: false, error: "Label carta diperlukan" };
  await db
    .update(analisisOptikSnapshots)
    .set({
      chartLabel,
      includeChart: formData.get("includeChart") === "on",
    })
    .where(eq(analisisOptikSnapshots.id, id));
  revalidateOptik();
  return { ok: true };
}

export async function deleteOptikSnapshot(
  id: number,
): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const row = await getOptikSnapshotById(id);
  if (!row) return { ok: false, error: "Snapshot tidak dijumpai" };
  if (row.isCurrent) {
    return { ok: false, error: "Jadikan snapshot lain sebagai semasa sebelum memadam" };
  }
  await db.delete(analisisOptikSnapshots).where(eq(analisisOptikSnapshots.id, id));
  revalidateOptik();
  return { ok: true };
}
