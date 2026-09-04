import Link from "next/link";
import CardEmbed from "@/components/kandungan/CardEmbed";
import DeleteButton from "@/components/admin/DeleteButton";
import ToggleAktifButton from "@/components/admin/ToggleAktifButton";
import {
  deleteResourcesCard,
  toggleResourcesAktif,
} from "@/lib/actions/resources";
import { requireKandunganAccess } from "@/lib/rbac";
import { resourceCardDisplay } from "@/lib/resources/card-display";
import {
  RESOURCES_KATEGORI,
  resourcesAdminHref,
} from "@/lib/resources/kategori";
import { listResourcesCards } from "@/lib/resources/queries";

export const dynamic = "force-dynamic";

export default async function AdminResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  await requireKandunganAccess();
  const sp = await searchParams;
  const meta =
    RESOURCES_KATEGORI.find((k) => k.slug === sp.kategori) ??
    RESOURCES_KATEGORI.find((k) => k.slug === "pekeliling") ??
    RESOURCES_KATEGORI[0];
  const cards = await listResourcesCards(meta.slug, { includeHidden: true });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-graphite hover:text-ink">
            ← Papan Admin
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">CoE Resources</h1>
          <p className="mt-1 text-sm text-graphite">
            Tambah tajuk dan pautan surat. Pratonton dipaparkan pada kad.
          </p>
        </div>
        <Link
          href={`/admin/resources/baharu?kategori=${meta.slug}`}
          className="btn-primary"
        >
          Tambah Kad
        </Link>
      </div>

      <nav className="hairline mt-5 flex gap-1 overflow-x-auto border-b" aria-label="Kategori">
        {RESOURCES_KATEGORI.map((k) => (
          <Link
            key={k.slug}
            href={resourcesAdminHref(k.slug)}
            className={`whitespace-nowrap px-3 py-2 text-sm ${
              k.slug === meta.slug
                ? "border-b-2 border-ink font-semibold text-ink"
                : "text-graphite hover:text-ink"
            }`}
          >
            {k.title}
          </Link>
        ))}
      </nav>

      {cards.length === 0 ? (
        <p className="mt-8 text-center text-sm text-graphite">
          Tiada kad untuk kategori ini. Tambah tajuk dan pautan surat.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const display = resourceCardDisplay(c.url);
            return (
              <div key={c.id} className="space-y-2">
                <CardEmbed
                  title={c.title}
                  blurb=""
                  url={c.url}
                  typeLabel={display.typeLabel}
                  embed={display.embed}
                />
                <div className="flex flex-wrap items-center gap-3 px-1">
                  <ToggleAktifButton
                    aktif={c.aktif}
                    action={toggleResourcesAktif.bind(null, c.id)}
                  />
                  <Link href={`/admin/resources/${c.id}`} className="link-blue text-sm">
                    Edit
                  </Link>
                  <DeleteButton
                    action={deleteResourcesCard.bind(null, c.id)}
                    confirmText={`Padam kad "${c.title}"?`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
