import { redirect } from "next/navigation";
import Link from "next/link";
import KemaskiniForm from "@/components/direktori/KemaskiniForm";
import { getDirectoryContactAccess } from "@/lib/direktori/access";
import { listPublicDirectory, listSchoolOptions } from "@/lib/direktori/queries";
import { direktoriLoginHref } from "@/lib/moe-dl";

export const dynamic = "force-dynamic";

export const metadata = { title: "Kemas Kini Direktori — NEXa Manjung" };

export default async function KemaskiniPage() {
  const access = await getDirectoryContactAccess();
  if (!access.ok) {
    redirect(direktoriLoginHref("/direktori/kemaskini"));
  }

  const [schools, currentRows] = await Promise.all([
    listSchoolOptions(),
    listPublicDirectory(undefined, { includeContacts: true }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <Link href="/direktori" className="text-sm text-graphite hover:text-ink">
        ← Direktori
      </Link>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">
        Kemas Kini Maklumat Perhubungan Sekolah
      </h1>
      <p className="mt-2 text-graphite">
        Kemaskini akan terus dipaparkan dalam direktori. Nama dan e-mel akaun
        MOE-DL anda direkod sebagai penghantar. Rekod lama disimpan sebagai
        sejarah versi.
      </p>

      <div className="mt-8">
        {schools.length === 0 ? (
          <div className="card p-6 text-graphite">
            Senarai sekolah belum tersedia. Sila hubungi pentadbir USTP.
          </div>
        ) : (
          <KemaskiniForm
            schools={schools}
            currentRows={currentRows}
            actorNama={access.nama}
            actorEmail={access.email}
          />
        )}
      </div>
    </div>
  );
}
