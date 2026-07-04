import type { kandunganTopik } from "@/lib/schema";

export type Topik = (typeof kandunganTopik.enumValues)[number];

export type TopikMeta = {
  slug: string;
  topik: Topik;
  title: string;
  blurb: string;
};

/** Peta slug URL ↔ enum topik + tajuk rasmi (ikut dashboard asal). */
export const TOPIK_META: TopikMeta[] = [
  {
    slug: "integrasi",
    topik: "integrasi",
    title: "Integrasi Teknologi Pendidikan",
    blurb: "Kertas kerja, laporan dan bahan program integrasi teknologi (JNJ, Minecraft, Mikrobotik).",
  },
  {
    slug: "hebahan",
    topik: "hebahan",
    title: "Hebahan Pendidikan Digital",
    blurb: "Hebahan pendidikan digital melalui peralatan COE kepada komuniti sekolah.",
  },
  {
    slug: "itm",
    topik: "itm",
    title: "Inisiatif Teknologi Maklumat",
    blurb: "Inisiatif teknologi maklumat daerah — Google Classroom, laman web sekolah dan lain-lain.",
  },
  {
    slug: "pembudayaan-membaca",
    topik: "pembudayaan",
    title: "Pembudayaan Amalan Membaca",
    blurb: "Program dan bahan pembudayaan amalan membaca sekolah daerah Manjung.",
  },
  {
    slug: "pemerkasaan",
    topik: "pemerkasaan",
    title: "Program Pemerkasaan Bacaan Murid",
    blurb: "Bicara Buku, Pembaca Bestari dan program pemerkasaan bacaan murid.",
  },
  {
    slug: "bahan-sokongan",
    topik: "bahan_sokongan",
    title: "Bahan Sokongan",
    blurb: "Buku pengurusan USTP, garis panduan dan bahan sokongan rasmi.",
  },
];

export function topikBySlug(slug: string): TopikMeta | undefined {
  return TOPIK_META.find((t) => t.slug === slug);
}
