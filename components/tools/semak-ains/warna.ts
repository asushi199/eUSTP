/** Pengecualian reka bentuk terhad (spesifikasi §4.2): warna status pada titik/lencana sahaja. */
export const WARNA_STATUS = {
  hijau: { label: "Lulus", warna: "#16A34A" },
  kuning: { label: "Perlu semak", warna: "#CA8A04" },
  merah: { label: "Cadang tolak", warna: "#DC2626" },
} as const;
