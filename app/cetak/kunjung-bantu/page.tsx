import type { Metadata } from "next";
import Link from "next/link";
import ButangCetak from "@/components/kunjung-bantu/ButangCetak";
import CetakInstrumen from "@/components/kunjung-bantu/CetakInstrumen";
import { withDbTimeout } from "@/lib/db";
import { NAMA_INSTRUMEN } from "@/lib/kunjung-bantu/instrumen";
import {
  getDelimaSekolahTerkini,
  getRekod,
  getRekodByResit,
  getSekolah,
} from "@/lib/kunjung-bantu/queries";
import { getSessionUser } from "@/lib/rbac";
import { canManageKandungan } from "@/lib/roles";

export const metadata: Metadata = {
  title: `Cetak — ${NAMA_INSTRUMEN}`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ kod?: string; resit?: string }>;
};

/**
 * Halaman cetak A4 (di luar susun atur awam — tiada nav/footer). Akses: kod + nombor tiket
 * sekolah, ATAU staf PPD (Admin/Pegawai) dengan kod sahaja.
 */
export default async function CetakKunjungBantuPage({ searchParams }: Props) {
  const sp = await searchParams;
  const kod = (sp.kod ?? "").trim().toUpperCase();
  const resit = (sp.resit ?? "").trim().toUpperCase();
  const user = await getSessionUser();
  const staf = Boolean(user && user.authKind !== "moe-dl" && canManageKandungan(user.peranan));

  let data: {
    sekolah: Awaited<ReturnType<typeof getSekolah>>;
    rekod: Awaited<ReturnType<typeof getRekod>>;
    delima: Awaited<ReturnType<typeof getDelimaSekolahTerkini>>;
  } | null = null;
  let gagal = false;
  if (kod && (resit || staf)) {
    try {
      data = await withDbTimeout(
        (async () => {
          const sekolah = await getSekolah(kod);
          const rekod = resit ? await getRekodByResit(kod, resit) : staf ? await getRekod(kod) : null;
          const delima = rekod ? (rekod.delimaBeku ?? (await getDelimaSekolahTerkini(kod))) : null;
          return { sekolah, rekod, delima };
        })(),
      );
    } catch {
      gagal = true;
    }
  }

  const kembali = staf ? `/admin/kunjung-bantu/${encodeURIComponent(kod)}` : `/laporan-kunjung-bantu/semak?kod=${encodeURIComponent(kod)}&resit=${encodeURIComponent(resit)}`;

  return (
    <main className="min-h-screen bg-white px-4 py-6 print:p-0">
      <div className="no-print mx-auto mb-6 flex max-w-[190mm] flex-wrap items-center justify-between gap-3">
        <Link href={kembali} className="text-sm text-graphite hover:text-ink">
          ← Kembali
        </Link>
        {data?.rekod ? <ButangCetak /> : null}
      </div>
      {data?.rekod && data.sekolah ? (
        <CetakInstrumen sekolah={data.sekolah} rekod={data.rekod} delima={data.delima} />
      ) : (
        <p className="mx-auto max-w-[190mm] text-sm text-graphite">
          {gagal
            ? "Pangkalan data perlahan. Sila muat semula halaman ini."
            : "Rekod tidak dijumpai. Pastikan kod sekolah dan nombor tiket betul."}
        </p>
      )}
    </main>
  );
}
