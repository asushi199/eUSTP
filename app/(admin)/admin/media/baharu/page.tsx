import Link from "next/link";
import MediaCardForm from "@/components/admin/MediaCardForm";
import { mediaAdminHref, mediaKategoriBySlug } from "@/lib/media/kategori";
import { requireKandunganAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function TambahMediaKadPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  await requireKandunganAccess();
  const sp = await searchParams;
  const kategori = mediaKategoriBySlug(sp.kategori ?? "")?.slug ?? "koleksi";

  return (
    <>
      <Link href={mediaAdminHref(kategori)} className="text-sm text-graphite hover:text-ink">
        ← CoE Media
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tambah Kad</h1>
      <p className="mt-1 text-sm text-graphite">
        Isi tajuk, bulan bahan, dan muat naik fail atau tampal pautan YouTube / Drive.
      </p>
      <div className="mt-5">
        <MediaCardForm
          values={{
            kategori,
            title: "",
            url: "",
            letterMonth: null,
            sort: 0,
            aktif: true,
          }}
        />
      </div>
    </>
  );
}
