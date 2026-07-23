"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminActions, contactRoles, contactVersions, schools } from "@/lib/schema";
import { requireKandunganAccess } from "@/lib/rbac";
import {
  TEACHER_ROLES,
  cleanSchoolDisplayName,
  displayMobile,
  normalizeMalaysianMobile,
  normalizeSchoolCode,
  toTitleCaseName,
} from "@/lib/direktori/config";

const roleSchema = z.object({
  teacherName: z.string().trim().max(200).default(""),
  phone: z.string().trim().max(30).default(""),
});

const submissionSchema = z.object({
  schoolCode: z.string().min(1, "Sila pilih sekolah"),
  submitterName: z.string().trim().max(200).default(""),
  submitterPhone: z.string().trim().max(30).default(""),
  roles: z.object({
    PGB: roleSchema,
    PK_PENTADBIRAN: roleSchema,
    PK_HEM: roleSchema,
    PK_KOKURIKULUM: roleSchema,
    PK_PPKI: roleSchema,
    GPICT: roleSchema,
    DELIMA: roleSchema,
    GPM: roleSchema,
  }),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;

/** Hantaran awam: cipta versi baharu dan jadikan versi semasa (tiada log masuk). */
export async function createDirektoriSubmission(
  input: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah" };
  }
  const data = parsed.data;
  const code = normalizeSchoolCode(data.schoolCode);

  const school = await db.query.schools.findFirst({ where: eq(schools.code, code) });
  if (!school) return { ok: false, error: "Sekolah tidak dijumpai dalam senarai." };

  const hasAnyContact = TEACHER_ROLES.some(
    (r) => data.roles[r].teacherName || data.roles[r].phone,
  );
  if (!hasAnyContact) {
    return { ok: false, error: "Sila isi sekurang-kurangnya satu peranan." };
  }

  await db.transaction(async (tx) => {
    const [version] = await tx
      .insert(contactVersions)
      .values({
        schoolCode: school.code,
        schoolName: school.name,
        zone: school.zone,
        submitterName: data.submitterName || null,
        submitterPhone: data.submitterPhone || null,
        source: "public_form",
      })
      .returning({ id: contactVersions.id });

    await tx.insert(contactRoles).values(
      TEACHER_ROLES.map((role) => {
        const normalized = normalizeMalaysianMobile(data.roles[role].phone);
        return {
          versionId: version.id,
          role,
          teacherName: toTitleCaseName(data.roles[role].teacherName),
          phone: displayMobile(normalized),
          phoneNormalized: normalized,
        };
      }),
    );

    await tx
      .update(schools)
      .set({ currentVersionId: version.id, updatedAt: new Date() })
      .where(eq(schools.code, school.code));
  });

  revalidatePath("/direktori");
  return { ok: true };
}

/** Admin: pulihkan versi lama sebagai versi semasa. */
export async function restoreVersion(
  versionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireKandunganAccess();

  const version = await db.query.contactVersions.findFirst({
    where: eq(contactVersions.id, versionId),
  });
  if (!version) return { ok: false, error: "Versi tidak dijumpai." };

  await db.transaction(async (tx) => {
    await tx
      .update(schools)
      .set({
        name: version.schoolName,
        zone: version.zone,
        currentVersionId: version.id,
        updatedAt: new Date(),
      })
      .where(eq(schools.code, version.schoolCode));

    await tx.insert(adminActions).values({
      action: "restore_version",
      schoolCode: version.schoolCode,
      versionId: version.id,
      actorUserId: Number(user.id),
    });
  });

  revalidatePath("/admin/direktori");
  revalidatePath(`/admin/direktori/sekolah/${version.schoolCode}`);
  revalidatePath("/direktori");
  return { ok: true };
}

/** Admin: kemas kini nama paparan sekolah (turut mengemaskini semua versi). */
export async function updateSchoolName(
  schoolCode: string,
  nextName: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireKandunganAccess();
  const code = normalizeSchoolCode(schoolCode);
  const name = cleanSchoolDisplayName(nextName);
  if (!code || !name) return { ok: false, error: "Kod dan nama sekolah diperlukan." };

  await db.transaction(async (tx) => {
    await tx
      .update(schools)
      .set({ name, updatedAt: new Date() })
      .where(eq(schools.code, code));
    await tx
      .update(contactVersions)
      .set({ schoolName: name })
      .where(eq(contactVersions.schoolCode, code));
    await tx.insert(adminActions).values({
      action: "update_school_name",
      schoolCode: code,
      actorUserId: Number(user.id),
    });
  });

  revalidatePath("/admin/direktori");
  revalidatePath(`/admin/direktori/sekolah/${code}`);
  revalidatePath("/direktori");
  return { ok: true };
}

/** Admin: kemas kini laman web rasmi sekolah. */
export async function updateSchoolWebsite(
  schoolCode: string,
  nextWebsite: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireKandunganAccess();
  const code = normalizeSchoolCode(schoolCode);
  const website = nextWebsite.trim();
  if (!code) return { ok: false, error: "Kod sekolah diperlukan." };
  if (website && !/^https?:\/\//i.test(website)) {
    return { ok: false, error: "URL mesti bermula dengan http:// atau https://" };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(schools)
      .set({ website, updatedAt: new Date() })
      .where(eq(schools.code, code));
    await tx.insert(adminActions).values({
      action: "update_school_website",
      schoolCode: code,
      actorUserId: Number(user.id),
    });
  });

  revalidatePath("/admin/direktori");
  revalidatePath(`/admin/direktori/sekolah/${code}`);
  revalidatePath("/direktori");
  return { ok: true };
}

/** Admin: tambah sekolah baharu ke jadual induk. */
export async function createSchool(input: {
  code: string;
  name: string;
  zone: string;
}): Promise<{ ok: boolean; error?: string }> {
  await requireKandunganAccess();
  const code = normalizeSchoolCode(input.code);
  const name = cleanSchoolDisplayName(input.name);
  const zone = input.zone.trim();
  if (!code || !name) return { ok: false, error: "Kod dan nama sekolah diperlukan." };

  const existing = await db.query.schools.findFirst({ where: eq(schools.code, code) });
  if (existing) return { ok: false, error: `Sekolah ${code} sudah wujud.` };

  await db.insert(schools).values({ code, name, zone });
  revalidatePath("/admin/direktori");
  return { ok: true };
}
