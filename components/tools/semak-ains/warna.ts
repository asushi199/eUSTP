/** Pengecualian reka bentuk terhad (spesifikasi §4.2): warna status pada titik/lencana sahaja. */
export const WARNA_STATUS = {
  hijau: { label: "Lulus", warna: "#16A34A", teks: "#15803D" },
  kuning: { label: "Perlu semak", warna: "#CA8A04", teks: "#A16207" },
  merah: { label: "Cadang tolak", warna: "#DC2626", teks: "#B91C1C" },
} as const;
