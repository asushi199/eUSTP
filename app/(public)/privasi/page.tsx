import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";

export const metadata = { title: "Dasar Privasi — NEXa Manjung" };

export default function PrivasiPage() {
  return (
    <PublicPageShell narrow className="pb-16 sm:pb-12">
      <PageHeader
        eyebrow="NEXa Manjung"
        title="Dasar Privasi"
        description="Bagaimana portal ini mengendalikan maklumat peribadi, termasuk log masuk Google MOE-DL."
      />

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-graphite">
        <section>
          <h2 className="text-base font-semibold text-ink">Siapa kami</h2>
          <p className="mt-2">
            NEXa dikendalikan oleh Unit Sumber Teknologi Pendidikan, Pejabat
            Pendidikan Daerah Manjung, untuk urusan rasmi sekolah di daerah ini.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">Log masuk Google MOE-DL</h2>
          <p className="mt-2">
            Untuk melihat nombor telefon dalam CoE Direktori, guru log masuk
            dengan akaun Google KPM <span className="font-medium text-ink">@moe-dl.edu.my</span>.
            Google hanya berkongsi nama dan alamat e-mel. Kami tidak meminta akses
            Gmail, Drive atau data Google lain.
          </p>
          <p className="mt-2">
            E-mel digunakan semata-mata untuk mengesahkan domain MOE-DL dan
            mengekalkan sesi log masuk. Akaun Gmail peribadi ditolak.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">Direktori sekolah</h2>
          <p className="mt-2">
            Nama jawatan dan sekolah boleh dilihat secara umum. Nombor telefon
            dan WhatsApp hanya dipaparkan selepas log masuk yang sah, supaya
            maklumat rakan guru tidak terdedah kepada orang ramai.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">Staf USTP</h2>
          <p className="mt-2">
            Pentadbir portal log masuk dengan ID USTP yang berasingan, bukan
            akaun Google MOE-DL.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">Simpanan dan perkongsian</h2>
          <p className="mt-2">
            Sesi disimpan sebagai kuki pada peranti anda. Kami tidak menjual
            data. Maklumat tidak dikongsi dengan pihak ketiga kecuali jika
            dikehendaki undang-undang.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">Hubungi</h2>
          <p className="mt-2">
            Pertanyaan privasi: Unit Sumber Teknologi Pendidikan, PPD Manjung.
          </p>
        </section>
      </div>
    </PublicPageShell>
  );
}
