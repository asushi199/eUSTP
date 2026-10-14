import Link from "next/link";
import {
  KehadiranSuis,
  PadamKehadiranButton,
  TambahKehadiranForm,
} from "@/components/mjkd/AdminKehadiranKawalan";
import { labelHariPendek } from "@/lib/mjkd/hari";
import {
  isJenisKehadiran,
  JENIS_KEHADIRAN_LABEL,
  kiraKehadiran,
  kodSekolahHadir,
  tapisRekodHari,
} from "@/lib/mjkd/kehadiran";
import { kumpulMengikutZon } from "@/lib/mjkd/ringkasan";
import type { KehadiranRow } from "@/lib/mjkd/queries";

type Props = {
  mesyuaratId: string;
  kehadiranDibuka: boolean;
  sekolah: { code: string; name: string; zone: string }[];
  rekod: KehadiranRow[];
  url: string;
  qr: string;
  namaFailQr: string;
  /** Hari mesyuarat (YYYY-MM-DD) dan hari dipilih (null = semua hari). */
  hari: string[];
  hariDipilih: string | null;
};

function Kiraan({ label, nilai }: { label: string; nilai: string | number }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-graphite">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{nilai}</p>
    </div>
  );
}

export default function AdminKehadiranPanel({
  mesyuaratId,
  kehadiranDibuka,
  sekolah,
  rekod,
  url,
  qr,
  namaFailQr,
  hari,
  hariDipilih,
}: Props) {
  const rekodHari = tapisRekodHari(rekod, hariDipilih);
  const kiraan = kiraKehadiran(
    rekodHari,
    sekolah.map((s) => s.code),
  );
  const hadir = kodSekolahHadir(rekodHari);
  const belumHadir = kumpulMengikutZon(sekolah.filter((s) => !hadir.has(s.code)));
  const jumlahBelum = sekolah.length - kiraan.sekolahHadir;

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="shrink-0">
            <img
              src={qr}
              alt="Kod QR halaman kehadiran"
              width={240}
              height={240}
              className="rounded-lg border hairline bg-white"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <KehadiranSuis mesyuaratId={mesyuaratId} dibuka={kehadiranDibuka} />
            <p className="break-all text-sm text-graphite">
              Pautan kehadiran: <span className="font-mono text-ink">{url}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={qr} download={namaFailQr} className="btn-outline-ink btn-sm">
                Muat Turun PNG
              </a>
              <Link
                href={`/admin/mjkd/${mesyuaratId}/qr`}
                target="_blank"
                className="btn-ink btn-sm"
              >
                Paparan penuh QR
              </Link>
              <a href={`/admin/mjkd/${mesyuaratId}/kehadiran-export`} className="btn-outline-ink btn-sm">
                Eksport CSV
              </a>
              <Link href="/admin/mjkd/pegawai" className="btn-outline-ink btn-sm">
                Urus senarai pegawai PPD
              </Link>
            </div>
            <p className="text-xs text-graphite">
              Sahkan kehadiran awam hanya diterima apabila kehadiran dibuka.
            </p>
          </div>
        </div>
      </section>

      <nav aria-label="Pilih hari" className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-graphite">Hari</span>
        {hari.map((h, i) => (
          <Link
            key={h}
            href={`/admin/mjkd/${mesyuaratId}?tab=kehadiran&hari=${h}`}
            className={hariDipilih === h ? "btn-ink btn-sm" : "btn-outline-ink btn-sm"}
            aria-current={hariDipilih === h ? "page" : undefined}
          >
            Hari {i + 1} · {labelHariPendek(h)}
          </Link>
        ))}
        {hari.length > 1 ? (
          <Link
            href={`/admin/mjkd/${mesyuaratId}?tab=kehadiran&hari=semua`}
            className={hariDipilih === null ? "btn-ink btn-sm" : "btn-outline-ink btn-sm"}
            aria-current={hariDipilih === null ? "page" : undefined}
          >
            Semua
          </Link>
        ) : null}
      </nav>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kiraan label={hariDipilih ? "Sekolah hadir (hari ini dipilih)" : "Sekolah hadir (semua hari)"} nilai={`${kiraan.sekolahHadir} / ${kiraan.sekolahJumlah}`} />
        <Kiraan label="PGB" nilai={kiraan.pgb} />
        <Kiraan label="Wakil sekolah" nilai={kiraan.wakil} />
        <Kiraan label="Pegawai PPD" nilai={kiraan.pegawai} />
        <Kiraan label="Lain-lain" nilai={kiraan.lain} />
        <Kiraan label="Jumlah hadir" nilai={kiraan.jumlah} />
      </section>

      <section>
        <h3 className="text-lg font-semibold text-ink">
          Sekolah belum hadir ({jumlahBelum}){hariDipilih ? ` — ${labelHariPendek(hariDipilih)}` : ""}
        </h3>
        {belumHadir.length === 0 ? (
          <p className="card mt-3 p-5 text-sm text-graphite">Semua sekolah telah hadir.</p>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {belumHadir.map((g) => (
              <div key={g.zon} className="card p-5">
                <p className="font-semibold text-ink">
                  {g.zon} <span className="text-graphite">({g.sekolah.length})</span>
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {g.sekolah.map((s) => (
                    <li key={s.code}>
                      <span className="font-mono text-xs text-graphite">{s.code}</span> {s.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-ink">Senarai hadir ({rekodHari.length})</h3>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
                <th className="px-4 py-3 font-semibold">Hari</th>
                <th className="px-4 py-3 font-semibold">Masa</th>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">Jawatan</th>
                <th className="px-4 py-3 font-semibold">Organisasi</th>
                <th className="px-4 py-3 font-semibold">Jenis</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rekodHari.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-graphite">
                    Belum ada kehadiran direkodkan.
                  </td>
                </tr>
              ) : (
                rekodHari.map((r) => (
                  <tr key={r.id} className="border-b hairline last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-xs">{labelHariPendek(r.tarikh)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      {r.createdAt.toLocaleTimeString("ms-MY", {
                        timeZone: "Asia/Kuala_Lumpur",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.nama}</td>
                    <td className="px-4 py-3">{r.jawatan}</td>
                    <td className="px-4 py-3">{r.organisasi}</td>
                    <td className="px-4 py-3">
                      <span className="status-badge">
                        {isJenisKehadiran(r.jenis) ? JENIS_KEHADIRAN_LABEL[r.jenis] : r.jenis}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <PadamKehadiranButton id={r.id} nama={r.nama} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-ink">Tambah kehadiran secara manual</h3>
        <div className="mt-3">
          <TambahKehadiranForm
            mesyuaratId={mesyuaratId}
            hari={hari}
            hariLalai={hariDipilih ?? hari[0] ?? ""}
            sekolah={sekolah.map((s) => ({ code: s.code, name: s.name }))}
          />
        </div>
      </section>
    </div>
  );
}
