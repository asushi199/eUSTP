import "server-only";

import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactRoles, contactVersions, schools } from "@/lib/schema";
import { ROLE_ORDER, type TeacherRole } from "./config";

export type RoleContact = { role: TeacherRole; teacherName: string; phone: string };

export type PublicDirectoryRow = {
  schoolCode: string;
  schoolName: string;
  zone: string;
  website: string;
  role: TeacherRole;
  teacherName: string;
  phone: string;
};

export type SchoolOption = { code: string; name: string; zone: string };

export type AdminSchoolRecord = {
  schoolCode: string;
  schoolName: string;
  zone: string;
  currentVersionId: string | null;
  submittedAt: Date | null;
  submitterName: string | null;
  submitterPhone: string | null;
  roles: RoleContact[];
};

export type VersionRecord = {
  id: string;
  schoolName: string;
  zone: string;
  submittedAt: Date;
  submitterName: string | null;
  submitterPhone: string | null;
  source: string | null;
  isCurrent: boolean;
  roles: RoleContact[];
};

function sortRoles(roles: RoleContact[]): RoleContact[] {
  return [...roles].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
}

/** Direktori awam: peranan daripada versi semasa setiap sekolah. */
export async function listPublicDirectory(role?: TeacherRole): Promise<PublicDirectoryRow[]> {
  const rows = await db
    .select({
      schoolCode: schools.code,
      schoolName: schools.name,
      zone: schools.zone,
      website: schools.website,
      role: contactRoles.role,
      teacherName: contactRoles.teacherName,
      phone: contactRoles.phone,
    })
    .from(schools)
    .innerJoin(contactVersions, eq(schools.currentVersionId, contactVersions.id))
    .innerJoin(contactRoles, eq(contactRoles.versionId, contactVersions.id))
    .orderBy(schools.name);

  const filtered = role ? rows.filter((r) => r.role === role) : rows;
  return filtered as PublicDirectoryRow[];
}

export async function listSchoolOptions(): Promise<SchoolOption[]> {
  const rows = await db
    .select({ code: schools.code, name: schools.name, zone: schools.zone })
    .from(schools)
    .orderBy(schools.code);
  return rows;
}

async function rolesByVersionIds(ids: string[]): Promise<Map<string, RoleContact[]>> {
  const map = new Map<string, RoleContact[]>();
  if (ids.length === 0) return map;
  const rows = await db
    .select()
    .from(contactRoles)
    .where(inArray(contactRoles.versionId, ids));
  for (const r of rows) {
    const list = map.get(r.versionId) ?? [];
    list.push({ role: r.role, teacherName: r.teacherName, phone: r.phone });
    map.set(r.versionId, list);
  }
  for (const [k, v] of map) map.set(k, sortRoles(v));
  return map;
}

/** Senarai sekolah untuk admin (dengan maklumat versi semasa). */
export async function listAdminSchools(): Promise<AdminSchoolRecord[]> {
  const rows = await db
    .select({
      schoolCode: schools.code,
      schoolName: schools.name,
      zone: schools.zone,
      currentVersionId: schools.currentVersionId,
      submittedAt: contactVersions.submittedAt,
      submitterName: contactVersions.submitterName,
      submitterPhone: contactVersions.submitterPhone,
    })
    .from(schools)
    .leftJoin(contactVersions, eq(schools.currentVersionId, contactVersions.id))
    .orderBy(schools.code);

  const roleMap = await rolesByVersionIds(
    rows.map((r) => r.currentVersionId).filter((v): v is string => v != null),
  );

  return rows.map((r) => ({
    ...r,
    roles: r.currentVersionId ? (roleMap.get(r.currentVersionId) ?? []) : [],
  }));
}

/** Sejarah versi satu sekolah. */
export async function getSchoolHistory(schoolCode: string): Promise<{
  school: {
    code: string;
    name: string;
    zone: string;
    website: string;
    currentVersionId: string | null;
  } | null;
  versions: VersionRecord[];
}> {
  const school = await db.query.schools.findFirst({ where: eq(schools.code, schoolCode) });
  if (!school) return { school: null, versions: [] };

  const versions = await db
    .select()
    .from(contactVersions)
    .where(eq(contactVersions.schoolCode, schoolCode))
    .orderBy(desc(contactVersions.submittedAt));

  const roleMap = await rolesByVersionIds(versions.map((v) => v.id));

  return {
    school: {
      code: school.code,
      name: school.name,
      zone: school.zone,
      website: school.website,
      currentVersionId: school.currentVersionId,
    },
    versions: versions.map((v) => ({
      id: v.id,
      schoolName: v.schoolName,
      zone: v.zone,
      submittedAt: v.submittedAt,
      submitterName: v.submitterName,
      submitterPhone: v.submitterPhone,
      source: v.source,
      isCurrent: v.id === school.currentVersionId,
      roles: roleMap.get(v.id) ?? [],
    })),
  };
}
