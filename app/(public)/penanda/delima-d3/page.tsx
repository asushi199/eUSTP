import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import TerimaDelimaD3 from "@/components/analisis/TerimaDelimaD3";

export const metadata = {
  title: "Kemas kini DELIMa — NEXa Manjung",
  robots: { index: false, follow: false },
};

/**
 * Destinasi penanda DELIMa d3 (`public/penanda/delima-d3.js`). Sengaja di luar `/admin`: data
 * tiba dalam serpihan URL, dan middleware admin akan membuangnya semasa log masuk. Kebenaran
 * (Admin/Pegawai) disemak dalam server action `terimaDelimaD3`. Tiada query DB semasa render.
 */
export default function PenandaDelimaD3Page() {
  return (
    <PublicPageShell narrow className="pb-16 sm:pb-12">
      <PageHeader
        eyebrow="CoE Analytics"
        title="Kemas kini DELIMa"
        description="Data dibaca daripada d3.delima.edu.my oleh penanda dalam pelayar anda. Semak ringkasan, kemudian simpan."
      />
      <TerimaDelimaD3 />
    </PublicPageShell>
  );
}
