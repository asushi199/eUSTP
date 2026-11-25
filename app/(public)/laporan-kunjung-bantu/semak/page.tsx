import type { Metadata } from "next";
import Link from "next/link";
import StatusLencana from "@/components/kunjung-bantu/StatusLencana";
import DbPerlahan from "@/components/mjkd/DbPerlahan";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { withDbTimeout } from "@/lib/db";
import {
  ACCENT_KUNJUNG_BANTU,
  ITEM_DIISI,
  NAMA_INSTRUMEN,
  kiraYa,
} from "@/lib/kunjung-bantu/instrumen";
import { getRekodByResit, getSekolah } from "@/lib/kunjung-bantu/queries";
import { pautanMuatSemula } from "@/lib/mjkd/ralat-db";

export const metadata: Metadata = {
  title: `Semak — ${NAMA_INSTRUMEN} — NEXa Manjung`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ kod?: string; resit?: string }>;
};

async function muatData(kod: string, resit: string) {
  if (!kod || !resit) return { sekolah: null, rekod: null, error: null as string | null };
  const sekolah = await getSekolah(kod);
  if (!sekolah) return { sekolah: null, rekod: null, error: "Kod sekolah tidak dijumpai." };
  const rekod = await getRekodByResit(kod, resit);
  if (!rekod) {
    return { sekolah, rekod: null, error: "Nombor tiket tidak sepadan atau rekod tidak dijumpai." };
  }
  return { sekolah, rekod, error: null };
}

function tarikh(d: Date | string | null) {
  if (!d) return "—";
  const x = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  return x.toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" });
}

export default async function SemakKunjungBantuPage({ searchParams }: Props) {
  const sp = await searchParams;
  const kod = (sp.kod ?? "").trim().toUpperCase();
  const resit = (sp.resit ?? "").trim().toUpperCase();
  const header = (
    <PageHeader
      eyebrow={NAMA_INSTRUMEN}
      title="Semak / kemaskini / cetak"
      accent={ACCENT_KUNJUNG_BANTU}
      description="Masukkan kod sekolah dan nombor tiket."
    />
  );

  let data: Awaited<ReturnType<typeof muatData>>;
  try {
    data = await withDbTimeout(muatData(kod, resit));
  } catch {
    return (
      <PublicPageShell narrow>
        {header}
        <DbPerlahan href={pautanMuatSemula("/laporan-kunjung-bantu/semak", sp)} />
      </PublicPageShell>
    );
  }
  const { sekolah, rekod, error } = data;
  const qs = `kod=${encodeURIComponent(kod)}&resit=${encodeURIComponent(resit)}`;
  const baiki = rekod
    ? ITEM_DIISI.filter((it) => rekod.semakan[it.id]?.status === "BAIKI")
    : [];

  return (
    <PublicPageShell narrow>
      {header}
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
          <input id="resit" name="resit" className="input font-mono uppercase" required defaultValue={resit} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-ink">
            Semak
          </button>
        </div>
      </form>

      {error ? <p className="mt-4 text-sm text-bloom-deep">{error}</p> : null}

      {rekod && sekolah ? (
        <div className="card mt-6 space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">
                {sekolah.code} — {sekolah.name}
              </p>
              <p className="mt-1 text-sm text-graphite">
                Dihantar {rekod.tarikhHantar.toLocaleString("ms-MY")} ·{" "}
                {kiraYa(rekod.jawapan).ya}/{ITEM_DIISI.length} item Ya
              </p>
            </div>
            <StatusLencana status={rekod.status} />
          </div>

          {rekod.status === "DISAHKAN" ? (
            <p className="rounded-lg border border-fog bg-cloud/60 px-4 py-3 text-sm text-charcoal">
              Disahkan pada {tarikh(rekod.disahkanPada)} oleh {rekod.namaPegawai || "pegawai PPD"}.
              Rekod dikunci. Cetak instrumen untuk salinan bercop pengesahan.
            </p>
          ) : rekod.status === "PERLU_PEMBETULAN" ? (
            <div className="rounded-lg border-2 border-bloom-deep/40 bg-bloom-rose/30 px-4 py-3 text-sm text-charcoal">
              <p className="font-semibold text-bloom-deep">
                PPD meminta pembetulan (lawatan {tarikh(rekod.tarikhPenilaian)})
              </p>
              {baiki.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {baiki.map((it) => (
                    <li key={it.id}>
                      <b>{it.no}</b> {it.item}
                      {rekod.semakan[it.id]?.catatan ? ` — ${rekod.semakan[it.id]?.catatan}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              {rekod.ulasanPegawai ? <p className="mt-2">Ulasan: {rekod.ulasanPegawai}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-graphite">
              Menunggu lawatan dan semakan pegawai USTP PPD Manjung. Anda masih boleh mengemaskini
              jawapan.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {rekod.status !== "DISAHKAN" ? (
              <Link href={`/laporan-kunjung-bantu?${qs}&kemaskini=1`} className="btn-primary">
                Kemaskini jawapan
              </Link>
            ) : null}
            <Link href={`/cetak/kunjung-bantu?${qs}`} target="_blank" className="btn-outline-ink">
              Cetak instrumen
            </Link>
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-sm">
        <Link href="/laporan-kunjung-bantu" className="link-blue">
          ← Kembali ke {NAMA_INSTRUMEN}
        </Link>
      </p>
    </PublicPageShell>
  );
}
