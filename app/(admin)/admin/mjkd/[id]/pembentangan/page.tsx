import { notFound } from "next/navigation";
import PembentanganMjkd from "@/components/mjkd/PembentanganMjkd";
import { requireKandunganAccess } from "@/lib/rbac";
import { muatDataMaklumBalasAdmin } from "@/lib/mjkd/admin-data";
import { urlKehadiranAwam } from "@/lib/mjkd/base-url";
import { MINIT_RUJUKAN, julatTarikh } from "@/lib/mjkd/acara";
import { hariIniKl } from "@/lib/mjkd/enums";
import { binaSlaidPembentangan } from "@/lib/mjkd/pembentangan";
import { getMesyuarat, listBahan, listKehadiran } from "@/lib/mjkd/queries";
import { qrDataUrl } from "@/lib/mjkd/qr";
import DbPerlahan from "@/components/mjkd/DbPerlahan";
import { withDbTimeout } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** Semua data pembentangan, BERURUTAN (kolam serverless 3 sambungan) — dalam `withDbTimeout`. */
async function muatData(id: string) {
  const mesyuarat = await getMesyuarat(id);
  if (!mesyuarat) return null;
  const data = await muatDataMaklumBalasAdmin(mesyuarat.id);
  const bahan = await listBahan(mesyuarat.id);
  const rekod = await listKehadiran(mesyuarat.id);
  return { mesyuarat, data, bahan, rekod };
}

/**
 * Mod pembentangan (projektor) MJKD 2026 — satu rekod: Kehadiran · Minit · Maklum Balas · Bahan.
 * Minit/perkara berasal daripada Bil.1/2026 (`MINIT_RUJUKAN`) tetapi disimpan pada rekod ini.
 */
export default async function AdminMjkdPembentanganPage({ params }: Props) {
  await requireKandunganAccess();
  const { id } = await params;

  let dimuat: Awaited<ReturnType<typeof muatData>>;
  try {
    dimuat = await withDbTimeout(muatData(id), 12_000);
  } catch {
    return <DbPerlahan href={`/admin/mjkd/${id}/pembentangan`} />;
  }
  if (!dimuat) notFound();
  const { mesyuarat, data, bahan, rekod } = dimuat;

  const rujukan = {
    bil: 1,
    tahun: mesyuarat.tahun,
    tarikh: MINIT_RUJUKAN.tarikh,
    tempat: MINIT_RUJUKAN.tempat,
    minitUrl: mesyuarat.minitUrl,
  };
  const url = await urlKehadiranAwam();
  const qr = await qrDataUrl(url);

  const pembentangan = binaSlaidPembentangan({
    mesyuarat: { id: mesyuarat.id, bil: mesyuarat.bil, tahun: mesyuarat.tahun },
    rujukan: {
      bil: rujukan.bil,
      tahun: rujukan.tahun,
      tarikh: rujukan.tarikh,
      tempat: rujukan.tempat,
      minitUrl: rujukan.minitUrl,
    },
    perkara: data.perkara.map((p) => ({
      id: p.id,
      para: p.para,
      mukaSurat: p.mukaSurat,
      perkara: p.perkara,
      tindakan: p.tindakan,
      sasaran: p.sasaran,
      sekolahKhusus: p.sekolahKhusus,
      aktif: p.aktif,
      sort: p.sort,
    })),
    sekolah: data.sekolah.map((s) => ({ code: s.code, name: s.name, zone: s.zone })),
    maklumBalas: data.maklumBalas.map((m) => ({
      id: m.id,
      schoolCode: m.schoolCode,
      namaPengisi: m.namaPengisi,
      jawatanPengisi: m.jawatanPengisi,
    })),
    items: data.items.map((it) => ({
      maklumBalasId: it.maklumBalasId,
      perkaraId: it.perkaraId,
      status: it.status,
      catatan: it.catatan,
      pautanBukti: it.pautanBukti,
      fotoBukti: it.fotoBukti,
      dipilih: it.dipilih,
      susunanBacaan: it.susunanBacaan,
    })),
    bahan: bahan.map((b) => ({
      id: b.id,
      sektorUnit: b.sektorUnit,
      tajuk: b.tajuk,
      namaPembentang: b.namaPembentang,
      hari: b.hari,
      jenis: b.jenis,
      url: b.url,
      storagePath: b.storagePath,
      createdAt: b.createdAt.toISOString(),
    })),
    kehadiran: {
      hariIni: hariIniKl(),
      url,
      qr,
      rekod: rekod.map((r) => ({ jenis: r.jenis, schoolCode: r.schoolCode, tarikh: r.tarikh })),
    },
  });

  return (
    <PembentanganMjkd
      mesyuaratId={mesyuarat.id}
      pembentangan={pembentangan}
      acara={{
        tarikh: julatTarikh(mesyuarat.tarikh, mesyuarat.tarikhTamat),
        tempat: mesyuarat.tempat,
      }}
    />
  );
}
