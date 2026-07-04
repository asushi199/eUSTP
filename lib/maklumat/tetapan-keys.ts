/**
 * Senarai putih kunci tetapan — dipapar sebagai borang tetap dalam
 * /admin/tetapan (elak kunci salah taip merosakkan halaman awam).
 */
export const TETAPAN_KEYS: { key: string; label: string; hint?: string }[] = [
  { key: "carta_title", label: "Tajuk Carta Organisasi" },
  { key: "carta_blurb", label: "Keterangan Carta" },
  {
    key: "carta_image_url",
    label: "URL Imej Carta",
    hint: "Laluan public/ (cth. /maklumat/carta.png) atau pautan Drive",
  },
  { key: "pkg_title", label: "Tajuk Maklumat PKG" },
  { key: "pkg_blurb", label: "Keterangan PKG" },
  { key: "pkg_image_url", label: "URL Imej PKG", hint: "Laluan public/ atau pautan Drive" },
  { key: "takwim_title", label: "Tajuk Takwim" },
  {
    key: "takwim_embed_url",
    label: "URL Embed Takwim",
    hint: "URL embed Google Calendar penuh",
  },
];
