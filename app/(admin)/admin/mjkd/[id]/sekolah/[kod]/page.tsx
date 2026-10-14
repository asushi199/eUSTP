import Link from "next/link";
import { notFound } from "next/navigation";
import JanaTiketMjkdButton from "@/components/mjkd/JanaTiketMjkdButton";
import MaklumBalasMjkdForm from "@/components/mjkd/MaklumBalasMjkdForm";
import { listSchoolOptions } from "@/lib/direktori/queries";
import {
  getMaklumBalasBySchool,
  getMesyuarat,
  getSchoolByCode,
  listPerkara,
} from "@/lib/mjkd/queries";
import { requireKandunganAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";
/** Muat naik gambar bukti melalui GAS boleh mengambil masa. */
export const maxDuration = 60;

type Props = {
  params: Promise<{ id: string; kod: string }>;
};

/** Admin: lihat / sunting maklum balas satu sekolah (atau isikan bagi pihak sekolah). */
export default async function AdminMjkdSekolahPage({ params }: Props) {
  await requireKandunganAccess();
  const { id, kod: raw } = await params;
  const kod = decodeURIComponent(raw).trim().toUpperCase();
  const mesyuarat = await getMesyuarat(id);
  if (!mesyuarat) notFound();
  const school = await getSchoolByCode(kod);
  if (!school) notFound();

  const [schools, perkara, record] = await Promise.all([
    listSchoolOptions(),
    listPerkara(mesyuarat.id, { aktifSahaja: true }),
    getMaklumBalasBySchool(mesyuarat.id, kod),
  ]);

  return (
    <>
      <div className="mb-6">
        <p className="text-sm text-graphite">
          <Link
            href={`/admin/mjkd/${mesyuarat.id}?tab=maklum-balas`}
            className="hover:text-ink"
          >
            ← Maklum balas MJKD 2026
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {school.code} — {school.name}
        </h1>
        <p className="mt-1 text-sm text-graphite">
          {record
            ? `Dihantar ${record.tarikhHantar.toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })}`
            : "Belum menghantar — anda boleh mengisi bagi pihak sekolah."}
        </p>
      </div>

      {record ? (
        <div className="card mb-6 p-5">
          <JanaTiketMjkdButton
            mesyuaratId={mesyuarat.id}
            schoolCode={school.code}
            tiketAsal={record.receiptToken}
          />
        </div>
      ) : null}

      <MaklumBalasMjkdForm
        key={record?.id ?? "baharu"}
        adminMode
        mesyuarat={{ id: mesyuarat.id, bil: mesyuarat.bil, tahun: mesyuarat.tahun }}
        schools={schools}
        perkara={perkara.map((p) => ({
          id: p.id,
          para: p.para,
          mukaSurat: p.mukaSurat,
          perkara: p.perkara,
          tindakan: p.tindakan,
          panduan: p.panduan,
          sasaran: p.sasaran,
          sekolahKhusus: p.sekolahKhusus,
        }))}
        initialSchoolCode={school.code}
        existing={
          record
            ? {
                namaPengisi: record.namaPengisi,
                jawatanPengisi: record.jawatanPengisi,
                items: record.items.map((it) => ({
                  perkaraId: it.perkaraId,
                  status: it.status,
                  catatan: it.catatan,
                  pautanBukti: it.pautanBukti,
                  fotoBukti: it.fotoBukti,
                })),
              }
            : null
        }
      />
    </>
  );
}
