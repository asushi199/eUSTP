import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { listSchoolOptions } from "@/lib/direktori/queries";
import { semakAinsLog } from "@/lib/schema";
import { normalTeks } from "@/lib/tools/semak-ains/normal";

/**
 * Log bilangan penggunaan Semak Rekod AINS (awam, tanpa log masuk).
 * Tiada data murid. Data ialah petunjuk sahaja (boleh dipalsukan).
 */
export const dynamic = "force-dynamic";

const nombor = z.number().int().min(0).max(100000);
const Skema = z.object({
  namaSekolah: z.string().trim().min(1).max(200),
  kodSekolah: z.string().trim().regex(/^[A-Z]{3}\d{4}$/).nullable(),
  jenis: z.enum(["semak", "lulus", "tolak"]),
  bilRekod: nombor,
  bilHijau: nombor.nullable(),
  bilKuning: nombor.nullable(),
  bilMerah: nombor.nullable(),
  bilBerjaya: nombor.nullable(),
  bilGagal: nombor.nullable(),
  tetapan: z.record(z.string().max(100), z.union([z.string().max(100), z.number(), z.boolean()])).nullable(),
  versiEnjin: z.string().max(20),
  versiPenanda: z.string().max(20),
});
// Had harian bagi sekolah padan (mengikut kod). Log tanpa kod sekolah berkongsi SATU baldi global,
// supaya nama rekaan yang bertukar-tukar tidak boleh mengelak had.
const HAD_SEHARI = 200;
const HAD_TANPA_KOD_SEHARI = 300;

export async function POST(request: Request) {
  const mentah = await request.text();
  if (mentah.length > 4096) return NextResponse.json({ ok: false }, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(mentah);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const p = Skema.safeParse(json);
  if (!p.success) return NextResponse.json({ ok: false }, { status: 400 });
  const d = p.data;

  try {
    const sekolah = await listSchoolOptions();
    const namaN = normalTeks(d.namaSekolah);
    const padan =
      (d.kodSekolah ? sekolah.find((s) => s.code === d.kodSekolah) : undefined) ??
      sekolah.find((s) => normalTeks(s.name) === namaN);
    const kod = padan?.code ?? null;

    const had = kod ? HAD_SEHARI : HAD_TANPA_KOD_SEHARI;
    const [kiraan] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(semakAinsLog)
      .where(
        and(
          kod ? eq(semakAinsLog.kodSekolah, kod) : isNull(semakAinsLog.kodSekolah),
          gte(semakAinsLog.diciptaPada, sql`now() - interval '1 day'`),
        ),
      );
    if ((kiraan?.n ?? 0) >= had) return NextResponse.json({ ok: false }, { status: 429 });

    await db.insert(semakAinsLog).values({
      kodSekolah: kod,
      namaSekolah: d.namaSekolah,
      jenis: d.jenis,
      bilRekod: d.bilRekod,
      bilHijau: d.bilHijau,
      bilKuning: d.bilKuning,
      bilMerah: d.bilMerah,
      bilBerjaya: d.bilBerjaya,
      bilGagal: d.bilGagal,
      tetapanDiubah: d.tetapan !== null && Object.keys(d.tetapan).length > 0,
      tetapan: d.tetapan,
      versiEnjin: d.versiEnjin,
      versiPenanda: d.versiPenanda,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
