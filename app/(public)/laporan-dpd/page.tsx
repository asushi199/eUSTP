import LaporanDpdForm from "@/components/laporan/LaporanDpdForm";

export const metadata = { title: "Laporan DPD — eUSTP Manjung" };

export default function LaporanDpdPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <h1 className="text-3xl font-medium tracking-tight">Laporan DPD</h1>
      <p className="mt-2 text-graphite">
        Laporan Program Pendigitalan Sekolah, PPD Manjung. Laporan web dijana
        serta-merta selepas hantaran — boleh dicetak atau disimpan sebagai PDF.
      </p>
      <div className="mt-8">
        <LaporanDpdForm />
      </div>
    </div>
  );
}
