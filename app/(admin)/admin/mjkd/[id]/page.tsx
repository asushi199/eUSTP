import { NAMA_ACARA } from "@/lib/mjkd/acara";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminMaklumBalasPanel, {
  PAPARAN_MAKLUM_BALAS,
  type PaparanMaklumBalas,
} from "@/components/mjkd/AdminMaklumBalasPanel";
import AdminBahanMjkd from "@/components/mjkd/AdminBahanMjkd";
import AdminKehadiranPanel from "@/components/mjkd/AdminKehadiranPanel";
import AdminPerkaraMjkd from "@/components/mjkd/AdminPerkaraMjkd";
import AdminTetapanMjkd from "@/components/mjkd/AdminTetapanMjkd";
import { requireKandunganAccess } from "@/lib/rbac";
import { formatTarikhMs, hariIniKl, isStatusMjkd, labelMesyuarat } from "@/lib/mjkd/enums";
import { JENIS_SEKOLAH, type JenisSekolah } from "@/lib/mjkd/jenis-sekolah";
import { muatDataMaklumBalasAdmin } from "@/lib/mjkd/admin-data";
import { resolveBaseUrl, urlKehadiranAwam } from "@/lib/mjkd/base-url";
import { cadanganSektor, sektorBolehBaca } from "@/lib/mjkd/bahan";
import { hariMesyuarat, lebihAwal, nilaiPilihanHari, pilihanTarikhPembentangan } from "@/lib/mjkd/hari";
import { tafsirHariDipilih } from "@/lib/mjkd/kehadiran";
import {
  getMesyuarat,
  listBahan,
  listKehadiran,
  listMesyuaratLain,
  listSekolahSemua,
  listSektorCadangan,
} from "@/lib/mjkd/queries";
import { qrDataUrl } from "@/lib/mjkd/qr";
import { pautanMuatSemula } from "@/lib/mjkd/ralat-db";
import DbPerlahan from "@/components/mjkd/DbPerlahan";
import { withDbTimeout } from "@/lib/db";

export const dynamic = "force-dynamic";

const TAB = [
  { value: "tetapan", label: "Tetapan" },
  { value: "perkara", label: "Perkara" },
  { value: "maklum-balas", label: "Maklum Balas" },
  { value: "kehadiran", label: "Kehadiran" },
  { value: "bahan", label: "Bahan" },
] as const;
type TabValue = (typeof TAB)[number]["value"];

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    view?: string;
    p?: string;
    hari?: string;
    status?: string;
    jenis?: string;
  }>;
};

/** Data halaman mengikut tab — dipanggil dalam `withDbTimeout`. null = mesyuarat tiada. */
async function muatTab(id: string, tab: TabValue, hariParam: string | undefined) {
  const mesyuarat = await getMesyuarat(id);
  if (!mesyuarat) return null;
  const hari = hariMesyuarat(mesyuarat);

  // Data sekolah/perkara/jawapan hanya diperlukan untuk tab Perkara dan Maklum Balas.
  const data =
    tab === "perkara" || tab === "maklum-balas"
      ? await muatDataMaklumBalasAdmin(mesyuarat.id)
      : null;

  const mesyuaratLain =
    tab === "tetapan"
      ? (await listMesyuaratLain())
          .filter((m) => m.id !== mesyuarat.id && lebihAwal(m, mesyuarat))
          .map((m) => ({ id: m.id, label: labelMesyuarat(m) }))
      : [];

  let kehadiran: {
    sekolah: Awaited<ReturnType<typeof listSekolahSemua>>;
    rekod: Awaited<ReturnType<typeof listKehadiran>>;
    url: string;
    qr: string;
    hariDipilih: string | null;
  } | null = null;
  if (tab === "kehadiran") {
    const url = await urlKehadiranAwam();
    const sekolah = await listSekolahSemua();
    const rekod = await listKehadiran(mesyuarat.id);
    kehadiran = {
      sekolah,
      rekod,
      url,
      qr: await qrDataUrl(url),
      hariDipilih: tafsirHariDipilih(hariParam, hari, hariIniKl()),
    };
  }

  let bahanData: {
    senarai: Awaited<ReturnType<typeof listBahan>>;
    cadangan: string[];
    uploadUrl: string;
  } | null = null;
  if (tab === "bahan") {
    const senarai = await listBahan(mesyuarat.id);
    const sektor = await listSektorCadangan();
    const baseUrl = await resolveBaseUrl();
    bahanData = {
      senarai,
      cadangan: cadanganSektor(sektor.pegawai.map(sektorBolehBaca), sektor.bahan),
      uploadUrl: `${baseUrl}/laporan-mjkd/bahan/muat-naik`,
    };
  }

  return { mesyuarat, hari, data, mesyuaratLain, kehadiran, bahanData };
}

export default async function AdminMjkdDetailPage({ params, searchParams }: Props) {
  await requireKandunganAccess();
  const { id } = await params;
  const sp = await searchParams;
  const tab: TabValue = TAB.some((t) => t.value === sp.tab) ? (sp.tab as TabValue) : "tetapan";
  const paparan: PaparanMaklumBalas = PAPARAN_MAKLUM_BALAS.some((v) => v.value === sp.view)
    ? (sp.view as PaparanMaklumBalas)
    : "kemajuan";
  const status = sp.status && isStatusMjkd(sp.status) ? sp.status : "";
  const jenis: JenisSekolah | "" =
    sp.jenis && (JENIS_SEKOLAH as readonly string[]).includes(sp.jenis)
      ? (sp.jenis as JenisSekolah)
      : "";

  // Semua query dalam satu had masa, BERURUTAN (kolam serverless 3 sambungan): soket pooler
  // yang mati tidak lagi menggantung tab sehingga 300 s — paparkan notis + muat semula.
  let dimuat: Awaited<ReturnType<typeof muatTab>>;
  try {
    dimuat = await withDbTimeout(muatTab(id, tab, sp.hari), 10_000);
  } catch {
    return (
      <>
        <p className="text-sm text-graphite">
          <Link href="/admin/pelaporan" className="hover:text-ink">
            ← CoE Reports
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{NAMA_ACARA}</h1>
        <DbPerlahan href={pautanMuatSemula(`/admin/mjkd/${id}`, sp)} />
      </>
    );
  }
  if (!dimuat) notFound();
  const { mesyuarat, hari, data, mesyuaratLain, kehadiran, bahanData } = dimuat;

  return (
    <>
      <p className="text-sm text-graphite">
        <Link href="/admin/pelaporan" className="hover:text-ink">
          ← CoE Reports
        </Link>
        <span className="mx-2 text-steel">·</span>
        <Link href="/admin/mjkd/pegawai" className="hover:text-ink">
          Senarai pegawai PPD
        </Link>
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {NAMA_ACARA}
          </h1>
          <p className="mt-1 text-sm text-graphite">
            {formatTarikhMs(mesyuarat.tarikh)}
            {mesyuarat.tarikhTamat ? ` – ${formatTarikhMs(mesyuarat.tarikhTamat)}` : ""}
            {mesyuarat.tempat ? ` · ${mesyuarat.tempat}` : ""}
          </p>
        </div>
        <Link href={`/admin/mjkd/${mesyuarat.id}/pembentangan`} className="btn-primary">
          Mod Pembentangan
        </Link>
      </div>

      <nav aria-label="Bahagian mesyuarat" className="mt-6 flex flex-wrap gap-2">
        {TAB.map((t) => (
          <Link
            key={t.value}
            href={`/admin/mjkd/${mesyuarat.id}?tab=${t.value}`}
            className={tab === t.value ? "btn-ink btn-sm" : "btn-outline-ink btn-sm"}
            aria-current={tab === t.value ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "tetapan" ? (
          <AdminTetapanMjkd
            mesyuaratLain={mesyuaratLain}
            mesyuarat={{
              id: mesyuarat.id,
              bil: mesyuarat.bil,
              tahun: mesyuarat.tahun,
              tarikh: mesyuarat.tarikh,
              tarikhTamat: mesyuarat.tarikhTamat,
              mesyuaratSebelumId: mesyuarat.mesyuaratSebelumId,
              tempat: mesyuarat.tempat,
              minitUrl: mesyuarat.minitUrl,
              maklumBalasDibuka: mesyuarat.maklumBalasDibuka,
              tarikhTutupMaklumBalas: mesyuarat.tarikhTutupMaklumBalas,
            }}
          />
        ) : null}

        {tab === "perkara" && data ? (
          <AdminPerkaraMjkd
            mesyuaratId={mesyuarat.id}
            sekolah={data.sekolah.map((s) => ({ code: s.code, name: s.name }))}
            perkara={data.perkara.map((p) => ({
              id: p.id,
              para: p.para,
              mukaSurat: p.mukaSurat,
              perkara: p.perkara,
              tindakan: p.tindakan,
              panduan: p.panduan,
              sasaran: p.sasaran,
              sekolahKhusus: p.sekolahKhusus,
              aktif: p.aktif,
              bilJawapan: data.items.filter((it) => it.perkaraId === p.id).length,
            }))}
          />
        ) : null}

        {tab === "kehadiran" && kehadiran ? (
          <AdminKehadiranPanel
            mesyuaratId={mesyuarat.id}
            kehadiranDibuka={mesyuarat.kehadiranDibuka}
            sekolah={kehadiran.sekolah}
            rekod={kehadiran.rekod}
            url={kehadiran.url}
            qr={kehadiran.qr}
            namaFailQr={`QR-Kehadiran-MJKD-Bil${mesyuarat.bil}-${mesyuarat.tahun}.png`}
            hari={hari}
            hariDipilih={kehadiran.hariDipilih}
          />
        ) : null}

        {tab === "bahan" && bahanData ? (
          <AdminBahanMjkd
            mesyuaratId={mesyuarat.id}
            bahanDibuka={mesyuarat.bahanDibuka}
            kod={mesyuarat.kodMuatNaikBahan}
            uploadUrl={bahanData.uploadUrl}
            pilihanHari={pilihanTarikhPembentangan(hari).map((p) => ({
              label: p.label,
              nilai: nilaiPilihanHari(p.hari),
            }))}
            cadanganSektor={bahanData.cadangan}
            bahan={bahanData.senarai.map((b) => ({
              id: b.id,
              sektorUnit: b.sektorUnit,
              tajuk: b.tajuk,
              namaPembentang: b.namaPembentang,
              hari: b.hari,
              jenis: b.jenis,
              url: b.url,
              storagePath: b.storagePath,
              dimuatNaikOleh: b.dimuatNaikOleh,
              createdAt: b.createdAt.toISOString(),
            }))}
          />
        ) : null}

        {tab === "maklum-balas" && data ? (
          <AdminMaklumBalasPanel
            mesyuaratId={mesyuarat.id}
            data={data}
            paparan={paparan}
            perkaraId={sp.p ?? ""}
            status={status}
            jenis={jenis}
          />
        ) : null}
      </div>
    </>
  );
}
