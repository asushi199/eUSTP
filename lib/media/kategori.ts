export type MediaKategori = {
  slug: string;
  title: string;
  blurb: string;
};

export const MEDIA_DRIVE_FOLDER: Record<string, string> = {
  koleksi: "Koleksi",
};

/** Kategori awam CoE Media — kad disimpan dalam `media_cards`. */
export const MEDIA_KATEGORI: MediaKategori[] = [
  {
    slug: "koleksi",
    title: "Koleksi Video / Gambar Program",
    blurb: "Video program, siaran dan gambar aktiviti USTP — dikelaskan mengikut bulan.",
  },
];

export const MEDIA_SOCIAL_LINKS = [
  {
    label: "TikTok USTP",
    href: "https://www.tiktok.com/@ustpmanjung1",
  },
  {
    label: "Facebook USTP",
    href: "https://www.facebook.com/p/Ustp-Ppd-Manjung-61557576780622/",
  },
  {
    label: "YouTube USTP",
    href: "https://www.youtube.com/channel/UC00YHEDSN_X5xVGqV9b4rmw",
  },
] as const;

export const MEDIA_PLANNED_ITEMS = [
  "Senarai TVPSS Sekolah",
  "Senarai Laman Sesawang / Dashboard Sekolah",
] as const;

export function mediaKategoriBySlug(slug: string): MediaKategori | undefined {
  return MEDIA_KATEGORI.find((k) => k.slug === slug);
}

export function mediaHref(slug: string): string {
  return `/media/${slug}`;
}

export function mediaAdminHref(slug?: string): string {
  return slug ? `/admin/media?kategori=${slug}` : "/admin/media";
}
