import { notFound } from "next/navigation";
import PembentanganMjkd from "@/components/mjkd/PembentanganMjkd";
import { requireKandunganAccess } from "@/lib/rbac";
import { muatDataMaklumBalasAdmin } from "@/lib/mjkd/admin-data";
import { urlKehadiranAwam } from "@/lib/mjkd/base-url";
import { hariIniKl } from "@/lib/mjkd/enums";
import { binaSlaidPembentangan } from "@/lib/mjkd/pembentangan";
import { getMesyuarat, listBahan, listKehadiran } from "@/lib/mjkd/queries";
import { qrDataUrl } from "@/lib/mjkd/qr";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/**
 * Mod pembentangan (projektor). Mesyuarat X: Kehadiran (X) · Minit (sebelum) · Maklum Balas
 * (sebelum) · Bahan (X). Jika X tiada mesyuarat sebelum, Minit/Maklum Balas guna X sendiri.
 */
export default async function AdminMjkdPembentanganPage({ params }: Props) {
  await requireKandunganAccess();
  const { id } = await params;
  const mesyuarat = await getMesyuarat(id);
  if (!mesyuarat) notFound();

  const rujukan =
    (mesyuarat.mesyuaratSebelumId ? await getMesyuarat(mesyuarat.mesyuaratSebelumId) : null) ??
    mesyuarat;

  const url = await urlKehadiranAwam();
  const [data, bahan, rekod, qr] = await Promise.all([
    muatDataMaklumBalasAdmin(rujukan.id),
    listBahan(mesyuarat.id),
    listKehadiran(mesyuarat.id),
    qrDataUrl(url),
  ]);

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

  return <PembentanganMjkd mesyuaratId={mesyuarat.id} pembentangan={pembentangan} />;
}
