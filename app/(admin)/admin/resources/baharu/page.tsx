import Link from "next/link";
import ResourcesCardForm from "@/components/admin/ResourcesCardForm";
import { requireKandunganAccess } from "@/lib/rbac";
import { resourcesAdminHref, resourcesKategoriBySlug } from "@/lib/resources/kategori";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function TambahResourcesKadPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  await requireKandunganAccess();
  const sp = await searchParams;
  const kategori = resourcesKategoriBySlug(sp.kategori ?? "")?.slug ?? "pekeliling";

  return (
    <>
      <Link href={resourcesAdminHref(kategori)} className="text-sm text-graphite hover:text-ink">
        ← CoE Resources
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tambah Kad</h1>
      <p className="mt-1 text-sm text-graphite">
        Isi tajuk, bulan surat, dan muat naik fail atau tampal pautan.
      </p>
      <div className="mt-5">
        <ResourcesCardForm
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
