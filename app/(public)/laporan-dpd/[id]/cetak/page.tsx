import Link from "next/link";
import { notFound } from "next/navigation";
import PrintButton from "@/components/laporan/PrintButton";
import { getLaporanDpd } from "@/lib/laporan/queries";

export const dynamic = "force-dynamic";

function fmtTarikh(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ms-MY", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function DpdCetakPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const laporanId = Number.parseInt(id, 10);
  if (!Number.isFinite(laporanId)) notFound();

  const laporan = await getLaporanDpd(laporanId);
  if (!laporan) notFound();

  const jumlahPeserta =
    laporan.bilMurid + laporan.bilGuru + laporan.bilPentadbir + laporan.bilSwasta;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-6 flex items-center justify-between gap-3">
        <Link href="/laporan-dpd" className="text-sm text-graphite hover:text-ink">
          ← Laporan DPD
        </Link>
        <PrintButton />
      </div>

      {/* Kepala laporan */}
      <header className="border-b-2 border-ink pb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-graphite">
          Pejabat Pendidikan Daerah Manjung
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Laporan Program Pendigitalan Sekolah (DPD)
        </h1>
        <p className="mt-1 text-sm text-graphite">
          No. Rujukan: DPD-{laporan.id} · {fmtTarikh(laporan.tarikh)}
        </p>
      </header>

      {/* Butiran */}
      <section className="mt-6">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {(
              [
                ["Kod & Nama Organisasi", laporan.organisasi],
                ["Nama Program", laporan.namaProgram],
                ["Tarikh", fmtTarikh(laporan.tarikh)],
                ["Tempat / Lokasi", laporan.lokasi || "-"],
                ["Jenis Program", laporan.jenisProgram || "-"],
                ["Emel Pelapor", laporan.emailPelapor || "-"],
              ] as const
            ).map(([label, value]) => (
              <tr key={label} className="border-b hairline">
                <td className="w-52 py-2.5 pr-4 align-top font-semibold">{label}</td>
                <td className="py-2.5">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Penyertaan */}
      <section className="mt-6">
        <h2 className="text-base font-semibold">Bilangan Penyertaan</h2>
        <table className="mt-2 w-full border-collapse text-center text-sm">
          <thead>
            <tr className="border-y-2 border-ink">
              <th className="py-2 font-semibold">Murid</th>
              <th className="py-2 font-semibold">Guru</th>
              <th className="py-2 font-semibold">Pentadbir (AKP)</th>
              <th className="py-2 font-semibold">Sektor Swasta</th>
              <th className="py-2 font-semibold">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hairline">
              <td className="py-2.5">{laporan.bilMurid}</td>
              <td className="py-2.5">{laporan.bilGuru}</td>
              <td className="py-2.5">{laporan.bilPentadbir}</td>
              <td className="py-2.5">{laporan.bilSwasta}</td>
              <td className="py-2.5 font-semibold">{jumlahPeserta}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Dasar Pendidikan Digital */}
      {(laporan.teras || laporan.strategi || laporan.inisiatif) && (
        <section className="mt-6">
          <h2 className="text-base font-semibold">Dasar Pendidikan Digital</h2>
          <table className="mt-2 w-full border-collapse text-sm">
            <tbody>
              {(
                [
                  ["Teras", laporan.teras],
                  ["Strategi", laporan.strategi],
                  ["Inisiatif", laporan.inisiatif],
                ] as const
              )
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <tr key={label} className="border-b hairline">
                    <td className="w-52 py-2.5 pr-4 align-top font-semibold">{label}</td>
                    <td className="whitespace-pre-line py-2.5">{value}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Gambar */}
      {laporan.photos.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base font-semibold">Gambar Program</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {laporan.photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.publicUrl}
                alt={`Gambar program ${i + 1}`}
                className="h-52 w-full rounded-lg border hairline object-cover print:h-64"
              />
            ))}
          </div>
        </section>
      )}

      <footer className="mt-10 border-t hairline pt-4 text-xs text-graphite">
        Laporan ini dijana melalui eUSTP Manjung · Unit Sumber Teknologi
        Pendidikan, PPD Manjung
      </footer>
    </div>
  );
}
