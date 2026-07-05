import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { getSettings, listPegawaiAktif } from "@/lib/maklumat/queries";
import { driveFilePreviewUrl, driveImageUrl } from "@/lib/kandungan/embed-urls";
import { getModuleAccent } from "@/lib/module-theme";
import TakwimEmbed from "@/components/maklumat/TakwimEmbed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maklumat Asas — eUSTP Manjung",
  description:
    "Carta organisasi, maklumat PKG/COE, takwim dan pegawai Unit Sumber Teknologi Pendidikan PPD Manjung.",
};

/** Imej tetapan: laluan tempatan (public/) → <img>; pautan Drive → iframe preview. */
function SettingImage({ url, alt }: { url: string; alt: string }) {
  if (!url) return null;
  if (/drive\.google\.com/i.test(url)) {
    return (
      <iframe
        src={driveFilePreviewUrl(url)}
        title={alt}
        className="h-96 w-full rounded-lg border border-fog"
        loading="lazy"
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} loading="lazy" className="w-full rounded-lg border border-fog" />;
}

export default async function MaklumatAsasPage() {
  const [settings, senaraiPegawai] = await Promise.all([
    getSettings([
      "carta_image_url",
      "carta_title",
      "carta_blurb",
      "pkg_image_url",
      "pkg_title",
      "pkg_blurb",
      "takwim_embed_url",
      "takwim_title",
    ]),
    listPegawaiAktif(),
  ]);
  const s = (k: string) => settings.get(k) ?? "";

  const accent = getModuleAccent("/maklumat-asas");

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="Maklumat Asas"
        title="Maklumat Asas"
        accent={accent}
        description="Organisasi, kemudahan dan takwim Unit Sumber Teknologi Pendidikan PPD Manjung."
      />

      {/* Carta organisasi + Maklumat PKG */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {s("carta_image_url") ? (
          <section className="card p-5">
            <h2 className="font-semibold">{s("carta_title") || "Carta Organisasi"}</h2>
            {s("carta_blurb") ? (
              <p className="mt-1 text-sm leading-relaxed text-graphite">{s("carta_blurb")}</p>
            ) : null}
            <div className="mt-3">
              <SettingImage url={s("carta_image_url")} alt={s("carta_title") || "Carta Organisasi"} />
            </div>
          </section>
        ) : null}
        {s("pkg_image_url") ? (
          <section className="card p-5">
            <h2 className="font-semibold">{s("pkg_title") || "Maklumat PKG"}</h2>
            {s("pkg_blurb") ? (
              <p className="mt-1 text-sm leading-relaxed text-graphite">{s("pkg_blurb")}</p>
            ) : null}
            <div className="mt-3">
              <SettingImage url={s("pkg_image_url")} alt={s("pkg_title") || "Maklumat PKG"} />
            </div>
          </section>
        ) : null}
      </div>

      {/* Takwim — klik untuk muat */}
      <div className="mt-4">
        <TakwimEmbed embedUrl={s("takwim_embed_url")} title={s("takwim_title")} />
      </div>

      {/* Pegawai */}
      {senaraiPegawai.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Pegawai USTP</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {senaraiPegawai.map((p) => (
              <div key={p.id} className="card flex items-start gap-4 p-4">
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={driveImageUrl(p.photoUrl)}
                    alt={p.nama}
                    loading="lazy"
                    className="h-16 w-16 shrink-0 rounded-lg border border-fog object-cover"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-cloud text-graphite">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-7 w-7">
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
                    </svg>
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{p.nama}</p>
                  {p.jawatan ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-graphite">{p.jawatan}</p>
                  ) : null}
                  {p.telefon ? (
                    <p className="mt-1 text-sm text-graphite">{p.telefon}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </PublicPageShell>
  );
}
