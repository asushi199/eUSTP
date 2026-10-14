"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, withDbTimeout } from "@/lib/db";
import { mjkdKehadiran, mjkdMesyuarat, pegawaiPpd } from "@/lib/schema";
import { requireKandunganAccess } from "@/lib/rbac";
import { jawatanPgb } from "@/lib/mjkd/jawatan-pgb";
import { kenalJenisSekolah } from "@/lib/mjkd/jenis-sekolah";
import {
  type KiraanKehadiran,
  CARIAN_PEGAWAI_MIN,
  ORGANISASI_PPD,
  sahkanTeksKehadiran,
} from "@/lib/mjkd/kehadiran";
import { hariIniKl } from "@/lib/mjkd/enums";
import { isTarikhIso } from "@/lib/mjkd/hari";
import { kiraanKehadiranHari } from "@/lib/mjkd/pembentangan";
import { namaKunci } from "@/lib/mjkd/nama-kunci";
import { MESEJ_DB_PERLAHAN, isRalatTimeoutDb } from "@/lib/mjkd/ralat-db";
import {
  cariPegawaiPpdAktif,
  getKehadiranByKunci,
  getMesyuarat,
  getMesyuaratKehadiranDibuka,
  getNamaPgb,
  getNamaPkWakil,
  getPegawaiPpd,
  getSchoolByCode,
  listKehadiran,
  listPegawaiPpdAdmin,
  listSekolahSemua,
} from "@/lib/mjkd/queries";

const JAWATAN_PK = {
  PK_PENTADBIRAN: "Penolong Kanan Pentadbiran",
  PK_HEM: "Penolong Kanan HEM",
  PK_KOKURIKULUM: "Penolong Kanan Kokurikulum",
} as const;

export type KehadiranActionResult = { ok: boolean; error?: string; id?: string };

export type RekodKehadiranAwam = {
  nama: string;
  jawatan: string;
  organisasi: string;
  jenis: string;
  /** ISO 8601 */
  masa: string;
  /** Tarikh kehadiran (YYYY-MM-DD, waktu KL). */
  tarikh: string;
};

export type KehadiranResult = {
  ok: boolean;
  error?: string;
  /** Sudah direkodkan sebelum ini — bukan ralat. */
  duplikat?: boolean;
  rekod?: RekodKehadiranAwam;
};

function textField(value: FormDataEntryValue | null, max = 2000): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function revalidateKehadiran(mesyuaratId?: string) {
  revalidatePath("/laporan-mjkd/hadir");
  if (mesyuaratId) revalidatePath(`/admin/mjkd/${mesyuaratId}`);
}

function keRekodAwam(r: typeof mjkdKehadiran.$inferSelect): RekodKehadiranAwam {
  return {
    nama: r.nama,
    jawatan: r.jawatan,
    organisasi: r.organisasi,
    jenis: r.jenis,
    masa: r.createdAt.toISOString(),
    tarikh: r.tarikh,
  };
}

type DataKehadiran = {
  mesyuaratId: string;
  /** Lalai: hari ini (waktu KL). */
  tarikh?: string;
  jenis: "PGB" | "WAKIL" | "PEGAWAI" | "LAIN";
  nama: string;
  jawatan: string;
  organisasi: string;
  schoolCode: string | null;
  pegawaiPpdId: number | null;
};

/** Masukkan rekod; jika indeks unik (mesyuarat, nama, organisasi) dilanggar, pulangkan rekod sedia ada. */
async function simpanKehadiran(d: DataKehadiran): Promise<KehadiranResult> {
  const kunci = namaKunci(d.nama);
  const tarikh = d.tarikh ?? hariIniKl();
  const [baru] = await db
    .insert(mjkdKehadiran)
    .values({
      mesyuaratId: d.mesyuaratId,
      tarikh,
      jenis: d.jenis,
      nama: d.nama,
      namaKunci: kunci,
      jawatan: d.jawatan,
      organisasi: d.organisasi,
      schoolCode: d.schoolCode,
      pegawaiPpdId: d.pegawaiPpdId,
    })
    .onConflictDoNothing()
    .returning();
  if (baru) {
    revalidateKehadiran(d.mesyuaratId);
    return { ok: true, rekod: keRekodAwam(baru) };
  }
  const sedia = await getKehadiranByKunci(d.mesyuaratId, tarikh, kunci, d.organisasi);
  if (!sedia) return { ok: false, error: "Gagal merekodkan kehadiran. Sila cuba lagi." };
  return { ok: true, duplikat: true, rekod: keRekodAwam(sedia) };
}

async function mesyuaratKehadiranDibuka(mesyuaratId: string) {
  const mesyuarat = await getMesyuarat(String(mesyuaratId ?? ""));
  if (!mesyuarat) return { ok: false as const, error: "Mesyuarat tidak dijumpai." };
  if (!mesyuarat.kehadiranDibuka) {
    return { ok: false as const, error: "Kehadiran belum dibuka." };
  }
  return { ok: true as const, mesyuarat };
}

/* ============================ Awam ============================ */

export type KehadiranSekolahInfo = {
  ok: boolean;
  error?: string;
  sekolah?: { code: string; name: string };
  /** Nama dan jawatan PGB daripada direktori (nama kosong jika belum diisi). */
  pgb?: { nama: string; jawatan: string };
  /** PK Pentadbiran / HEM / Kokurikulum daripada direktori (isi pantas wakil) — nama sahaja. */
  wakilPilihan?: { nama: string; jawatan: string }[];
  sudahHadir?: RekodKehadiranAwam;
};

/** Awam: maklumat sekolah untuk skrin kehadiran (nama + jawatan sahaja — tiada telefon). */
export async function getKehadiranSekolahMjkd(
  mesyuaratId: string,
  schoolCode: string,
): Promise<KehadiranSekolahInfo> {
  try {
    return await withDbTimeout(muatInfoSekolah(mesyuaratId, schoolCode));
  } catch (e) {
    return {
      ok: false,
      error: isRalatTimeoutDb(e) ? MESEJ_DB_PERLAHAN : "Gagal memuat maklumat sekolah.",
    };
  }
}

/** Pertanyaan berurutan (bukan Promise.all) — kolam serverless hanya ~3 sambungan. */
async function muatInfoSekolah(
  mesyuaratId: string,
  schoolCode: string,
): Promise<KehadiranSekolahInfo> {
  const buka = await mesyuaratKehadiranDibuka(mesyuaratId);
  if (!buka.ok) return { ok: false, error: buka.error };
  const kod = String(schoolCode ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 20);
  const school = kod ? await getSchoolByCode(kod) : null;
  if (!school) return { ok: false, error: "Kod sekolah tidak dijumpai." };

  const nama = await getNamaPgb(school.code);
  const pk = await getNamaPkWakil(school.code);
  const jawatan = jawatanPgb(kenalJenisSekolah(school.name, school.code), school.name);
  const sudah = nama
    ? await getKehadiranByKunci(buka.mesyuarat.id, hariIniKl(), namaKunci(nama), school.name)
    : null;
  return {
    ok: true,
    sekolah: { code: school.code, name: school.name },
    pgb: { nama, jawatan },
    wakilPilihan: pk.map((p) => ({ nama: p.nama, jawatan: JAWATAN_PK[p.role] })),
    sudahHadir: sudah ? keRekodAwam(sudah) : undefined,
  };
}

/** Awam: carian pegawai PPD aktif — pelayan sahaja, min 2 aksara, maks 10 hasil. */
export async function cariPegawaiMjkd(
  q: string,
): Promise<{ id: number; nama: string; jawatan: string }[]> {
  const kata = String(q ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 100);
  if (kata.length < CARIAN_PEGAWAI_MIN) return [];
  try {
    return await withDbTimeout(
      (async () => {
        // Senarai pegawai hanya boleh dicari semasa kehadiran mana-mana mesyuarat dibuka.
        if (!(await getMesyuaratKehadiranDibuka())) return [];
        return cariPegawaiPpdAktif(kata);
      })(),
    );
  } catch {
    // Carian hanyalah bantuan — jika DB perlahan, pengguna boleh cuba semula / "Tiada dalam senarai".
    return [];
  }
}

const kehadiranPayloadSchema = z.object({
  mesyuaratId: z.string().min(1).max(64),
  // Awam: tiada "LAIN" (dibuang 2026-10-14 — elak wakil sekolah tersalah tab). Admin masih boleh.
  jenis: z.enum(["PGB", "WAKIL", "PEGAWAI"]),
  schoolCode: z.string().max(20).optional(),
  pegawaiId: z.number().int().optional(),
  nama: z.string().max(400).optional(),
  jawatan: z.string().max(400).optional(),
  organisasi: z.string().max(400).optional(),
});

export type KehadiranPayload = z.infer<typeof kehadiranPayloadSchema>;

/**
 * Awam: sahkan kehadiran. Ditolak jika kehadiran mesyuarat tidak dibuka. Nama/jawatan PGB dan
 * pegawai PPD diambil di pelayan (bukan percaya klien); rekod berganda = mesej mesra, bukan ralat.
 */
export async function sahkanKehadiranMjkd(payload: KehadiranPayload): Promise<KehadiranResult> {
  const parsed = kehadiranPayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };
  const p = parsed.data;

  // Rekod berulang selamat (indeks unik per hari + laluan pendua mesra), jadi timeout = cuba semula.
  try {
    return await withDbTimeout(prosesKehadiran(p));
  } catch (e) {
    if (isRalatTimeoutDb(e)) return { ok: false, error: MESEJ_DB_PERLAHAN };
    return { ok: false, error: e instanceof Error ? e.message : "Gagal merekodkan kehadiran." };
  }
}

async function prosesKehadiran(p: KehadiranPayload): Promise<KehadiranResult> {
  const buka = await mesyuaratKehadiranDibuka(p.mesyuaratId);
  if (!buka.ok) return { ok: false, error: buka.error };
  const mesyuaratId = buka.mesyuarat.id;

  {
    if (p.jenis === "PGB" || p.jenis === "WAKIL") {
      const kod = (p.schoolCode ?? "").trim().toUpperCase();
      const school = kod ? await getSchoolByCode(kod) : null;
      if (!school) return { ok: false, error: "Sila pilih sekolah." };

      if (p.jenis === "PGB") {
        const namaDirektori = await getNamaPgb(school.code);
        const sah = sahkanTeksKehadiran(
          {
            nama: namaDirektori || p.nama || "",
            jawatan: jawatanPgb(kenalJenisSekolah(school.name, school.code), school.name),
          },
          { perluOrganisasi: false },
        );
        if (!sah.ok) return { ok: false, error: sah.error };
        return await simpanKehadiran({
          mesyuaratId,
          jenis: "PGB",
          nama: sah.nama,
          jawatan: sah.jawatan,
          organisasi: school.name,
          schoolCode: school.code,
          pegawaiPpdId: null,
        });
      }

      const sah = sahkanTeksKehadiran(
        { nama: p.nama ?? "", jawatan: p.jawatan ?? "" },
        { perluOrganisasi: false },
      );
      if (!sah.ok) return { ok: false, error: sah.error };
      return await simpanKehadiran({
        mesyuaratId,
        jenis: "WAKIL",
        nama: sah.nama,
        jawatan: sah.jawatan,
        organisasi: school.name,
        schoolCode: school.code,
        pegawaiPpdId: null,
      });
    }

    // PEGAWAI: daripada senarai (nama/jawatan dari DB) atau "Tiada dalam senarai" (isi sendiri);
    // kedua-duanya organisasi PPD Manjung.
    if (p.pegawaiId) {
      const pegawai = await getPegawaiPpd(p.pegawaiId);
      if (!pegawai || !pegawai.aktif) return { ok: false, error: "Pegawai tidak dijumpai." };
      return await simpanKehadiran({
        mesyuaratId,
        jenis: "PEGAWAI",
        nama: pegawai.nama,
        jawatan: pegawai.jawatan,
        organisasi: ORGANISASI_PPD,
        schoolCode: null,
        pegawaiPpdId: pegawai.id,
      });
    }
    const sah = sahkanTeksKehadiran(
      { nama: p.nama ?? "", jawatan: p.jawatan ?? "" },
      { perluOrganisasi: false },
    );
    if (!sah.ok) return { ok: false, error: sah.error };
    return await simpanKehadiran({
      mesyuaratId,
      jenis: "PEGAWAI",
      nama: sah.nama,
      jawatan: sah.jawatan,
      organisasi: ORGANISASI_PPD,
      schoolCode: null,
      pegawaiPpdId: null,
    });
  }
}

/* ============================ Admin: kehadiran ============================ */

export async function adminSetKehadiranDibukaMjkd(
  id: string,
  dibuka: boolean,
): Promise<KehadiranActionResult> {
  await requireKandunganAccess();
  const [row] = await db
    .update(mjkdMesyuarat)
    .set({ kehadiranDibuka: dibuka === true, updatedAt: new Date() })
    .where(eq(mjkdMesyuarat.id, String(id)))
    .returning({ id: mjkdMesyuarat.id });
  if (!row) return { ok: false, error: "Mesyuarat tidak dijumpai." };
  revalidateKehadiran(row.id);
  return { ok: true, id: row.id };
}

export async function adminPadamKehadiranMjkd(id: string): Promise<KehadiranActionResult> {
  await requireKandunganAccess();
  const [row] = await db
    .delete(mjkdKehadiran)
    .where(eq(mjkdKehadiran.id, String(id)))
    .returning({ mesyuaratId: mjkdKehadiran.mesyuaratId });
  if (!row) return { ok: false, error: "Rekod tidak dijumpai." };
  revalidateKehadiran(row.mesyuaratId);
  return { ok: true };
}

/** Admin: tambah kehadiran secara manual (tidak bergantung pada suis buka/tutup). */
export async function adminTambahKehadiranMjkd(
  formData: FormData,
): Promise<KehadiranActionResult> {
  await requireKandunganAccess();
  const mesyuarat = await getMesyuarat(textField(formData.get("id"), 64));
  if (!mesyuarat) return { ok: false, error: "Mesyuarat tidak dijumpai." };

  const jenis = textField(formData.get("jenis"), 10);
  if (jenis !== "PGB" && jenis !== "WAKIL" && jenis !== "PEGAWAI" && jenis !== "LAIN") {
    return { ok: false, error: "Jenis tidak sah." };
  }

  let organisasi = textField(formData.get("organisasi"), 200);
  let schoolCode: string | null = null;
  if (jenis === "PGB" || jenis === "WAKIL") {
    const school = await getSchoolByCode(
      textField(formData.get("schoolCode"), 20).toUpperCase(),
    );
    if (!school) return { ok: false, error: "Sila pilih sekolah." };
    schoolCode = school.code;
    organisasi = school.name;
  } else if (jenis === "PEGAWAI" && !organisasi) {
    organisasi = ORGANISASI_PPD;
  }

  const tarikhRaw = textField(formData.get("tarikh"), 10);
  if (tarikhRaw && !isTarikhIso(tarikhRaw)) return { ok: false, error: "Tarikh tidak sah." };

  const sah = sahkanTeksKehadiran(
    {
      nama: textField(formData.get("nama"), 400),
      jawatan: textField(formData.get("jawatan"), 400),
      organisasi,
    },
    { perluOrganisasi: true },
  );
  if (!sah.ok) return { ok: false, error: sah.error };

  try {
    const res = await simpanKehadiran({
      mesyuaratId: mesyuarat.id,
      tarikh: tarikhRaw || undefined,
      jenis,
      nama: sah.nama,
      jawatan: sah.jawatan,
      organisasi: sah.organisasi!,
      schoolCode,
      pegawaiPpdId: null,
    });
    if (!res.ok) return { ok: false, error: res.error };
    if (res.duplikat) return { ok: false, error: "Orang ini sudah direkodkan hadir." };
    return { ok: true, id: mesyuarat.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menambah kehadiran." };
  }
}

/* ============================ Admin: pegawai PPD ============================ */

const pegawaiSchema = z.object({
  nama: z.string().trim().min(1, "Sila isi nama.").max(200, "Nama terlalu panjang."),
  jawatan: z.string().trim().max(300, "Jawatan terlalu panjang."),
  sektor: z.string().trim().max(100, "Sektor terlalu panjang."),
});

/** Tambah / sunting pegawai PPD (tiada IC / nama pengguna). Nama berganda ditolak. */
export async function adminSimpanPegawaiPpdMjkd(
  formData: FormData,
): Promise<KehadiranActionResult> {
  await requireKandunganAccess();
  const parsed = pegawaiSchema.safeParse({
    nama: String(formData.get("nama") ?? "").replace(/\s+/g, " "),
    jawatan: String(formData.get("jawatan") ?? "").replace(/\s+/g, " "),
    sektor: String(formData.get("sektor") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }
  const aktif = textField(formData.get("aktif"), 10) === "yes";
  const idRaw = textField(formData.get("id"), 20);
  const id = idRaw ? Number(idRaw) : null;
  if (idRaw && !Number.isInteger(id)) return { ok: false, error: "Pegawai tidak dijumpai." };

  try {
    const kunci = namaKunci(parsed.data.nama);
    const semua = await listPegawaiPpdAdmin();
    if (semua.some((p) => p.id !== id && namaKunci(p.nama) === kunci)) {
      return { ok: false, error: "Pegawai dengan nama ini sudah wujud." };
    }
    if (id !== null) {
      const [row] = await db
        .update(pegawaiPpd)
        .set({ ...parsed.data, aktif, updatedAt: new Date() })
        .where(eq(pegawaiPpd.id, id))
        .returning({ id: pegawaiPpd.id });
      if (!row) return { ok: false, error: "Pegawai tidak dijumpai." };
    } else {
      const maks = semua.reduce((m, p) => Math.max(m, p.sort), 0);
      await db.insert(pegawaiPpd).values({ ...parsed.data, aktif, sort: maks + 1 });
    }
    revalidatePath("/admin/mjkd/pegawai");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan pegawai." };
  }
}

export async function adminTogolPegawaiAktifMjkd(
  id: number,
  aktif: boolean,
): Promise<KehadiranActionResult> {
  await requireKandunganAccess();
  if (!Number.isInteger(id)) return { ok: false, error: "Pegawai tidak dijumpai." };
  const [row] = await db
    .update(pegawaiPpd)
    .set({ aktif: aktif === true, updatedAt: new Date() })
    .where(eq(pegawaiPpd.id, id))
    .returning({ id: pegawaiPpd.id });
  if (!row) return { ok: false, error: "Pegawai tidak dijumpai." };
  revalidatePath("/admin/mjkd/pegawai");
  return { ok: true };
}

/** Admin (pembentangan): kiraan kehadiran HARI INI — dipolling setiap 30 saat semasa tab kelihatan. */
export async function getKiraanKehadiranMjkd(
  mesyuaratId: string,
): Promise<{ ok: boolean; kiraan?: KiraanKehadiran; error?: string }> {
  await requireKandunganAccess();
  try {
    return await withDbTimeout(
      (async () => {
        const mesyuarat = await getMesyuarat(String(mesyuaratId ?? ""));
        if (!mesyuarat) return { ok: false, error: "Mesyuarat tidak dijumpai." };
        const rekod = await listKehadiran(mesyuarat.id);
        const sekolah = await listSekolahSemua();
        return {
          ok: true,
          kiraan: kiraanKehadiranHari(
            rekod,
            sekolah.map((s) => s.code),
            hariIniKl(),
          ),
        };
      })(),
    );
  } catch (e) {
    // Pelanggan mengekalkan kiraan terakhir.
    return { ok: false, error: isRalatTimeoutDb(e) ? MESEJ_DB_PERLAHAN : "Gagal memuat kiraan." };
  }
}
