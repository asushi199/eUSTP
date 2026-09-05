import type { Metadata } from "next";
import Link from "next/link";
import DirectoryViewerBar from "@/components/direktori/DirectoryViewerBar";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import PegawaiGrid from "@/components/maklumat/PegawaiGrid";
import TakwimEmbed from "@/components/maklumat/TakwimEmbed";
import { getDirectoryContactAccess } from "@/lib/direktori/access";
import { driveFilePreviewUrl } from "@/lib/kandungan/embed-urls";
import { getSettings, listPegawaiAktif } from "@/lib/maklumat/queries";
import { direktoriLoginHref } from "@/lib/moe-dl";
import { getModuleAccent } from "@/lib/module-theme";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Direktori USTP — NEXa Manjung",
  description:
    "Carta organisasi, maklumat PKG/CoE, takwim dan pegawai Unit Sumber Teknologi Pendidikan PPD Manjung.",
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
  return <img src={url} alt={alt} loading="lazy" className="w-full rounded-lg border border-fog" />;
}

export default async function DirektoriUstpPage() {
  const access = await getDirectoryContactAccess();
  const accent = getModuleAccent("/direktori/ustp");
  const loginHref = direktoriLoginHref("/direktori/ustp");

  if (!access.ok) {
    return (
      <PublicPageShell>
        <Link href="/direktori" className="text-sm text-graphite hover:text-ink">
          ← CoE Directory
        </Link>
        <PageHeader
          className="mt-2"
          eyebrow="CoE Directory"
          title="Direktori USTP"
          accent={accent}
          description="Carta organisasi, maklumat PKG/CoE, takwim dan senarai pegawai USTP."
        />
        <div className="mt-8 rounded-xl border hairline bg-white px-4 py-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm leading-relaxed text-graphite">
            Maklumat ini dilindungi. Log masuk dengan akaun{" "}
            <span className="font-medium text-ink">@moe-dl.edu.my</span> untuk
            melihat data.
          </p>
          <Link href={loginHref} className="btn-primary mt-3 shrink-0 sm:mt-0">
            Log masuk MOE-DL
          </Link>
        </div>
      </PublicPageShell>
    );
  }

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

  return (
    <PublicPageShell>
      <Link href="/direktori" className="text-sm text-graphite hover:text-ink">
        ← CoE Directory
      </Link>
      <PageHeader
        className="mt-2"
        eyebrow="CoE Directory"
        title="Direktori USTP"
        accent={accent}
        description="Organisasi, kemudahan dan takwim Unit Sumber Teknologi Pendidikan PPD Manjung."
      />

      {access.authKind === "moe-dl" ? (
        <DirectoryViewerBar nama={access.nama} email={access.email} />
      ) : null}

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

      <div className="mt-4">
        <TakwimEmbed embedUrl={s("takwim_embed_url")} title={s("takwim_title")} />
      </div>

      {senaraiPegawai.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Pegawai USTP</h2>
          <PegawaiGrid
            senarai={senaraiPegawai.map((p) => ({
              id: p.id,
              nama: p.nama,
              jawatan: p.jawatan,
              telefon: p.telefon,
              photoUrl: p.photoUrl,
              detailUrl: p.detailUrl,
            }))}
          />
        </section>
      ) : null}
    </PublicPageShell>
  );
}
