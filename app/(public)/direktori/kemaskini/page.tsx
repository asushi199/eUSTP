import Link from "next/link";
import KemaskiniForm from "@/components/direktori/KemaskiniForm";
import { listPublicDirectory, listSchoolOptions } from "@/lib/direktori/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Kemas Kini Direktori — eUSTP Manjung" };

export default async function KemaskiniPage() {
  const [schools, currentRows] = await Promise.all([
    listSchoolOptions(),
    listPublicDirectory(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <Link href="/direktori" className="text-sm text-graphite hover:text-ink">
        ← Direktori
      </Link>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">
        Kemas Kini Maklumat Guru Penyelaras
      </h1>
      <p className="mt-2 text-graphite">
        Kemaskini akan terus dipaparkan dalam direktori. Rekod lama disimpan
        sebagai sejarah versi.
      </p>

      <div className="mt-8">
        {schools.length === 0 ? (
          <div className="card p-6 text-graphite">
            Senarai sekolah belum tersedia. Sila hubungi pentadbir USTP.
          </div>
        ) : (
          <KemaskiniForm schools={schools} currentRows={currentRows} />
        )}
      </div>
    </div>
  );
}
