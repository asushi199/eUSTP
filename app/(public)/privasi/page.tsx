import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";

export const metadata = { title: "Dasar Privasi — NEXa Manjung" };

export default function PrivasiPage() {
  return (
    <PublicPageShell narrow className="pb-16 sm:pb-12">
      <PageHeader
        eyebrow="NEXa Manjung"
        title="Dasar Privasi"
        description="Dasar ini menerangkan data yang dikumpul, tujuan penggunaan, simpanan, perkongsian dan hak pengguna. Ia merangkumi log masuk Google untuk CoE Direktori."
      />

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-graphite">
        <p>
          Portal: <Link href="/" className="link-blue">https://nexa-ustpmanjung.vercel.app</Link>
          {" · "}
          Terma: <Link href="/terma" className="link-blue">Terma Penggunaan</Link>
        </p>
        <p>Kemas kini terakhir: 4 September 2026.</p>

        <section>
          <h2 className="text-base font-semibold text-ink">1. Pengendali data</h2>
          <p className="mt-2">
            NEXa (Network for Educational eXcellence &amp; Access) dikendalikan oleh
            Unit Sumber Teknologi Pendidikan (USTP), Pejabat Pendidikan Daerah
            Manjung, Kementerian Pendidikan Malaysia. Portal ini untuk urusan rasmi
            sekolah di daerah Manjung sahaja.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">2. Data yang kami kumpul</h2>
          <p className="mt-2">Kami mungkin memproses:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-ink">Dari Google Sign-In:</span> nama
              paparan dan alamat e-mel akaun. Kami hanya menerima e-mel yang berakhir
              dengan <span className="font-medium text-ink">@moe-dl.edu.my</span>.
              Kami tidak meminta, membaca atau menyimpan kandungan Gmail, Drive,
              Kalendar, Kenalan atau data Google lain.
            </li>
            <li>
              <span className="font-medium text-ink">Sesi log masuk:</span> kuki sesi
              pada peranti anda supaya anda tidak perlu log masuk setiap halaman.
            </li>
            <li>
              <span className="font-medium text-ink">Direktori sekolah:</span> nama
              jawatan, nama guru, nombor telefon dan maklumat sekolah yang dihantar
              oleh sekolah / USTP untuk urusan rasmi. Nombor telefon tidak dipaparkan
              kepada orang ramai.
            </li>
            <li>
              <span className="font-medium text-ink">Staf USTP:</span> ID pengguna dan
              kata laluan hash untuk backend pentadbir, berasingan daripada Google.
            </li>
            <li>
              Log teknikal terhad (contoh ralat pelayan) untuk menjaga operasi portal.
              Kami tidak menggunakan Google Analytics untuk log masuk MOE-DL.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">3. Cara data Google digunakan</h2>
          <p className="mt-2">
            Nama dan e-mel dari Google digunakan hanya untuk: (a) mengesahkan anda
            guru / pegawai dengan akaun MOE-DL yang sah; (b) membenarkan paparan
            nombor telefon rakan guru dalam CoE Direktori; (c) membenarkan borang
            kemas kini direktori; (d) memaparkan status log masuk dan membenarkan
            log keluar.
          </p>
          <p className="mt-2">
            Data Google tidak digunakan untuk pengiklanan, profil pemasaran,
            penjualan data, atau latihan model AI. Gmail peribadi ditolak.
          </p>
          <p className="mt-2 font-medium text-ink">
            NEXa&apos;s use of information received from Google APIs will adhere to
            the Google API Services User Data Policy, including the Limited Use
            requirements.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">4. Simpanan dan tempoh</h2>
          <p className="mt-2">
            Sesi Google disimpan sebagai kuki JWT pada pelayar anda. Kami tidak
            menyimpan kata laluan Google. Rekod direktori sekolah disimpan dalam
            pangkalan data USTP Manjung untuk operasi daerah. Sesi tamat apabila
            anda log keluar atau kuki luput.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">5. Perkongsian</h2>
          <p className="mt-2">
            Kami tidak menjual data. Kami tidak berkongsi data Google dengan
            pengiklan atau broker data. Nombor telefon direktori hanya ditunjukkan
            kepada pengguna yang telah disahkan. Data boleh didedahkan jika
            dikehendaki undang-undang Malaysia atau arahan rasmi KPM / PPD.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">6. Hak pengguna</h2>
          <p className="mt-2">
            Anda boleh log keluar pada bila-bila masa. Untuk memadam sesi, log
            keluar dan/atau padam kuki pelayar. Untuk membetulkan nama atau nombor
            dalam direktori, gunakan borang kemas kini selepas log masuk, atau
            hubungi USTP Manjung. Permintaan berkenaan data Google Sign-In boleh
            dihantar kepada kami di bawah.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">7. Kanak-kanak</h2>
          <p className="mt-2">
            Log masuk Google Direktori ditujukan kepada guru dan pegawai, bukan
            murid. Portal tidak sengaja mengumpul data Google daripada kanak-kanak.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">8. Hubungi</h2>
          <p className="mt-2">
            Unit Sumber Teknologi Pendidikan, Pejabat Pendidikan Daerah Manjung.
            Pertanyaan privasi berkenaan NEXa dan log masuk MOE-DL hendaklah
            ditujukan kepada USTP Manjung.
          </p>
        </section>
      </div>
    </PublicPageShell>
  );
}
