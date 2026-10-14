import type { Metadata } from "next";
import Link from "next/link";
import DbPerlahan from "@/components/mjkd/DbPerlahan";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { withDbTimeout } from "@/lib/db";
import {
  STATUS_MJKD_LABEL,
  isStatusMjkd,
  maklumBalasTerbuka,
} from "@/lib/mjkd/enums";
import {
  getMaklumBalasByReceipt,
  getMesyuaratAwamTerkini,
  getSchoolByCode,
  listPerkara,
} from "@/lib/mjkd/queries";
import { MINIT_RUJUKAN } from "@/lib/mjkd/acara";
import { pautanMuatSemula } from "@/lib/mjkd/ralat-db";
import { perkaraUntukSekolah } from "@/lib/mjkd/sasaran";

export const metadata: Metadata = {
  title: "Semak Maklum Balas — MJKD 2026 — NEXa Manjung",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ kod?: string; resit?: string }>;
};

/** Muat BERURUTAN dalam satu timeout. */
async function muatData(kod: string, resit: string) {
  const mesyuarat = await getMesyuaratAwamTerkini();

  let record: Awaited<ReturnType<typeof getMaklumBalasByReceipt>> = null;
  let school: Awaited<ReturnType<typeof getSchoolByCode>> | null = null;
  let perkaraSekolah: Awaited<ReturnType<typeof listPerkara>> = [];
  let error: string | null = null;

  if (mesyuarat && kod && resit) {
    school = await getSchoolByCode(kod);
    if (!school) {
      error = "Kod sekolah tidak dijumpai.";
    } else {
      record = await getMaklumBalasByReceipt(mesyuarat.id, kod, resit);
      if (!record) {
        error = "Nombor tiket tidak sepadan atau rekod tidak dijumpai.";
      } else {
        perkaraSekolah = perkaraUntukSekolah(
          await listPerkara(mesyuarat.id, { aktifSahaja: true }),
          school,
        );
      }
    }
  }
  return { mesyuarat, record, school, perkaraSekolah, error };
}

export default async function SemakMaklumBalasMjkdPage({ searchParams }: Props) {
  const sp = await searchParams;
  const kod = (sp.kod ?? "").trim().toUpperCase();
  const resit = (sp.resit ?? "").trim().toUpperCase();

  let data: Awaited<ReturnType<typeof muatData>>;
  try {
    data = await withDbTimeout(muatData(kod, resit));
  } catch {
    return (
      <PublicPageShell narrow>
        <PageHeader
          eyebrow="Pelaporan"
          title="Semak / kemaskini maklum balas MJKD 2026"
          accent="#0E7490"
          description="Masukkan kod sekolah dan nombor tiket."
        />
        <DbPerlahan href={pautanMuatSemula("/laporan-mjkd/semak", { kod: sp.kod, resit: sp.resit })} />
      </PublicPageShell>
    );
  }
  const { mesyuarat, record, school, perkaraSekolah, error } = data;

  const statusMengikutPerkara = new Map(record?.items.map((it) => [it.perkaraId, it.status]));
  const boleh = mesyuarat ? maklumBalasTerbuka(mesyuarat) : false;

  return (
    <PublicPageShell narrow>
      <PageHeader
        eyebrow="Pelaporan"
        title="Semak / kemaskini maklum balas MJKD 2026"
        accent="#0E7490"
        description={
          mesyuarat
            ? `Maklum balas minit ${MINIT_RUJUKAN.label}. Masukkan kod sekolah dan nombor tiket.`
            : "Masukkan kod sekolah dan nombor tiket."
        }
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
            placeholder="Contoh: ABA1001"
          />
        </div>
        <div>
          <label className="label" htmlFor="resit">
            Nombor tiket
          </label>
          <input
            id="resit"
            name="resit"
            className="input font-mono uppercase"
            required
            defaultValue={resit}
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-ink">
            Semak
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-bloom-deep">{error}</p>}

      {record && school && (
        <div className="card mt-6 space-y-4 p-6">
          <div>
            <p className="font-semibold">
              {school.code} — {school.name}
            </p>
            <p className="mt-1 text-sm text-graphite">
              {record.namaPengisi} · {record.jawatanPengisi} · dihantar{" "}
              {new Date(record.tarikhHantar).toLocaleString("ms-MY")}
            </p>
          </div>
          <ul className="divide-y divide-fog text-sm">
            {perkaraSekolah.map((p) => {
              const status = statusMengikutPerkara.get(p.id);
              return (
                <li key={p.id} className="flex items-baseline justify-between gap-4 py-2">
                  <span>
                    Para {p.para}
                    {p.mukaSurat ? ` · m/s ${p.mukaSurat}` : ""}
                  </span>
                  <span className="status-badge">
                    {status && isStatusMjkd(status) ? STATUS_MJKD_LABEL[status] : "Belum diisi"}
                  </span>
                </li>
              );
            })}
          </ul>
          {boleh ? (
            <Link
              href={`/laporan-mjkd?kod=${encodeURIComponent(kod)}&resit=${encodeURIComponent(resit)}&kemaskini=1`}
              className="btn-primary inline-flex"
            >
              Kemaskini maklum balas
            </Link>
          ) : (
            <p className="text-sm text-graphite">Maklum balas ditutup — tidak boleh dikemas kini.</p>
          )}
        </div>
      )}

      <p className="mt-6 text-sm">
        <Link href="/laporan-mjkd" className="link-blue">
          ← Kembali ke mesyuarat
        </Link>
      </p>
    </PublicPageShell>
  );
}
