import Link from "next/link";
import StatusLencana from "@/components/kunjung-bantu/StatusLencana";
import { withDbTimeout } from "@/lib/db";
import { listSchoolOptions } from "@/lib/direktori/queries";
import {
  ITEM_DIISI,
  NAMA_INSTRUMEN,
  SESI_KUNJUNG_BANTU,
  STATUS_LABEL,
  kiraYa,
} from "@/lib/kunjung-bantu/instrumen";
import { listKodDraf, listRekodAdmin } from "@/lib/kunjung-bantu/queries";
import { requireKandunganAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type StatusPapar = keyof typeof STATUS_LABEL;
const URUTAN: StatusPapar[] = ["DIHANTAR", "PERLU_PEMBETULAN", "DISAHKAN", "DRAF", "BELUM"];

type Props = { searchParams: Promise<{ status?: string; zon?: string; q?: string }> };

export default async function AdminKunjungBantuPage({ searchParams }: Props) {
  await requireKandunganAccess();
  const sp = await searchParams;

  let data: {
    schools: Awaited<ReturnType<typeof listSchoolOptions>>;
    rekod: Awaited<ReturnType<typeof listRekodAdmin>>;
    draf: string[];
  };
  try {
    data = await withDbTimeout(
      (async () => {
        const schools = await listSchoolOptions();
        const rekod = await listRekodAdmin();
        const draf = await listKodDraf();
        return { schools, rekod, draf };
      })(),
    );
  } catch {
    return (
      <p className="card p-6 text-sm text-graphite">
        Pangkalan data perlahan. Sila muat semula halaman ini.
      </p>
    );
  }

  const peta = new Map(data.rekod.map((r) => [r.schoolCode, r]));
  const drafSet = new Set(data.draf);
  const baris = data.schools.map((s) => {
    const r = peta.get(s.code);
    const status: StatusPapar = r ? r.status : drafSet.has(s.code) ? "DRAF" : "BELUM";
    return { ...s, status, r };
  });
  const kiraan = Object.fromEntries(
    URUTAN.map((st) => [st, baris.filter((b) => b.status === st).length]),
  ) as Record<StatusPapar, number>;
  const zon = [...new Set(data.schools.map((s) => s.zone).filter(Boolean))].sort();

  const statusTapis = URUTAN.includes(sp.status as StatusPapar) ? (sp.status as StatusPapar) : null;
  const q = (sp.q ?? "").trim().toLowerCase();
  const ditapis = baris
    .filter((b) => !statusTapis || b.status === statusTapis)
    .filter((b) => !sp.zon || b.zone === sp.zon)
    .filter((b) => !q || `${b.code} ${b.name}`.toLowerCase().includes(q))
    .sort((a, b) => URUTAN.indexOf(a.status) - URUTAN.indexOf(b.status) || a.code.localeCompare(b.code));

  function pautan(status: StatusPapar | null) {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (sp.zon) p.set("zon", sp.zon);
    if (sp.q) p.set("q", sp.q);
    const s = p.toString();
    return s ? `/admin/kunjung-bantu?${s}` : "/admin/kunjung-bantu";
  }

  return (
    <>
      <Link href="/admin/pelaporan" className="text-sm text-graphite hover:text-ink">
        ← CoE Reports
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{NAMA_INSTRUMEN}</h1>
          <p className="mt-1 text-sm text-graphite">
            Sesi {SESI_KUNJUNG_BANTU.replace("-", "–")} · {data.schools.length} sekolah ·{" "}
            {data.rekod.length} sudah menghantar
          </p>
        </div>
        <Link href="/laporan-kunjung-bantu" className="btn-outline-ink" target="_blank">
          Borang awam ↗
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={pautan(null)}
          className={`rounded-full border px-3 py-1.5 text-sm ${!statusTapis ? "border-ink bg-ink text-white" : "border-fog bg-white"}`}
        >
          Semua · {baris.length}
        </Link>
        {URUTAN.map((st) => (
          <Link
            key={st}
            href={pautan(st)}
            className={`rounded-full border px-3 py-1.5 text-sm ${statusTapis === st ? "border-ink bg-ink text-white" : "border-fog bg-white"}`}
          >
            {STATUS_LABEL[st]} · {kiraan[st]}
          </Link>
        ))}
      </div>

      <form className="mt-4 flex flex-wrap gap-3" method="get">
        {statusTapis ? <input type="hidden" name="status" value={statusTapis} /> : null}
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Cari kod / nama sekolah" className="input max-w-xs" />
        <select name="zon" defaultValue={sp.zon ?? ""} className="input max-w-[14rem]">
          <option value="">Semua zon</option>
          {zon.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-outline-ink">
          Tapis
        </button>
      </form>

      <ul className="card mt-4 divide-y divide-fog overflow-hidden">
        {ditapis.length === 0 ? (
          <li className="p-5 text-sm text-graphite">Tiada sekolah sepadan.</li>
        ) : (
          ditapis.map((b) => {
            const ya = b.r ? kiraYa(b.r.jawapan).ya : null;
            return (
              <li key={b.code}>
                <Link
                  href={`/admin/kunjung-bantu/${encodeURIComponent(b.code)}`}
                  className="flex flex-col gap-2 px-5 py-3 transition hover:bg-cloud sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">
                      {b.code} — {b.name}
                    </span>
                    <span className="block text-xs text-graphite">
                      {b.zone || "—"}
                      {b.r
                        ? ` · ${ya}/${ITEM_DIISI.length} Ya · dihantar ${b.r.tarikhHantar.toLocaleDateString("ms-MY")}`
                        : ""}
                      {b.r?.tarikhPenilaian ? ` · lawatan ${b.r.tarikhPenilaian}` : ""}
                    </span>
                  </span>
                  <StatusLencana status={b.status} />
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </>
  );
}
