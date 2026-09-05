"use server";

import { z } from "zod";
import { requireUser } from "@/lib/rbac";
import { generateGeminiText } from "@/lib/ai/gemini";
import { USTP_TERAS_INFO } from "@/lib/laporan-ustp/options";

export type JanaResult = { ok: true; text: string } | { ok: false; error: string };

const num = z.coerce.number().int().min(0).max(9999999).optional().default(0);

const inputSchema = z.object({
  field: z.enum(["objektif", "refleksi"]),
  programName: z.string().trim().min(1).max(500),
  cluster: z.string().trim().max(500).optional().default(""),
  teras: z.array(z.string().max(40)).max(6).optional().default([]),
  schoolCount: num,
  teacherCount: num,
  studentCount: num,
  communityCount: num,
  location: z.string().trim().max(500).optional().default(""),
  organiser: z.string().trim().max(500).optional().default(""),
  dapatan: z.string().trim().max(4000).optional().default(""),
});

const SYSTEM =
  "Anda pegawai USTP (Unit Sumber Teknologi Pendidikan) PPD Manjung yang menulis laporan program pendidikan digital untuk KPM. Tulis dalam Bahasa Melayu rasmi, padat dan profesional. Hasilkan teks sahaja — tanpa markdown, tanpa tajuk, tanpa nota atau ayat pembuka/penutup tambahan.";

function contextBlock(inp: z.infer<typeof inputSchema>): string {
  const terasLines = inp.teras
    .filter((t) => t in USTP_TERAS_INFO)
    .map((t) => {
      const info = USTP_TERAS_INFO[t as keyof typeof USTP_TERAS_INFO];
      return `- ${t} — ${info.tajuk}: ${info.huraian}`;
    });
  const teras = terasLines.length ? terasLines.join("\n") : "(Tiada teras dipilih)";
  return [
    `Nama program: ${inp.programName}`,
    inp.cluster ? `Kluster: ${inp.cluster}` : null,
    inp.location ? `Tempat: ${inp.location}` : null,
    inp.organiser ? `Penganjur: ${inp.organiser}` : null,
    `Penyertaan — sekolah: ${inp.schoolCount}, pegawai/guru: ${inp.teacherCount}, murid: ${inp.studentCount}, komuniti: ${inp.communityCount}`,
    `Teras DPD yang berkaitan:\n${teras}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function janaTeksLaporan(raw: unknown): Promise<JanaResult> {
  await requireUser();
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Sila isi sekurang-kurangnya Nama program dahulu." };
  }
  const inp = parsed.data;
  const ctx = contextBlock(inp);

  let prompt: string;
  let maxOutputTokens: number;
  if (inp.field === "objektif") {
    maxOutputTokens = 800;
    prompt = `Berdasarkan maklumat program di bawah, hasilkan 3 hingga 5 objektif aktiviti yang jelas dan boleh diukur, selaras dengan teras DPD yang dipilih.\n\nFormat jawapan (WAJIB):\n- Bentuk point form: setiap objektif pada baris berasingan dan bermula dengan tanda "• ".\n- Setiap objektif bermula dengan kata kerja.\n- JANGAN tulis sebarang tajuk atau perkataan "Objektif"; terus senaraikan objektif sahaja.\n\n${ctx}`;
  } else {
    maxOutputTokens = 1200;
    if (inp.dapatan) {
      prompt = `Berdasarkan maklumat program dan dapatan/pendapat penyedia laporan di bawah, hasilkan bahagian REFLEKSI selepas program: 1 hingga 2 perenggan meliputi pencapaian/impak, cabaran ringkas dan cadangan penambahbaikan. Kekalkan fakta yang diberikan dan jangan reka data.\n\n${ctx}\n\nDapatan/pendapat penyedia:\n${inp.dapatan}`;
    } else {
      prompt = `Berdasarkan maklumat program di bawah, hasilkan bahagian REFLEKSI selepas program yang munasabah dan umum (tiada dapatan khusus diberikan): 1 hingga 2 perenggan meliputi pencapaian/impak yang dijangka, cabaran biasa dan cadangan penambahbaikan. Elakkan angka atau nama khusus yang tidak diberikan.\n\n${ctx}`;
    }
  }

  return generateGeminiText(prompt, { system: SYSTEM, maxOutputTokens });
}
