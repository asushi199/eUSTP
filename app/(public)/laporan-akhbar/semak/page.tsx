import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import {
  getLaporanAkhbarByReceipt,
  getSchoolByCode,
} from "@/lib/laporan-akhbar/queries";

export const metadata: Metadata = {
  title: "Semak Laporan Akhbar — NEXa Manjung",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ kod?: string; resit?: string }>;
};

export default async function SemakLaporanAkhbarPage({ searchParams }: Props) {
  const sp = await searchParams;
  const kod = (sp.kod ?? "").trim().toUpperCase();
  const resit = (sp.resit ?? "").trim().toUpperCase();

  let record = null;
  let school = null;
  let error: string | null = null;

  if (kod && resit) {
    school = await getSchoolByCode(kod);
    if (!school) {
      error = "Kod sekolah tidak dijumpai.";
    } else {
      record = await getLaporanAkhbarByReceipt(kod, resit);
      if (!record) error = "Resit tidak sepadan atau rekod tidak dijumpai.";
    }
  }

  return (
    <PublicPageShell narrow>
      <PageHeader
        eyebrow="Pelaporan"
        title="Semak / kemaskini Laporan Akhbar"
        accent="#024ad8"
        description="Masukkan kod sekolah dan nombor resit."
      />

      <form className="card mt-8 grid gap-4 p-6 sm:grid-cols-2" method="get">
        <div>
          <label className="label" htmlFor="kod">
            Kod sekolah
          </label>
          <input
            id="kod"
            name="kod"
            className="input uppercase"
            required
            defaultValue={kod}
            placeholder="Contoh: ABA1234"
          />
        </div>
        <div>
          <label className="label" htmlFor="resit">
            Nombor resit
          </label>
          <input
            id="resit"
            name="resit"
            className="input uppercase font-mono"
            required
            defaultValue={resit}
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary">
            Semak
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-4 text-sm text-bloom-deep">{error}</p>
      )}

      {record && school && (
        <div className="card mt-6 space-y-3 p-6">
          <p className="font-semibold">
            {school.code} — {school.name}
          </p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-graphite">Status sekolah</dt>
              <dd className="font-medium">{record.statusSekolah}</dd>
            </div>
            <div>
              <dt className="text-graphite">Tarikh hantar</dt>
              <dd>
                {record.tarikhHantar
                  ? new Date(record.tarikhHantar).toLocaleString("ms-MY")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-graphite">Semakan PPD lengkap</dt>
              <dd>{record.semakanLengkap ?? "Belum disemak"}</dd>
            </div>
            <div>
              <dt className="text-graphite">Disahkan</dt>
              <dd>{record.disahkan ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-graphite">Perlu pembetulan</dt>
              <dd>{record.perluPembetulan ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-graphite">Baki (RM)</dt>
              <dd>
                {record.bakiPeruntukanRm.toLocaleString("ms-MY", {
                  minimumFractionDigits: 2,
                })}
              </dd>
            </div>
          </dl>
          <Link
            href={`/laporan-akhbar?kod=${encodeURIComponent(kod)}&kemaskini=1`}
            className="btn-primary inline-flex"
          >
            Kemaskini borang
          </Link>
          <p className="text-xs text-graphite">
            Pada halaman kemaskini, masukkan semula nombor resit yang sama.
          </p>
        </div>
      )}

      <p className="mt-6 text-sm">
        <Link href="/laporan-akhbar" className="link-blue">
          ← Kembali ke borang
        </Link>
      </p>
    </PublicPageShell>
  );
}
