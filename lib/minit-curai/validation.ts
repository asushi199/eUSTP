import { z } from "zod";
import { MINIT_CURAI_KAEDAH } from "./options";

const text = (label: string, max = 500) => z.string().trim()
  .min(1, `Sila isi ${label}.`).max(max, `${label} terlalu panjang (maksimum ${max} aksara).`);
const optionalText = (label: string, max = 500) => z.string().trim()
  .max(max, `${label} terlalu panjang (maksimum ${max} aksara).`);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarikh tidak sah.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Tarikh tidak sah.");
const optionalDate = z.union([z.literal(""), date]).transform((value) => value || null);

const itemSchema = z.object({
  perkara: text("perkara / isu / makluman", 4000),
  keputusan: text("keputusan / penjelasan", 4000),
  tindakan: text("tindakan susulan", 4000),
  pegawai: text("pegawai / unit bertanggungjawab", 500),
});

export const minitCuraiStepASchema = z.object({
  reporterName: text("nama pegawai / pelapor", 200),
  reporterTitle: text("jawatan / gred", 200),
  unitSektor: text("unit / sektor", 200),
  tajuk: text("tajuk taklimat / mesyuarat / kursus / bengkel"),
  anjuran: text("anjuran"),
  meetingDate: date,
  meetingTime: text("masa", 120),
  tempat: text("tempat / platform"),
  chairperson: text("pengerusi / pegawai yang menyampaikan", 200),
  rujukanFail: optionalText("rujukan / no. fail", 200),
});

export const minitCuraiStepBSchema = z.object({
  items: z.array(itemSchema).min(1, "Sila isi sekurang-kurangnya satu perkara / isu.").max(30),
});

const minitCuraiStepCFields = z.object({
  rumusan: text("rumusan / cadangan pelapor", 20000),
  lampiran: optionalText("lampiran / bahan diterima", 4000),
  targetDate: optionalDate,
  disebarkanKepada: text("disebarkan kepada", 2000),
  tarikhCurai: date,
  kaedah: z.array(z.enum(MINIT_CURAI_KAEDAH)).min(1, "Sila pilih sekurang-kurangnya satu kaedah penyebaran.")
    .max(4).transform((items) => [...new Set(items)]),
  kaedahLain: optionalText("kaedah lain", 200),
  preparedByName: text("nama penyedia", 200),
  preparedByTitle: text("jawatan / unit penyedia", 200),
  preparedAt: date,
  reviewedByName: optionalText("nama penyemak", 200),
  reviewedByTitle: optionalText("jawatan / unit penyemak", 200),
  reviewedAt: optionalDate,
});

function refineStepC(
  data: z.output<typeof minitCuraiStepCFields>,
  context: z.RefinementCtx,
) {
  if (data.kaedah.includes("Lain-lain") && !data.kaedahLain) {
    context.addIssue({ code: "custom", path: ["kaedahLain"], message: "Sila nyatakan kaedah penyebaran lain." });
  }
  if (data.reviewedByName && !data.reviewedByTitle) {
    context.addIssue({ code: "custom", path: ["reviewedByTitle"], message: "Sila isi jawatan / unit penyemak." });
  }
  if (data.reviewedByTitle && !data.reviewedByName) {
    context.addIssue({ code: "custom", path: ["reviewedByName"], message: "Sila isi nama penyemak." });
  }
  if (data.reviewedAt && !data.reviewedByName) {
    context.addIssue({ code: "custom", path: ["reviewedByName"], message: "Sila isi nama penyemak." });
  }
}

export const minitCuraiStepCSchema = minitCuraiStepCFields.superRefine(refineStepC);

export const minitCuraiSchema = minitCuraiStepASchema
  .merge(minitCuraiStepBSchema)
  .merge(minitCuraiStepCFields)
  .superRefine(refineStepC);

export type MinitCuraiData = z.output<typeof minitCuraiSchema>;

function parseItems(form: FormData) {
  const raw = String(form.get("items") ?? "");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseMinitCurai(form: FormData) {
  return minitCuraiSchema.safeParse({
    ...Object.fromEntries(form),
    items: parseItems(form),
    kaedah: form.getAll("kaedah"),
  });
}

export function parseMinitCuraiStepA(form: FormData) {
  return minitCuraiStepASchema.safeParse(Object.fromEntries(form));
}

export function parseMinitCuraiStepB(items: unknown) {
  return minitCuraiStepBSchema.safeParse({ items });
}

export function parseMinitCuraiStepC(form: FormData) {
  return minitCuraiStepCSchema.safeParse({
    ...Object.fromEntries(form),
    kaedah: form.getAll("kaedah"),
  });
}
