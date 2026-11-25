import Link from "next/link";
import SemakanPegawaiForm from "@/components/kunjung-bantu/SemakanPegawaiForm";
import StatusLencana from "@/components/kunjung-bantu/StatusLencana";
import { withDbTimeout } from "@/lib/db";
import { ITEM_DIISI, NAMA_INSTRUMEN, kiraYa } from "@/lib/kunjung-bantu/instrumen";
import { getDelimaSekolahTerkini, getRekod, getSekolah } from "@/lib/kunjung-bantu/queries";
import { requireKandunganAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ kod: string }> };

function hariIniMy(): string {
  // Tarikh tempatan Malaysia (UTC+8) dalam format YYYY-MM-DD.
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
}

export default async function AdminKunjungBantuSekolahPage({ params }: Props) {
  const user = await requireKandunganAccess();
  const kod = decodeURIComponent((await params).kod).trim().toUpperCase();

  let data: {
    sekolah: Awaited<ReturnType<typeof getSekolah>>;
    rekod: Awaited<ReturnType<typeof getRekod>>;
    delima: Awaited<ReturnType<typeof getDelimaSekolahTerkini>>;
  };
  try {
    data = await withDbTimeout(
      (async () => {
        const sekolah = await getSekolah(kod);
        const rekod = sekolah ? await getRekod(kod) : null;
        const delima = rekod?.delimaBeku ?? (sekolah ? await getDelimaSekolahTerkini(kod) : null);
        return { sekolah, rekod, delima };
      })(),
    );
  } catch {
    return (
      <p className="card p-6 text-sm text-graphite">
        Pangkalan data perlahan. Sila muat semula halaman ini.
      </p>
    );
  }
  const { sekolah, rekod, delima } = data;

  return (
    <>
      <Link href="/admin/kunjung-bantu" className="text-sm text-graphite hover:text-ink">
        ← {NAMA_INSTRUMEN}
      </Link>
      {!sekolah ? (
        <p className="card mt-6 p-6 text-sm text-graphite">Kod sekolah tidak dijumpai.</p>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {sekolah.code} — {sekolah.name}
              </h1>
              <p className="mt-1 text-sm text-graphite">{sekolah.zone || "—"}</p>
            </div>
            {rekod ? <StatusLencana status={rekod.status} /> : <StatusLencana status="BELUM" />}
          </div>

          {!rekod ? (
            <p className="card mt-6 p-6 text-sm text-graphite">
              Sekolah ini belum menghantar instrumen. Minta PGB / Admin DELIMa mengisi di{" "}
              <Link href="/laporan-kunjung-bantu" className="link-blue" target="_blank">
                borang awam
              </Link>
              .
            </p>
          ) : (
            <>
              <div className="card mt-6 grid gap-3 p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <p>
                  <span className="block text-xs text-graphite">Pengetua / Guru Besar</span>
                  {rekod.namaPgb || "—"}
                </p>
                <p>
                  <span className="block text-xs text-graphite">PK Pentadbiran</span>
                  {rekod.namaPkPentadbiran || "—"}
                </p>
                <p>
                  <span className="block text-xs text-graphite">Admin DELIMa</span>
                  {rekod.namaAdminDelima || "—"}
                </p>
                <p>
                  <span className="block text-xs text-graphite">Dihantar · nombor tiket</span>
                  {rekod.tarikhHantar.toLocaleString("ms-MY")} ·{" "}
                  <span className="font-mono">{rekod.receiptToken}</span>
                </p>
                <p className="sm:col-span-2 lg:col-span-4 text-graphite">
                  {kiraYa(rekod.jawapan).ya}/{ITEM_DIISI.length} item ditanda Ya oleh sekolah.
                  {rekod.status === "DIHANTAR" && rekod.disemakPada && rekod.tarikhHantar > rekod.disemakPada
                    ? " Sekolah telah mengemaskini selepas semakan terakhir."
                    : ""}
                </p>
              </div>
              <div className="mt-6">
                <SemakanPegawaiForm
                  key={rekod.tarikhHantar.toISOString()}
                  schoolCode={sekolah.code}
                  status={rekod.status}
                  jawapan={rekod.jawapan}
                  semakan={rekod.semakan}
                  isu={rekod.isu}
                  ulasanPegawai={rekod.ulasanPegawai}
                  namaPegawai={rekod.namaPegawai || user.nama || ""}
                  tarikhPenilaian={rekod.tarikhPenilaian ?? hariIniMy()}
                  delima={delima}
                />
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
