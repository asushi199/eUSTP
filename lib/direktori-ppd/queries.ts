import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { direktoriPpd } from "@/lib/schema";

export type DirektoriPpdItem = {
  id: number;
  nama: string;
  gred: string;
  jawatan: string;
  telefon: string;
};

/** Senarai pegawai PPD — staf yang log masuk sahaja (mengandungi no. telefon). */
export async function listDirektoriPpd(): Promise<DirektoriPpdItem[]> {
  await requireUser();
  return db
    .select({
      id: direktoriPpd.id,
      nama: direktoriPpd.nama,
      gred: direktoriPpd.gred,
      jawatan: direktoriPpd.jawatan,
      telefon: direktoriPpd.telefon,
    })
    .from(direktoriPpd)
    .orderBy(asc(direktoriPpd.sort), asc(direktoriPpd.id));
}

export async function loadDirektoriPpd() {
  try {
    return { rows: await listDirektoriPpd(), error: null as string | null };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("does not exist") && msg.includes("direktori_ppd")) {
      return { rows: [] as DirektoriPpdItem[], error: "Jadual direktori_ppd belum wujud. Jalankan migrasi pangkalan data (npm run db:migrate)." };
    }
    throw error;
  }
}
