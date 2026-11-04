import Link from "next/link";
import DirektoriPpdList from "@/components/direktori-ppd/DirektoriPpdList";
import { loadDirektoriPpd } from "@/lib/direktori-ppd/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Direktori PPD" };

export default async function DirektoriPpdPage() {
  const { rows, error } = await loadDirektoriPpd();
  return (
    <>
      <Link href="/direktori" className="text-sm text-graphite hover:text-ink">← CoE Directory</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Direktori PPD</h1>
      <p className="mt-1 text-sm text-graphite">
        Senarai pegawai PPD Manjung — nama, gred, jawatan dan no. telefon. Untuk kegunaan dalaman; hanya boleh dilihat selepas log masuk.
      </p>
      {error ? (
        <div className="card mt-6 border-amber-200 bg-amber-50/80 p-6 text-sm leading-relaxed text-graphite">
          <p className="font-semibold text-ink">Direktori PPD belum dapat dimuatkan</p>
          <p className="mt-2">{error}</p>
        </div>
      ) : (
        <section className="mt-6" aria-label="Senarai pegawai PPD">
          <DirektoriPpdList rows={rows} />
        </section>
      )}
    </>
  );
}
