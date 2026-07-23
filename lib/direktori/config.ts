export const DIRECTORY_ROLES = [
  "PGB",
  "PK_PENTADBIRAN",
  "PK_HEM",
  "PK_KOKURIKULUM",
  "PK_PPKI",
  "GPM",
  "GPICT",
  "DELIMA",
] as const;
export type DirectoryRole = (typeof DIRECTORY_ROLES)[number];

/** Keserasian nama lama untuk modul yang sudah menggunakan import ini. */
export const TEACHER_ROLES = DIRECTORY_ROLES;
export type TeacherRole = DirectoryRole;

/** Susunan paparan: pengurusan sekolah diikuti penyelaras sekolah. */
export const ROLE_ORDER: DirectoryRole[] = [...DIRECTORY_ROLES];

export type RoleGroup = {
  id: "pengurusan" | "penyelaras";
  title: string;
  description: string;
  roles: DirectoryRole[];
};

export const ROLE_GROUPS: RoleGroup[] = [
  {
    id: "pengurusan",
    title: "Pengurusan Sekolah",
    description: "Maklumat perhubungan pentadbir sekolah.",
    roles: ["PGB", "PK_PENTADBIRAN", "PK_HEM", "PK_KOKURIKULUM", "PK_PPKI"],
  },
  {
    id: "penyelaras",
    title: "Penyelaras Sekolah",
    description: "Maklumat perhubungan guru penyelaras sekolah.",
    roles: ["GPM", "GPICT", "DELIMA"],
  },
];

export const ROLE_INFO: Record<
  DirectoryRole,
  { short: string; label: string; slug: string; description: string }
> = {
  PGB: {
    short: "PGB",
    label: "Pengetua / Guru Besar",
    slug: "pgb",
    description: "Rujukan Pengetua atau Guru Besar sekolah.",
  },
  PK_PENTADBIRAN: {
    short: "PK Pentadbiran",
    label: "Penolong Kanan Pentadbiran",
    slug: "pk-pentadbiran",
    description: "Rujukan Penolong Kanan Pentadbiran sekolah.",
  },
  PK_HEM: {
    short: "PK HEM",
    label: "Penolong Kanan Hal Ehwal Murid",
    slug: "pk-hem",
    description: "Rujukan Penolong Kanan Hal Ehwal Murid sekolah.",
  },
  PK_KOKURIKULUM: {
    short: "PK Kokurikulum",
    label: "Penolong Kanan Kokurikulum",
    slug: "pk-kokurikulum",
    description: "Rujukan Penolong Kanan Kokurikulum sekolah.",
  },
  PK_PPKI: {
    short: "PK Pendidikan Khas",
    label: "Penolong Kanan Pendidikan Khas",
    slug: "pk-pendidikan-khas",
    description: "Rujukan Penolong Kanan Pendidikan Khas sekolah.",
  },
  GPM: {
    short: "GPM",
    label: "Guru Perpustakaan dan Media",
    slug: "gpm",
    description: "Rujukan guru perpustakaan, media dan pusat sumber sekolah.",
  },
  GPICT: {
    short: "GPICT",
    label: "Guru Penyelaras ICT",
    slug: "gpict",
    description: "Rujukan penyelaras ICT setiap sekolah.",
  },
  DELIMA: {
    short: "GP DELIMa",
    label: "Guru Penyelaras DELIMa",
    slug: "gpdelima",
    description: "Rujukan penyelaras DELIMa dan pembelajaran digital.",
  },
};

export function roleFromSlug(slug: string): DirectoryRole | null {
  const found = (Object.keys(ROLE_INFO) as DirectoryRole[]).find(
    (role) => ROLE_INFO[role].slug === slug,
  );
  return found ?? null;
}

/** Terima format biasa 01..., 60... atau +60...; selain mudah alih Malaysia dikosongkan. */
export function normalizeMalaysianMobile(value: string | null | undefined): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  const local = digits.startsWith("60") ? `0${digits.slice(2)}` : digits;
  return /^01\d{8,9}$/.test(local) ? `60${local.slice(1)}` : "";
}

export function displayMobile(value: string | null | undefined): string {
  const normalized = normalizeMalaysianMobile(value);
  return normalized ? `0${normalized.slice(2)}` : "";
}

export function normalizeSchoolCode(value: string | null | undefined): string {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function cleanSchoolDisplayName(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/**
 * Nama guru: seragamkan ke format "Huruf Besar Setiap Perkataan" tanpa mengira
 * cara input (huruf besar/kecil bercampur). Huruf besar selepas ruang, sempang,
 * garis miring, noktah dan '@' (cth. "ahmad a/l bakar" -> "Ahmad A/L Bakar";
 * "daud@che mud" -> "Daud@Che Mud").
 */
export function toTitleCaseName(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s\-/'.@])([a-zà-ÿ])/g, (_, sep, ch: string) => sep + ch.toUpperCase());
}

export function csvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
