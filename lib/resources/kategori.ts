export type ResourcesKategori = {
  slug: string;
  title: string;
  blurb: string;
};

/** Kategori yang NexaBot boleh muat naik terus ke Drive. */
export const RESOURCES_BOT_KATEGORI_SLUGS = ["surat-ustp", "surat-sekolah"] as const;
export type ResourcesBotKategoriSlug = (typeof RESOURCES_BOT_KATEGORI_SLUGS)[number];

export const RESOURCES_DRIVE_FOLDER: Record<string, string> = {
  "surat-ustp": "Surat-USTP",
  "surat-sekolah": "Surat-Sekolah",
  pekeliling: "Pekeliling",
  nota: "Nota",
};

/** Kategori awam CoE Resources — kad disimpan dalam `resources_cards`. */
export const RESOURCES_KATEGORI: ResourcesKategori[] = [
  {
    slug: "surat-ustp",
    title: "Surat Program untuk USTP",
    blurb: "Surat program rasmi yang dikeluarkan untuk staf dan unit USTP.",
  },
  {
    slug: "surat-sekolah",
    title: "Surat Program untuk Sekolah / Guru / Murid",
    blurb: "Surat program kepada sekolah, guru dan murid daerah Manjung.",
  },
  {
    slug: "pekeliling",
    title: "Pekeliling / Siaran STP",
    blurb: "Surat pekeliling, SPI dan surat punca kuasa Teknologi Pendidikan.",
  },
  {
    slug: "nota",
    title: "Nota / Modul / Panduan STP",
    blurb: "Nota, modul dan garis panduan rasmi Teknologi Pendidikan.",
  },
];

export function resourcesKategoriBySlug(slug: string): ResourcesKategori | undefined {
  return RESOURCES_KATEGORI.find((k) => k.slug === slug);
}

export function isResourcesBotKategori(slug: string): slug is ResourcesBotKategoriSlug {
  return (RESOURCES_BOT_KATEGORI_SLUGS as readonly string[]).includes(slug);
}

export function resourcesHref(slug: string): string {
  return `/resources/${slug}`;
}

export function resourcesAdminHref(slug?: string): string {
  return slug ? `/admin/resources?kategori=${slug}` : "/admin/resources";
}
