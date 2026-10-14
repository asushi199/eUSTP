import { notFound } from "next/navigation";
import Pentas from "@/components/mjkd/pembentangan/Pentas";
import { requireKandunganAccess } from "@/lib/rbac";
import { julatTarikh } from "@/lib/mjkd/acara";
import { urlKehadiranAwam } from "@/lib/mjkd/base-url";
import { muatDataPentas } from "@/lib/mjkd/pentas-data";
import { getMesyuarat } from "@/lib/mjkd/queries";
import { qrDataUrl } from "@/lib/mjkd/qr";
import DbPerlahan from "@/components/mjkd/DbPerlahan";
import { withDbTimeout } from "@/lib/db";
import type { DataPentas } from "@/lib/mjkd/pembentangan";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/**
 * Mod pembentangan (projektor) MJKD 2026 v2 — satu dek berterusan (Pembukaan → Kehadiran → Minit →
 * Maklum Balas → Pembentangan Sektor → Penutup), data langsung. Minit/perkara berasal daripada
 * Bil.1/2026 (`MINIT_RUJUKAN`) tetapi disimpan pada rekod acara ini.
 */
export default async function AdminMjkdPembentanganPage({ params }: Props) {
  await requireKandunganAccess();
  const { id } = await params;

  // Rekod mesyuarat dahulu (tarikh/tempat untuk krom) — jika DB perlahan, halaman notis biasa.
  let mesyuarat: Awaited<ReturnType<typeof getMesyuarat>>;
  try {
    mesyuarat = await withDbTimeout(getMesyuarat(id), 8000);
  } catch {
    return <DbPerlahan href={`/admin/mjkd/${id}/pembentangan`} />;
  }
  if (!mesyuarat) notFound();

  // Data penuh BERURUTAN dalam had masa; gagal = Pentas memakai salinan localStorage terakhir.
  let awal: DataPentas | null = null;
  try {
    awal = await withDbTimeout(muatDataPentas(mesyuarat.id), 12_000);
  } catch {
    awal = null;
  }

  const url = await urlKehadiranAwam();
  const qr = await qrDataUrl(url);

  return (
    <Pentas
      mesyuaratId={mesyuarat.id}
      awal={awal}
      acara={{ tarikh: julatTarikh(mesyuarat.tarikh, mesyuarat.tarikhTamat), tempat: mesyuarat.tempat }}
      kehadiran={{ url, qr }}
    />
  );
}
