import Link from "next/link";
import PilihBacaKawalan from "@/components/mjkd/PilihBacaKawalan";
import TabelAnalisisMjkd from "@/components/mjkd/TabelAnalisisMjkd";
import { binaAnalisis } from "@/lib/mjkd/pembentangan";
import {
  STATUS_MJKD,
  STATUS_MJKD_LABEL,
  STATUS_MJKD_SINGKAT,
  STATUS_MJKD_WARNA,
  isStatusMjkd,
  type StatusMjkd,
} from "@/lib/mjkd/enums";
import {
  JENIS_SEKOLAH,
  labelJenisSekolah,
  type JenisSekolah,
} from "@/lib/mjkd/jenis-sekolah";
import { hitungKemajuan, kiraStatus } from "@/lib/mjkd/ringkasan";
import { perkaraUntukSekolah } from "@/lib/mjkd/sasaran";
import { kunciItem, type DataMaklumBalasAdmin } from "@/lib/mjkd/admin-data";

export type PaparanMaklumBalas = "kemajuan" | "matriks" | "perkara";

export const PAPARAN_MAKLUM_BALAS: { value: PaparanMaklumBalas; label: string }[] = [
  { value: "kemajuan", label: "Kemajuan" },
  { value: "matriks", label: "Matriks sekolah × perkara" },
  { value: "perkara", label: "Mengikut perkara" },
];

type Props = {
  mesyuaratId: string;
  data: DataMaklumBalasAdmin;
  paparan: PaparanMaklumBalas;
  perkaraId: string;
  status: StatusMjkd | "";
  jenis: JenisSekolah | "";
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="status-badge">
      {isStatusMjkd(status) ? STATUS_MJKD_LABEL[status] : status}
    </span>
  );
}

function Penapis({
  mesyuaratId,
  paparan,
  perkaraId,
  status,
  jenis,
  tunjukStatus = true,
}: Omit<Props, "data"> & { tunjukStatus?: boolean }) {
  const href = (patch: { status?: string; jenis?: string }) => {
    const q = new URLSearchParams({ tab: "maklum-balas", view: paparan });
    if (paparan === "perkara" && perkaraId) q.set("p", perkaraId);
    const s = patch.status ?? status;
    const j = patch.jenis ?? jenis;
    if (s) q.set("status", s);
    if (j) q.set("jenis", j);
    return `/admin/mjkd/${mesyuaratId}?${q.toString()}`;
  };
  return (
    <div className="space-y-3">
      {tunjukStatus ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-graphite">Status</span>
          <Link
            href={href({ status: "" })}
            className={!status ? "btn-ink btn-sm" : "btn-outline-ink btn-sm"}
          >
            Semua
          </Link>
          {STATUS_MJKD.map((s) => (
            <Link
              key={s}
              href={href({ status: s })}
              className={status === s ? "btn-ink btn-sm" : "btn-outline-ink btn-sm"}
            >
              {STATUS_MJKD_LABEL[s]}
            </Link>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-graphite">
          Jenis sekolah
        </span>
        <Link
          href={href({ jenis: "" })}
          className={!jenis ? "btn-ink btn-sm" : "btn-outline-ink btn-sm"}
        >
          Semua
        </Link>
        {JENIS_SEKOLAH.map((j) => (
          <Link
            key={j}
            href={href({ jenis: j })}
            className={jenis === j ? "btn-ink btn-sm" : "btn-outline-ink btn-sm"}
          >
            {labelJenisSekolah(j)}
          </Link>
        ))}
      </div>
    </div>
  );
}

function sekolahUrl(mesyuaratId: string, kod: string) {
  return `/admin/mjkd/${mesyuaratId}/sekolah/${encodeURIComponent(kod)}`;
}

/* ------------------------------- Kemajuan ------------------------------- */

function PaparanKemajuan({ mesyuaratId, data }: { mesyuaratId: string; data: DataMaklumBalasAdmin }) {
  const aktif = data.perkara.filter((p) => p.aktif);
  const kemajuan = hitungKemajuan(data.sekolah, aktif, new Set(data.mbMengikutKod.keys()));
  const jumlahStatus = kiraStatus(data.items);
  const dipilih = data.items.filter((it) => it.dipilih).length;
  const tidakDikenali = data.sekolah.filter((s) => s.jenis === null);
  const peratus = kemajuan.dijangka > 0 ? Math.round((kemajuan.dihantar / kemajuan.dijangka) * 100) : 0;
  const sudahHantar = [...data.maklumBalas].sort((a, b) =>
    b.tarikhHantar.getTime() - a.tarikhHantar.getTime(),
  );
  const sekolahMengikutKod = new Map(data.sekolah.map((s) => [s.code, s]));

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <p className="text-sm text-graphite">Sekolah menghantar maklum balas</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">
          {kemajuan.dihantar}
          <span className="text-xl text-graphite"> / {kemajuan.dijangka}</span>
        </p>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-fog"
          role="progressbar"
          aria-valuenow={peratus}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Kemajuan penghantaran"
        >
          <div className="h-full bg-ink" style={{ width: `${peratus}%` }} />
        </div>
        <p className="mt-3 text-sm text-graphite">
          {kemajuan.belum.length} belum hantar · {dipilih} jawapan dipilih untuk dibaca
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {STATUS_MJKD.map((s) => (
            <li key={s} className="status-badge">
              {STATUS_MJKD_LABEL[s]}: {jumlahStatus[s]}
            </li>
          ))}
        </ul>
      </div>

      {tidakDikenali.length > 0 ? (
        <p className="rounded-md border border-bloom-deep/30 bg-white px-4 py-3 text-sm text-bloom-deep">
          Jenis sekolah tidak dikenali untuk {tidakDikenali.map((s) => `${s.code} ${s.name}`).join(", ")}
          . Sekolah ini hanya menerima perkara &quot;Semua sekolah&quot; dan perkara khusus.
        </p>
      ) : null}

      <section>
        <h3 className="text-lg font-semibold text-ink">Belum menghantar</h3>
        {kemajuan.belumMengikutZon.length === 0 ? (
          <p className="card mt-3 p-5 text-sm text-graphite">Semua sekolah telah menghantar.</p>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {kemajuan.belumMengikutZon.map((g) => (
              <div key={g.zon} className="card p-5">
                <p className="font-semibold text-ink">
                  {g.zon} <span className="text-graphite">({g.sekolah.length})</span>
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {g.sekolah.map((s) => (
                    <li key={s.code} className="flex items-baseline justify-between gap-3">
                      <span>
                        <span className="font-mono text-xs text-graphite">{s.code}</span> {s.name}
                      </span>
                      <Link href={sekolahUrl(mesyuaratId, s.code)} className="link-blue shrink-0 text-xs">
                        Isi
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-ink">Sudah menghantar</h3>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
                <th className="px-4 py-3 font-semibold">Sekolah</th>
                <th className="px-4 py-3 font-semibold">Pengisi</th>
                <th className="px-4 py-3 font-semibold">Dihantar</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sudahHantar.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-graphite">
                    Belum ada maklum balas.
                  </td>
                </tr>
              ) : (
                sudahHantar.map((mb) => (
                  <tr key={mb.id} className="border-b hairline last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-graphite">{mb.schoolCode}</span>{" "}
                      {sekolahMengikutKod.get(mb.schoolCode)?.name ?? ""}
                    </td>
                    <td className="px-4 py-3">
                      {mb.namaPengisi}
                      <span className="block text-xs text-graphite">{mb.jawatanPengisi}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {mb.tarikhHantar.toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={sekolahUrl(mesyuaratId, mb.schoolCode)} className="link-blue">
                        Buka
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------- Matriks -------------------------------- */

function PaparanMatriks({
  mesyuaratId,
  data,
  status,
  jenis,
  ...tapis
}: Props) {
  const aktif = data.perkara.filter((p) => p.aktif);
  const baris = data.sekolah
    .filter((s) => !jenis || s.jenis === jenis)
    .map((s) => ({ sekolah: s, terpakai: new Set(perkaraUntukSekolah(aktif, s).map((p) => p.id)) }))
    .filter((b) => b.terpakai.size > 0)
    .map((b) => {
      const mb = data.mbMengikutKod.get(b.sekolah.code) ?? null;
      const sel = aktif.map((p) => {
        if (!b.terpakai.has(p.id)) return { jenis: "tidak-terpakai" as const };
        if (!mb) return { jenis: "belum-hantar" as const };
        const it = data.itemMengikutKunci.get(kunciItem(mb.id, p.id));
        return it ? { jenis: "jawab" as const, status: it.status } : { jenis: "belum-hantar" as const };
      });
      return { ...b, sel };
    })
    .filter(
      (b) => !status || b.sel.some((c) => c.jenis === "jawab" && c.status === status),
    );

  return (
    <div className="space-y-4">
      <Penapis mesyuaratId={mesyuaratId} {...tapis} status={status} jenis={jenis} />
      <ul className="flex flex-wrap gap-3 text-xs text-graphite">
        {STATUS_MJKD.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-semibold ${STATUS_MJKD_WARNA[s]}`}
            >
              {STATUS_MJKD_SINGKAT[s]}
            </span>
            {STATUS_MJKD_LABEL[s]}
          </li>
        ))}
        <li>· belum hantar</li>
        <li>– tidak terpakai</li>
      </ul>
      <div className="card overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs text-graphite">
              <th className="sticky left-0 z-10 bg-white px-4 py-3 font-semibold">Sekolah</th>
              {aktif.map((p) => (
                <th
                  key={p.id}
                  className="px-2 py-3 text-center font-semibold"
                  title={p.perkara}
                  scope="col"
                >
                  {p.para}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {baris.length === 0 ? (
              <tr>
                <td colSpan={aktif.length + 1} className="px-4 py-8 text-center text-graphite">
                  Tiada sekolah sepadan dengan tapisan.
                </td>
              </tr>
            ) : (
              baris.map((b) => (
                <tr key={b.sekolah.code} className="border-b hairline last:border-0">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-2">
                    <Link
                      href={sekolahUrl(mesyuaratId, b.sekolah.code)}
                      className="hover:underline"
                    >
                      <span className="font-mono text-xs text-graphite">{b.sekolah.code}</span>{" "}
                      {b.sekolah.name}
                    </Link>
                  </td>
                  {b.sel.map((c, i) => (
                    <td key={aktif[i]!.id} className="px-2 py-2 text-center">
                      {c.jenis === "jawab" && isStatusMjkd(c.status) ? (
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-semibold ${STATUS_MJKD_WARNA[c.status]}`}
                          title={STATUS_MJKD_LABEL[c.status]}
                        >
                          {STATUS_MJKD_SINGKAT[c.status]}
                        </span>
                      ) : c.jenis === "belum-hantar" ? (
                        <span className="text-steel" title="Belum hantar">
                          ·
                        </span>
                      ) : (
                        <span className="text-steel" title="Tidak terpakai">
                          –
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ Mengikut perkara ------------------------------ */

function PaparanPerkara({
  mesyuaratId,
  data,
  perkaraId,
  status,
  jenis,
  paparan,
}: Props) {
  const aktif = data.perkara.filter((p) => p.aktif);
  const perkara = aktif.find((p) => p.id === perkaraId) ?? aktif[0];
  if (!perkara) {
    return <p className="card p-6 text-sm text-graphite">Belum ada perkara aktif.</p>;
  }

  const sekolahMengikutKod = new Map(data.sekolah.map((s) => [s.code, s]));
  const mbMengikutId = new Map(data.maklumBalas.map((m) => [m.id, m]));
  const semuaJawapan = data.items
    .filter((it) => it.perkaraId === perkara.id)
    .map((it) => {
      const mb = mbMengikutId.get(it.maklumBalasId)!;
      return { it, mb, sekolah: sekolahMengikutKod.get(mb.schoolCode) };
    })
    .filter((x) => x.sekolah);
  const bilangan = kiraStatus(semuaJawapan.map((x) => x.it));
  const dijangka = data.sekolah.filter(
    (s) => perkaraUntukSekolah([perkara], s).length > 0,
  ).length;

  const dipilihSusun = semuaJawapan
    .filter((x) => x.it.dipilih)
    .sort(
      (a, b) =>
        (a.it.susunanBacaan ?? Number.MAX_SAFE_INTEGER) -
          (b.it.susunanBacaan ?? Number.MAX_SAFE_INTEGER) || a.it.id.localeCompare(b.it.id),
    );
  const kedudukanDipilih = new Map(dipilihSusun.map((x, i) => [x.it.id, i]));

  const lulusTapis = (x: (typeof semuaJawapan)[number]) =>
    (!status || x.it.status === status) && (!jenis || x.sekolah!.jenis === jenis);
  const senarai = [
    ...dipilihSusun.filter(lulusTapis),
    ...semuaJawapan
      .filter((x) => !x.it.dipilih && lulusTapis(x))
      .sort((a, b) => a.mb.schoolCode.localeCompare(b.mb.schoolCode)),
  ];

  const pautanPerkara = (id: string) => {
    const q = new URLSearchParams({ tab: "maklum-balas", view: "perkara", p: id });
    if (status) q.set("status", status);
    if (jenis) q.set("jenis", jenis);
    return `/admin/mjkd/${mesyuaratId}?${q.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {aktif.map((p) => (
          <Link
            key={p.id}
            href={pautanPerkara(p.id)}
            className={p.id === perkara.id ? "btn-ink btn-sm" : "btn-outline-ink btn-sm"}
            title={p.perkara}
          >
            {p.para}
          </Link>
        ))}
      </div>

      <div className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
          Para {perkara.para}
          {perkara.mukaSurat ? ` · m/s ${perkara.mukaSurat}` : ""}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink">{perkara.perkara}</p>
        <p className="mt-2 text-sm text-graphite">
          <span className="font-medium text-charcoal">Tindakan:</span> {perkara.tindakan}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {STATUS_MJKD.map((s) => (
            <li key={s} className="status-badge">
              {STATUS_MJKD_LABEL[s]} {bilangan[s]}
            </li>
          ))}
          <li className="status-badge">
            Belum menjawab {Math.max(dijangka - semuaJawapan.length, 0)}
          </li>
        </ul>
        <p className="mt-2 text-xs text-graphite">
          {semuaJawapan.length} / {dijangka} sekolah telah menjawab · {dipilihSusun.length} dipilih
          untuk dibaca
        </p>
      </div>

      <Penapis
        mesyuaratId={mesyuaratId}
        paparan={paparan}
        perkaraId={perkara.id}
        status={status}
        jenis={jenis}
      />

      {senarai.length === 0 ? (
        <p className="card p-6 text-sm text-graphite">Tiada jawapan sepadan dengan tapisan.</p>
      ) : (
        <ul className="space-y-3">
          {senarai.map(({ it, mb, sekolah }) => {
            const kedudukan = kedudukanDipilih.get(it.id);
            return (
              <li key={it.id} className={`card p-5 ${it.dipilih ? "border-ink" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">
                      {sekolah!.name}{" "}
                      <span className="font-mono text-xs font-normal text-graphite">
                        {sekolah!.code} · {labelJenisSekolah(sekolah!.jenis)} · {sekolah!.zone || "—"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-graphite">
                      {mb.namaPengisi} · {mb.jawatanPengisi}
                    </p>
                  </div>
                  <StatusBadge status={it.status} />
                </div>
                {it.catatan ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">
                    {it.catatan}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-graphite">Tiada catatan.</p>
                )}
                {it.pautanBukti ? (
                  <p className="mt-2 text-sm">
                    <a
                      href={it.pautanBukti}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-blue break-all"
                    >
                      Pautan bukti
                    </a>
                  </p>
                ) : null}
                <div className="mt-4">
                  <PilihBacaKawalan
                    itemId={it.id}
                    dipilih={it.dipilih}
                    susunan={it.susunanBacaan}
                    pertama={kedudukan === 0}
                    terakhir={kedudukan === dipilihSusun.length - 1}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------- Panel -------------------------------- */

export default function AdminMaklumBalasPanel(props: Props) {
  const { mesyuaratId, paparan, perkaraId, status, jenis } = props;
  const analisis = binaAnalisis({
    perkara: props.data.perkara,
    sekolah: props.data.sekolah,
    maklumBalas: props.data.maklumBalas,
    items: props.data.items,
  });
  return (
    <div className="space-y-6">
      <TabelAnalisisMjkd analisis={analisis} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Paparan maklum balas" className="flex flex-wrap gap-2">
          {PAPARAN_MAKLUM_BALAS.map((v) => (
            <Link
              key={v.value}
              href={`/admin/mjkd/${mesyuaratId}?tab=maklum-balas&view=${v.value}`}
              className={paparan === v.value ? "btn-ink btn-sm" : "btn-outline-ink btn-sm"}
              aria-current={paparan === v.value ? "page" : undefined}
            >
              {v.label}
            </Link>
          ))}
        </nav>
        <a href={`/admin/mjkd/${mesyuaratId}/export`} className="btn-outline-ink btn-sm">
          Eksport CSV
        </a>
      </div>
      {paparan === "kemajuan" ? (
        <PaparanKemajuan mesyuaratId={mesyuaratId} data={props.data} />
      ) : paparan === "matriks" ? (
        <PaparanMatriks {...props} />
      ) : (
        <PaparanPerkara
          {...props}
          perkaraId={perkaraId}
          status={status}
          jenis={jenis}
        />
      )}
    </div>
  );
}
