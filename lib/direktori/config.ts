export const TEACHER_ROLES = ["GPICT", "DELIMA", "GPM"] as const;
export type TeacherRole = (typeof TEACHER_ROLES)[number];

/** Susunan paparan (ikut sistem asal GPMICT). */
export const ROLE_ORDER: TeacherRole[] = ["GPM", "GPICT", "DELIMA"];

export const ROLE_INFO: Record<
  TeacherRole,
  { short: string; label: string; slug: string; description: string }
> = {
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

export function roleFromSlug(slug: string): TeacherRole | null {
  const found = (Object.keys(ROLE_INFO) as TeacherRole[]).find(
    (role) => ROLE_INFO[role].slug === slug,
  );
  return found ?? null;
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

export function csvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
