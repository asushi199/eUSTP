import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";

export const metadata = { title: "Terma Penggunaan — NEXa Manjung" };

export default function TermaPage() {
  return (
    <PublicPageShell narrow className="pb-16 sm:pb-12">
      <PageHeader
        eyebrow="NEXa Manjung"
        title="Terma Penggunaan"
        description="Syarat ringkas penggunaan portal NEXa by USTP Manjung."
      />

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-graphite">
        <section>
          <h2 className="text-base font-semibold text-ink">Tujuan portal</h2>
          <p className="mt-2">
            NEXa ialah portal rasmi USTP Manjung untuk laporan, direktori,
            tempahan dan perkhidmatan berkaitan sekolah daerah Manjung. Ia
            bukan untuk kegunaan komersial.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">Direktori</h2>
          <p className="mt-2">
            Senarai sekolah boleh dirujuk secara umum. Nombor telefon hanya
            untuk guru dan pegawai yang log masuk dengan akaun{" "}
            <span className="font-medium text-ink">@moe-dl.edu.my</span>. Jangan
            salin, edar atau menyalahgunakan nombor rakan guru.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">Akaun</h2>
          <p className="mt-2">
            Log masuk Google MOE-DL hanya untuk melihat maklumat perhubungan.
            Backend pentadbir menggunakan akaun USTP yang berasingan. Pengguna
            bertanggungjawab menjaga akaun masing-masing.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">Kandungan</h2>
          <p className="mt-2">
            Maklumat diusahakan supaya tepat, tetapi PPD Manjung boleh
            mengemas kini atau menyekat capaian jika perlu untuk keselamatan
            atau operasi.
          </p>
        </section>
      </div>
    </PublicPageShell>
  );
}
