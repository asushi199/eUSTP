import Link from "next/link";
import TebusBukuCsvUpload from "@/components/admin/TebusBukuCsvUpload";
import { withDbTimeout } from "@/lib/db";
import { requireKandunganAccess } from "@/lib/rbac";
import { formatKualaLumpurDate } from "@/lib/tebus-buku/csv";
import { formatCount, formatTarikhSnapshot } from "@/lib/tebus-buku/format";
import { listTebusBukuSchools } from "@/lib/tebus-buku/queries";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function AdminTebusBukuPage() {
  await requireKandunganAccess();

  let schools: Awaited<ReturnType<typeof listTebusBukuSchools>>["schools"] = [];
  let sourcedAt: string | null = null;
  let loadError = false;
  try {
    const data = await withDbTimeout(listTebusBukuSchools());
    schools = data.schools;
    sourcedAt = data.sourcedAt;
  } catch {
    loadError = true;
  }

  const pelajar = schools.reduce((sum, school) => sum + school.total, 0);
  const sudahTebus = schools.reduce((sum, school) => sum + school.tebusCount, 0);
  const sudahGuna = schools.reduce((sum, school) => sum + school.gunaCount, 0);
  const tarikh = formatTarikhSnapshot(sourcedAt);

  return (
    <>
      <Link href="/admin/pelaporan" className="text-sm text-graphite hover:text-ink">
        ← CoE Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tebus Buku</h1>
      <p className="mt-1 text-sm text-graphite">
        Muat naik CSV JPN setiap minggu. Rekod PPD MANJUNG menggantikan data sedia ada.
      </p>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-semibold">Data semasa</h2>
        {loadError ? (
          <p className="mt-2 text-sm text-graphite">
            Data semasa tidak dapat dibaca. Muat naik masih boleh diteruskan.
          </p>
        ) : schools.length === 0 ? (
          <p className="mt-2 text-sm text-graphite">Belum ada data pelajar.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-graphite">Setakat {tarikh}.</p>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-graphite">Pelajar</dt>
                <dd className="text-xl font-semibold">{formatCount(pelajar)}</dd>
              </div>
              <div>
                <dt className="text-xs text-graphite">Sekolah</dt>
                <dd className="text-xl font-semibold">{formatCount(schools.length)}</dd>
              </div>
              <div>
                <dt className="text-xs text-graphite">Sudah tebus</dt>
                <dd className="text-xl font-semibold">{formatCount(sudahTebus)}</dd>
              </div>
              <div>
                <dt className="text-xs text-graphite">Sudah guna</dt>
                <dd className="text-xl font-semibold">{formatCount(sudahGuna)}</dd>
              </div>
            </dl>
            <Link href="/laporan/tebus-buku" className="mt-4 inline-block text-sm text-graphite hover:text-ink">
              Buka halaman awam
            </Link>
          </>
        )}
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-semibold">Muat naik CSV</h2>
        <p className="mt-1 text-sm text-graphite">
          Pilih eksport mingguan. Nama dan emel pelajar disimpan untuk carian, dan tidak dipaparkan
          sebagai senarai di halaman ini.
        </p>
        <div className="mt-4">
          <TebusBukuCsvUpload today={formatKualaLumpurDate(new Date())} />
        </div>
      </section>
    </>
  );
}
