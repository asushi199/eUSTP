import Link from "next/link";
import { notFound } from "next/navigation";
import MinitCuraiActions from "@/components/minit-curai/MinitCuraiActions";
import { getMinitCurai } from "@/lib/minit-curai/queries";
import { formatMinitDate } from "@/lib/minit-curai/options";

export const metadata = { title: "Minit Curai" };

export default async function MinitCuraiDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const report = await getMinitCurai(id);
  if (!report) notFound();
  const { saved } = await searchParams;
  const month = String(report.meetingDate).slice(0, 7);
  const kaedah = [
    report.kaedah.filter((item) => item !== "Lain-lain").join(", "),
    report.kaedahLain ? `Lain-lain: ${report.kaedahLain}` : "",
  ].filter(Boolean).join(" · ") || "—";
  const fields = [
    ["Nama pegawai / pelapor", report.reporterName],
    ["Jawatan / gred", report.reporterTitle],
    ["Unit / sektor", report.unitSektor],
    ["Anjuran", report.anjuran],
    ["Tarikh / masa", `${formatMinitDate(report.meetingDate)} · ${report.meetingTime}`],
    ["Tempat / platform", report.tempat],
    ["Pengerusi / pegawai yang menyampaikan", report.chairperson],
    ["Rujukan / no. fail", report.rujukanFail || "—"],
    ["Lampiran / bahan diterima", report.lampiran || "—"],
    ["Tarikh sasaran tindakan selesai", report.targetDate ? formatMinitDate(report.targetDate) : "—"],
    ["Disebarkan kepada", report.disebarkanKepada],
    ["Tarikh curai kepada staf", formatMinitDate(report.tarikhCurai)],
    ["Kaedah penyebaran", kaedah],
    ["Disediakan oleh", `${report.preparedByName}\n${report.preparedByTitle}\n${formatMinitDate(report.preparedAt)}`],
    ["Disemak / disahkan oleh", report.reviewedByName
      ? `${report.reviewedByName}\n${report.reviewedByTitle}\n${report.reviewedAt ? formatMinitDate(report.reviewedAt) : "—"}`
      : "—"],
  ];

  return (
    <>
      <Link href={`/admin/minit-curai?month=${month}`} className="text-sm text-graphite hover:text-ink">← Minit Curai</Link>
      <h1 className="mt-3 break-words text-2xl font-semibold">{report.tajuk}</h1>
      {saved === "1" && <p role="status" className="mt-3 text-sm text-graphite">Minit curai berjaya disimpan.</p>}
      <div className="mt-5 flex flex-wrap items-start gap-3">
        <Link href={`/admin/minit-curai/${id}/edit`} className="btn-primary">Edit Minit</Link>
        <MinitCuraiActions id={id} version={report.version} month={month} tajuk={report.tajuk} />
      </div>
      <dl className="card mt-6 divide-y divide-fog px-5 sm:px-7">
        {fields.slice(0, 8).map(([label, value]) => (
          <div key={label} className="grid gap-2 py-4 sm:grid-cols-[210px_minmax(0,1fr)]">
            <dt className="text-sm font-medium text-graphite">{label}</dt>
            <dd className="whitespace-pre-wrap break-words text-sm">{value}</dd>
          </div>
        ))}
      </dl>
      <section className="card mt-6 p-5 sm:p-7">
        <h2 className="text-lg font-semibold">B. Kandungan</h2>
        <div className="mt-4 space-y-4">
          {report.items.map((item, index) => (
            <article key={`${item.perkara}-${index}`} className="rounded-lg border hairline p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-graphite">Perkara {index + 1}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{item.perkara}</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div><dt className="text-graphite">Keputusan / penjelasan</dt><dd className="mt-0.5 whitespace-pre-wrap">{item.keputusan}</dd></div>
                <div><dt className="text-graphite">Tindakan susulan</dt><dd className="mt-0.5 whitespace-pre-wrap">{item.tindakan}</dd></div>
                <div><dt className="text-graphite">Pegawai / unit bertanggungjawab</dt><dd className="mt-0.5">{item.pegawai}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>
      <dl className="card mt-6 divide-y divide-fog px-5 sm:px-7">
        {fields.slice(8).map(([label, value]) => (
          <div key={label} className="grid gap-2 py-4 sm:grid-cols-[210px_minmax(0,1fr)]">
            <dt className="text-sm font-medium text-graphite">{label}</dt>
            <dd className="whitespace-pre-wrap break-words text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
