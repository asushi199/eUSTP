import Link from "next/link";
import { notFound } from "next/navigation";
import PrintButton from "@/components/laporan/PrintButton";
import { getLaporanPss } from "@/lib/laporan/queries";

export const dynamic = "force-dynamic";

function fmtTarikh(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ms-MY", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function PssCetakPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const laporanId = Number.parseInt(id, 10);
  if (!Number.isFinite(laporanId)) notFound();

  const laporan = await getLaporanPss(laporanId);
  if (!laporan) notFound();

  const tarikhGabungan = laporan.tarikhTamat
    ? `${fmtTarikh(laporan.tarikhMula)} — ${fmtTarikh(laporan.tarikhTamat)}`
    : fmtTarikh(laporan.tarikhMula);
  const jumlahPeserta = laporan.bilGuru + laporan.bilMurid;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-6 flex items-center justify-between gap-3">
        <Link href="/laporan-pss" className="text-sm text-graphite hover:text-ink">
          ← Laporan PSS
        </Link>
        <PrintButton />
      </div>

      <header className="border-b-2 border-ink pb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-graphite">
          Pejabat Pendidikan Daerah Manjung
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Laporan Aktiviti Pusat Sumber Sekolah (PSS)
        </h1>
        <p className="mt-1 text-sm text-graphite">
          No. Rujukan: PSS-{laporan.id} · {tarikhGabungan}
        </p>
      </header>

      <section className="mt-6">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {(
              [
                ["Sekolah", `${laporan.schoolCode} — ${laporan.schoolName}`],
                ["Nama Program", laporan.namaProgram],
                ["Tarikh", tarikhGabungan],
                [
                  "Jumlah Peserta",
                  `${jumlahPeserta} (Guru: ${laporan.bilGuru}, Murid: ${laporan.bilMurid})`,
                ],
                ["Pelapor", laporan.pelapor || "-"],
                ["Jawatan", laporan.jawatan || "-"],
              ] as const
            ).map(([label, value]) => (
              <tr key={label} className="border-b hairline">
                <td className="w-44 py-2.5 pr-4 align-top font-semibold">{label}</td>
                <td className="py-2.5">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {(
        [
          ["Objektif", laporan.objektif],
          ["Ringkasan Program", laporan.ringkasan],
          ["Impak", laporan.impak],
        ] as const
      )
        .filter(([, v]) => v)
        .map(([label, value]) => (
          <section key={label} className="mt-6">
            <h2 className="text-base font-semibold">{label}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{value}</p>
          </section>
        ))}

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
