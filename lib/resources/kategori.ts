export type ResourcesKategori = {
  slug: string;
  title: string;
  blurb: string;
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

export function resourcesHref(slug: string): string {
  return `/resources/${slug}`;
}

export function resourcesAdminHref(slug?: string): string {
  return slug ? `/admin/resources?kategori=${slug}` : "/admin/resources";
}
