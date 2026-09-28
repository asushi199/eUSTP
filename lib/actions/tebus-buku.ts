"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireKandunganAccess } from "@/lib/rbac";
import {
  parseManjungCsv,
  summarizeTebusBuku,
  TebusBukuCsvError,
  withSourcedAt,
  type TebusBukuImportSummary,
} from "@/lib/tebus-buku/csv";
import { replaceTebusBukuSnapshot } from "@/lib/tebus-buku/replace";

const MAX_FILE_BYTES = 9_000_000;

const ymdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export type TebusBukuUploadResult =
  | ({ ok: true; sourcedAt: string } & TebusBukuImportSummary)
  | { ok: false; error: string };

function validCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
}

function revalidateTebusBuku() {
  revalidatePath("/admin/tebus-buku");
  revalidatePath("/laporan/tebus-buku");
  revalidatePath("/laporan/tebus-buku/[kod]", "page");
  revalidatePath("/laporan");
}

export async function importTebusBukuCsv(formData: FormData): Promise<TebusBukuUploadResult> {
  await requireKandunganAccess();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Sila pilih fail CSV." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      error: "Fail terlalu besar. Pilih eksport CSV; hanya rekod PPD MANJUNG akan dihantar.",
    };
  }

  const sourcedAt = String(formData.get("sourcedAt") ?? "").trim();
  if (!ymdSchema.safeParse(sourcedAt).success || !validCalendarDate(sourcedAt)) {
    return { ok: false, error: "Tarikh data tidak sah." };
  }

  try {
    const drafts = parseManjungCsv(await file.text());
    if (drafts.length === 0) {
      return { ok: false, error: "Tiada rekod PPD MANJUNG dalam fail ini." };
    }
    const rows = withSourcedAt(drafts, sourcedAt);
    await db.transaction(async (tx) => {
      await replaceTebusBukuSnapshot(tx, rows);
    });
    revalidateTebusBuku();
    console.info(
      `tebus-buku import ${rows.length} pelajar ${sourcedAt}`,
    );
    return { ok: true, sourcedAt, ...summarizeTebusBuku(drafts) };
  } catch (error) {
    if (error instanceof TebusBukuCsvError) {
      return { ok: false, error: error.message };
    }
    console.error("tebus-buku import gagal", error);
    return { ok: false, error: "Import gagal. Data sedia ada tidak diubah." };
  }
}
