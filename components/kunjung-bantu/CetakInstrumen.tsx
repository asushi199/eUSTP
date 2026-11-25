import CopSah from "@/components/kunjung-bantu/CopSah";
import {
  ASPEK,
  RUJUKAN_SURAT,
  SESI_KUNJUNG_BANTU,
  STATUS_LABEL,
  formatPeratus,
  nilaiAuto,
  type DelimaSekolah,
} from "@/lib/kunjung-bantu/instrumen";
import type { RekodKunjungBantu } from "@/lib/kunjung-bantu/queries";

function tarikhPanjang(d: Date | string | null): string {
  if (!d) return "";
  const x = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  return x.toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" });
}

function tarikhCop(d: Date | string | null): string {
  if (!d) return "";
  const x = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  return x
    .toLocaleDateString("ms-MY", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

const th = "border border-ink px-1.5 py-1 text-left font-semibold";
const td = "border border-ink px-1.5 py-1 align-top";

/** Dokumen A4 instrumen Kunjung Bantu (cetak / simpan PDF). */
export default function CetakInstrumen({
  sekolah,
  rekod,
  delima,
}: {
  sekolah: { code: string; name: string };
  rekod: RekodKunjungBantu;
  delima: DelimaSekolah | null;
}) {
  const sah = rekod.status === "DISAHKAN";
  const maklumat: [string, string][] = [
    ["Nama Pengetua / Guru Besar", rekod.namaPgb],
    ["Nama Penolong Kanan Pentadbiran", rekod.namaPkPentadbiran],
    ["Nama Admin DELIMa", rekod.namaAdminDelima],
    ["Kod / Nama Sekolah", `${sekolah.code} — ${sekolah.name}`],
    ["Daerah", "Manjung"],
    ["Tarikh Penilaian", tarikhPanjang(rekod.tarikhPenilaian)],
  ];

  return (
    <article className="mx-auto max-w-[190mm] bg-white text-[10.5px] leading-snug text-ink">
      <header className="text-center">
        <p className="text-[10px] font-semibold tracking-wide text-charcoal">
          UNIT SUMBER DAN TEKNOLOGI PENDIDIKAN · PEJABAT PENDIDIKAN DAERAH MANJUNG
        </p>
        <h1 className="mt-2 text-[14px] font-bold">INSTRUMEN KUNJUNG BANTU</h1>
        <p className="text-[13px] font-bold">PENGURUSAN SUMBER DAN TEKNOLOGI PENDIDIKAN</p>
        <p className="mt-1 text-[10px] text-charcoal">
          Pemerkasaan Pendigitalan DELIMa dalam PdP serta Pengurusan Organisasi Sekolah{" "}
          {SESI_KUNJUNG_BANTU.replace("-", "–")} · Rujukan JPN: {RUJUKAN_SURAT}
        </p>
      </header>

      <table className="mt-4 w-full border-collapse">
        <tbody>
          {maklumat.map(([k, v]) => (
            <tr key={k}>
              <td className="w-[52mm] py-0.5 pr-2 align-top">{k}</td>
              <td className="w-3 py-0.5 align-top">:</td>
              <td className="border-b border-dotted border-steel py-0.5 align-top font-semibold">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3">
        Aspek yang dipantau — tanda (/) di ruang Ya atau Tidak. Lajur <b>Semakan PPD</b> diisi oleh
        pegawai semasa lawatan.
      </p>
      <table className="mt-1 w-full border-collapse">
        <thead className="bg-fog">
          <tr>
            <th className={`${th} w-6 text-center`}>Bil</th>
            <th className={`${th} w-[30mm]`}>Aspek Pemantauan</th>
            <th className={`${th} w-9 text-center`}>No.</th>
            <th className={th}>Item</th>
            <th className={`${th} w-7 text-center`}>Ya</th>
            <th className={`${th} w-9 text-center`}>Tidak</th>
            <th className={`${th} w-[34mm]`}>Catatan</th>
            <th className={`${th} w-[26mm]`}>Semakan PPD</th>
          </tr>
        </thead>
        {ASPEK.map((a) => (
          <tbody key={a.bil} className="break-inside-avoid">
            {a.items.map((it, i) => {
              const j = rekod.jawapan[it.id];
              const s = rekod.semakan[it.id];
              const auto = a.auto ? nilaiAuto(delima, it.id) : null;
              return (
                <tr key={it.id}>
                  {i === 0 ? (
                    <>
                      <td className={`${td} text-center font-semibold`} rowSpan={a.items.length}>
                        {a.bil}
                      </td>
                      <td className={`${td} font-semibold`} rowSpan={a.items.length}>
                        {a.tajuk.toUpperCase()}
                        {a.subtajuk ? (
                          <span className="block font-normal text-charcoal">({a.subtajuk})</span>
                        ) : null}
                      </td>
                    </>
                  ) : null}
                  <td className={`${td} text-center`}>{it.no}</td>
                  <td className={td}>{it.item}</td>
                  {a.auto ? (
                    <td className={`${td} text-center font-semibold`} colSpan={2}>
                      {auto ? formatPeratus(auto.peratus) : "—"}
                    </td>
                  ) : (
                    <>
                      <td className={`${td} text-center font-bold`}>{j?.ya === true ? "/" : ""}</td>
                      <td className={`${td} text-center font-bold`}>{j?.ya === false ? "/" : ""}</td>
                    </>
                  )}
                  <td className={`${td} break-all`}>
                    {a.auto
                      ? auto
                        ? `${auto.aktif.toLocaleString("ms-MY")}/${auto.jumlah.toLocaleString("ms-MY")} aktif`
                        : ""
                      : (j?.catatan ?? "")}
                  </td>
                  <td className={td}>
                    {s?.status === "SAH" ? "Disahkan" : s?.status === "BAIKI" ? "Perlu dibaiki" : ""}
                    {s?.catatan ? <span className="block text-charcoal">{s.catatan}</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
      {delima ? (
        <p className="mt-1 text-[9px] text-charcoal">
          Aspek 2: data d3 DELIMa ({delima.tempoh}){sah ? ", dibekukan semasa pengesahan" : ", terkini"}.
        </p>
      ) : null}

      <section className="mt-4 break-inside-avoid">
        <p className="font-semibold">Isu-isu</p>
        <p className="mt-1 min-h-[12mm] whitespace-pre-wrap border-b border-dotted border-steel">
          {rekod.isu}
        </p>
        <p className="mt-3 font-semibold">Ulasan dan Cadangan Pegawai</p>
        <p className="mt-1 min-h-[12mm] whitespace-pre-wrap border-b border-dotted border-steel">
          {rekod.ulasanPegawai}
        </p>
        <div className="mt-4 flex items-end justify-between gap-6">
          <div className="min-w-[70mm]">
            <p className="font-semibold">Tanda tangan pegawai</p>
            <div className="mt-10 border-b border-ink" />
            <p className="mt-1">{rekod.namaPegawai || "Nama:"}</p>
            <p className="text-charcoal">USTP, PPD Manjung</p>
            <p className="text-charcoal">Tarikh: {tarikhPanjang(rekod.tarikhPenilaian)}</p>
          </div>
          {sah ? (
            <CopSah tarikh={tarikhCop(rekod.disahkanPada)} pegawai={rekod.namaPegawai} />
          ) : (
            <p className="rounded border border-ink px-3 py-2 text-[11px] font-semibold">
              Status: {STATUS_LABEL[rekod.status]} — belum disahkan
            </p>
          )}
        </div>
      </section>

      <footer className="mt-6 border-t border-fog pt-1 text-[8.5px] text-graphite">
        Dijana oleh NEXa Manjung · Rujukan KB-{rekod.id.slice(0, 8).toUpperCase()} · Dihantar sekolah{" "}
        {tarikhPanjang(rekod.tarikhHantar)}
        {sah ? ` · Disahkan ${tarikhPanjang(rekod.disahkanPada)}` : ""}
      </footer>
    </article>
  );
}
