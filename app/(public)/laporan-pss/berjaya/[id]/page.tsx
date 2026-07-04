import Link from "next/link";

export const metadata = { title: "Berjaya — eUSTP Manjung" };

export default async function PssBerjayaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ amaran?: string }>;
}) {
  const { id } = await params;
  const { amaran } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-8">
      <p className="text-5xl">✓</p>
      <h1 className="mt-4 text-2xl font-semibold">Laporan diterima</h1>
      <p className="mt-2 text-graphite">
        Laporan PSS anda (#{id}) telah disimpan. Anda boleh melihat dan mencetak
        laporan sekarang.
      </p>
      {amaran && (
        <p className="mx-auto mt-4 max-w-md rounded-md border border-bloom-rose bg-bloom-rose/30 px-3 py-2 text-sm text-bloom-deep">
          {amaran}
        </p>
      )}
      <div className="mt-8 flex justify-center gap-3">
        <Link href={`/laporan-pss/${id}/cetak`} className="btn-primary">
          Lihat Laporan
        </Link>
        <Link href="/laporan-pss" className="btn-outline-ink">
          Hantar Lagi
        </Link>
      </div>
    </div>
  );
}
