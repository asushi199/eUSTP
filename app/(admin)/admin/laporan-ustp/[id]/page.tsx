import Link from "next/link";
import { notFound } from "next/navigation";
import UstpReportActions from "@/components/laporan-ustp/UstpReportActions";
import { getUstpReport } from "@/lib/laporan-ustp/queries";
import { formatUstpDate, formatUstpMoney, ustpPkgLabel } from "@/lib/laporan-ustp/options";
import { ustpTotalSen } from "@/lib/laporan-ustp/validation";
import { buildUstpAppSheetUrl, ustpAppSheetManualAllocations } from "@/lib/laporan-ustp/appsheet";

export const metadata = { title: "Laporan Program USTP" };

export default async function UstpReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const report = await getUstpReport(id);
  if (!report) notFound();
  const { saved } = await searchParams;
  const month = report.startDate.slice(0, 7);
  const manualAllocations = ustpAppSheetManualAllocations(report);
  const fields = [
    ["KOD PKG", ustpPkgLabel(report.pkgCode)], ["Kluster program/aktiviti", report.cluster],
    ["Tarikh", `${formatUstpDate(report.startDate)} – ${formatUstpDate(report.endDate)}`],
    ["Tempat", report.location], ["Penganjur", report.organiser],
    ["Bil. sekolah terlibat", report.schoolCount], ["Bil. pegawai/guru terlibat", report.teacherCount],
    ["Bil. murid terlibat", report.studentCount], ["Bil. komuniti terlibat", report.communityCount],
    ["Teras dalam DPD", report.teras.join(", ") || "—"], ["Objektif aktiviti", report.objectives],
    ["Penggunaan peralatan CoE", report.equipmentUsed],
    ...(report.equipmentUsed === "Ya" ? [["Peralatan CoE yang digunakan", report.equipment.join("\n")]] : []),
    ["OS29000 (RM)", formatUstpMoney(report.os29000Sen)], ["OS42000 (RM)", formatUstpMoney(report.os42000Sen)],
    ["OS21000 (RM)", formatUstpMoney(report.os21000Sen)], ["Peruntukan lain", report.otherAllocation || "Tiada"],
    ["Peruntukan lain (RM)", formatUstpMoney(report.otherSen)], ["Jumlah (RM)", formatUstpMoney(ustpTotalSen(report))],
    ["Refleksi", report.reflection], ["Disediakan oleh", report.preparedBy],
  ];
  return <>
    <Link href={`/admin/laporan-ustp?month=${month}`} className="text-sm text-graphite hover:text-ink">← Laporan Program USTP</Link>
    <h1 className="mt-3 break-words text-2xl font-semibold">{report.programName}</h1>
    {saved === "1" && <p role="status" className="mt-3 text-sm text-graphite">Laporan berjaya disimpan.</p>}
    <div className="mt-5 flex flex-wrap items-start gap-3">
      <Link href={`/admin/laporan-ustp/${id}/edit`} className="btn-primary">Edit Laporan</Link>
      <UstpReportActions id={id} version={report.version} month={month} programName={report.programName} />
    </div>
    <section className="card mt-6 p-5 sm:p-7" aria-labelledby="appsheet-heading">
      <h2 id="appsheet-heading" className="text-lg font-semibold">Pelaporan AppSheet</h2>
      <p className="mt-2 text-sm text-graphite">Buka borang laporan baharu dengan maklumat program, peruntukan dalam ringgit penuh dan pautan dua gambar. Semak jumlah dan kedua-dua gambar sebelum menyimpan dalam AppSheet. Jika gambar tidak terpapar, muat naik secara manual.</p>
      <p className="mt-2 text-sm text-graphite">Gambar menggunakan pautan Drive NEXa. Kekalkan fail asal supaya gambar terus boleh diakses.</p>
      {manualAllocations.length > 0 && <p className="mt-3 text-sm text-red-700">Amaun berikut tidak diisi dalam AppSheet kerana mengandungi sen: {manualAllocations.join("; ")}. Medan tersebut mungkin kekal 0. Tentukan amaun mengikut panduan pelaporan sebelum menyimpan; amaun asal NEXa dikekalkan.</p>}
      {(report.otherAllocation || report.otherSen > 0) && <p className="mt-3 text-sm text-graphite">Lengkapkan peruntukan lain dalam AppSheet: {report.otherAllocation || "Peruntukan lain"} (RM {formatUstpMoney(report.otherSen)}).</p>}
      <a href={buildUstpAppSheetUrl(report)} target="_blank" rel="noopener noreferrer" className="btn-outline-ink mt-4">Buka Borang AppSheet</a>
    </section>
    <dl className="card mt-6 divide-y divide-fog px-5 sm:px-7">
      {fields.map(([label, value]) => <div key={label} className="grid gap-2 py-4 sm:grid-cols-[210px_minmax(0,1fr)]"><dt className="text-sm font-medium text-graphite">{label}</dt><dd className="whitespace-pre-wrap break-words text-sm">{value}</dd></div>)}
    </dl>
    <section className="card mt-6 p-5 sm:p-7"><h2 className="text-lg font-semibold">Gambar program</h2><div className="mt-4 grid gap-5 sm:grid-cols-2">
      {report.photos.map((photo, index) => <figure key={photo.storagePath}><img src={photo.publicUrl} alt={`Gambar program ${index + 1}`} className="h-64 w-full rounded-lg object-contain" /><figcaption className="mt-2 text-sm text-graphite">Gambar {index + 1}</figcaption></figure>)}
    </div></section>
  </>;
}
