import { z } from "zod";
import { USTP_CLUSTERS, USTP_EQUIPMENT, USTP_PKGS, USTP_TERAS } from "./options";

const text = (label: string, max = 500) => z.string().trim()
  .min(1, `Sila isi ${label}.`).max(max, `${label} terlalu panjang (maksimum ${max} aksara).`);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarikh tidak sah.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Tarikh tidak sah.");
const count = z.string().regex(/^\d{1,7}$/, "Bilangan mesti nombor bulat antara 0 hingga 9999999.").transform(Number);
const money = z.string().regex(/^\d{1,7}(\.\d{1,2})?$/, "Amaun mesti antara RM0 hingga RM9999999.99, maksimum dua tempat perpuluhan.")
  .transform((value) => {
    const [whole, decimal = ""] = value.split(".");
    return Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  });

export const ustpReportSchema = z.object({
  pkgCode: z.string().refine((value) => USTP_PKGS.some((pkg) => pkg.code === value), "Sila pilih KOD PKG."),
  cluster: z.enum(USTP_CLUSTERS, { message: "Sila pilih kluster program/aktiviti." }),
  programName: text("nama program/aktiviti"),
  startDate: date,
  endDate: date,
  location: text("tempat"),
  organiser: text("penganjur"),
  schoolCount: count,
  teacherCount: count,
  studentCount: count,
  communityCount: count,
  teras: z.array(z.enum(USTP_TERAS)).max(6).transform((items) => [...new Set(items)]),
  objectives: text("objektif aktiviti", 20000),
  equipmentUsed: z.enum(["Ya", "Tidak"], { message: "Sila pilih penggunaan peralatan CoE." }),
  equipment: z.array(z.enum(USTP_EQUIPMENT)).max(19).transform((items) => [...new Set(items)]),
  os29000Sen: money,
  os42000Sen: money,
  os21000Sen: money,
  otherAllocation: z.string().trim().max(1000, "Keterangan peruntukan lain terlalu panjang."),
  otherSen: money,
  reflection: text("refleksi", 20000),
  preparedBy: text("nama penyedia", 200),
}).superRefine((data, context) => {
  if (data.endDate < data.startDate) context.addIssue({ code: "custom", path: ["endDate"], message: "Tarikh akhir tidak boleh mendahului tarikh mula." });
  if (data.equipmentUsed === "Ya" && data.equipment.length === 0) context.addIssue({ code: "custom", path: ["equipment"], message: "Sila pilih sekurang-kurangnya satu peralatan CoE." });
  if (data.otherSen > 0 && !data.otherAllocation) context.addIssue({ code: "custom", path: ["otherAllocation"], message: "Sila nyatakan peruntukan lain yang digunakan." });
}).transform((data) => ({ ...data, equipment: data.equipmentUsed === "Ya" ? data.equipment : [] }));

export type UstpReportData = z.output<typeof ustpReportSchema>;

export function parseUstpReport(form: FormData) {
  return ustpReportSchema.safeParse({
    ...Object.fromEntries(form),
    teras: form.getAll("teras"),
    equipment: form.getAll("equipment"),
  });
}

export function ustpTotalSen(data: Pick<UstpReportData, "os29000Sen" | "os42000Sen" | "os21000Sen" | "otherSen">) {
  return data.os29000Sen + data.os42000Sen + data.os21000Sen + data.otherSen;
}

export function ustpPhotoSubPath(startDate: string, id: string): string[] {
  return ["Laporan USTP", startDate.slice(0, 4), startDate.slice(0, 7), id];
}
