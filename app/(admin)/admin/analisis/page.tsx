import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { requireKandunganAccess } from "@/lib/rbac";
import { db } from "@/lib/db";
import { analisisBreakdown, analisisMetrics, analisisModul } from "@/lib/schema";
import { listDelimaSnapshots, periodLabel } from "@/lib/analisis/delima-snapshot";
import {
  deleteBreakdown,
  deleteMetric,
  padamSnapshotDelima,
  saveBreakdown,
  saveMetric,
  simpanSnapshotDelima,
} from "@/lib/actions/analisis";
import ActionForm from "@/components/admin/ActionForm";
import DeleteButton from "@/components/admin/DeleteButton";
import OptikAdminPanel from "@/components/admin/OptikAdminPanel";
import {
  DELIMA_LIVE_DEFAULT_DAERAH,
  DELIMA_LIVE_DEFAULT_URL,
  fetchDelimaLive,
} from "@/lib/analisis/delima-live";
import { formatInTimeZone } from "date-fns-tz";

export const dynamic = "force-dynamic";

const MODUL_LABEL: Record<string, string> = {
  delima: "DELIMa",
  dcs: "DCS",
  ains: "Program Ains",
  pensijilan: "Pensijilan Digital",
  optik: "AI Tools (OPTIK)",
};

export default async function AdminAnalisisPage({
  searchParams,
}: {
  searchParams: Promise<{ modul?: string; hal?: string }>;
}) {
  await requireKandunganAccess();
  const sp = await searchParams;
  const moduls = analisisModul.enumValues;
  const modul = moduls.includes(sp.modul as (typeof moduls)[number])
    ? (sp.modul as (typeof moduls)[number])
    : "delima";

  const [metrics, breakdown] = await Promise.all([
    db
      .select()
      .from(analisisMetrics)
      .where(eq(analisisMetrics.modul, modul))
      .orderBy(asc(analisisMetrics.key)),
    db
      .select()
      .from(analisisBreakdown)
      .where(eq(analisisBreakdown.modul, modul))
      .orderBy(asc(analisisBreakdown.kind), asc(analisisBreakdown.sort)),
  ]);

  const today = formatInTimeZone(new Date(), "Asia/Kuala_Lumpur", "yyyy-MM-dd");
  const optikMetrics = new Map(metrics.map((m) => [m.key.toLowerCase(), m.value]));
  const liveUrl = optikMetrics.get("delima_live_url")?.trim() || DELIMA_LIVE_DEFAULT_URL;
  const liveDaerah = optikMetrics.get("delima_daerah")?.trim() || DELIMA_LIVE_DEFAULT_DAERAH;
  const live = modul === "delima" ? await fetchDelimaLive(liveUrl, liveDaerah) : null;
  const hal = Math.max(1, Number.parseInt(sp.hal ?? "1", 10) || 1);
  const sejarah = modul === "delima" ? await listDelimaSnapshots(hal) : null;

  return (
    <>
      <Link href="/admin" className="text-sm text-graphite hover:text-ink">
        ← Papan Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">CoE Analytics</h1>
      <p className="mt-1 text-sm text-graphite">
        Kemas kini nombor untuk /analisis — perubahan terpapar serta-merta.
      </p>

      {/* Tab modul */}
      <nav className="hairline mt-5 flex gap-1 overflow-x-auto border-b" aria-label="Modul">
        {moduls.map((m) => (
          <Link
            key={m}
            href={`/admin/analisis?modul=${m}`}
            className={`whitespace-nowrap px-3 py-2 text-sm ${
              m === modul
                ? "border-b-2 border-ink font-semibold text-ink"
                : "text-graphite hover:text-ink"
            }`}
          >
            {MODUL_LABEL[m]}
          </Link>
        ))}
      </nav>

      {modul === "optik" ? (
        <OptikAdminPanel metrics={optikMetrics} today={today} />
      ) : (
        <>
      {modul === "delima" ? (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Sumber Data Langsung</h2>
          <p className="mt-1 text-sm text-graphite">
            Peratus guru/murid aktif dan bilangan sekolah dibaca terus daripada papan pemuka DELIMa
            Perak (dikemas kini automatik setiap jam). Tukar pautan atau daerah di bawah jika perlu.
          </p>
          <div className="card mt-3 space-y-3 px-4 py-3">
            {(
              [
                ["delima_live_url", "Pautan papan pemuka", liveUrl],
                ["delima_daerah", "Slug daerah (cth. manjung)", liveDaerah],
              ] as const
            ).map(([key, label, value]) => (
              <ActionForm key={key} action={saveMetric} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="modul" value={modul} />
                <input type="hidden" name="key" value={key} />
                <span className="w-56 shrink-0 text-sm">{label}</span>
                <input name="value" defaultValue={value} className="input max-w-xl flex-1" />
              </ActionForm>
            ))}
            <p className="text-sm">
              Status:{" "}
              {live ? (
                <span className="font-semibold">
                  Berjaya — Guru {live.guru.peratus}% ({live.guru.aktif.toLocaleString("ms-MY")}/
                  {live.guru.jumlah.toLocaleString("ms-MY")}), Murid {live.murid.peratus}% ·{" "}
                  {live.tempoh}
                </span>
              ) : (
                <span className="font-semibold text-bloom-deep">
                  Gagal dicapai — paparan awam guna data pangkalan data (metrik di bawah).
                </span>
              )}
            </p>
          </div>
        </section>
      ) : null}
      {sejarah ? (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Sejarah Snapshot</h2>
            <ActionForm action={simpanSnapshotDelima} submitLabel="Simpan snapshot sekarang">
              <span className="sr-only">Simpan snapshot DELIMa sekarang</span>
            </ActionForm>
          </div>
          <p className="mt-1 text-sm text-graphite">
            Disimpan automatik setiap hari untuk tempoh data semasa (satu baris setiap bulan sumber).
            Carta trend DELIMa memakai snapshot ini.
          </p>
          <div className="card mt-3 divide-y divide-fog">
            {sejarah.rows.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-graphite">Belum ada snapshot.</p>
            ) : (
              sejarah.rows.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-sm">
                  <div className="w-40 shrink-0">
                    <p className="font-medium">{periodLabel(r.period)}</p>
                    <p className="text-xs text-graphite">{r.tempoh}</p>
                  </div>
                  <p className="tabular-nums">
                    Guru {r.guruPct}% <span className="text-xs text-graphite">({r.guruAktif}/{r.guruJumlah})</span>
                  </p>
                  <p className="tabular-nums">
                    Murid {r.muridPct}% <span className="text-xs text-graphite">({r.muridAktif}/{r.muridJumlah})</span>
                  </p>
                  <p className="tabular-nums text-graphite">
                    {r.bilCapai != null
                      ? `${r.bilCapai} / ${r.bilSekolah ?? "—"} sekolah capai`
                      : `${r.bilSekolah ?? "—"} sekolah`}
                  </p>
                  <p className="flex-1 text-xs text-graphite">Disimpan {r.capturedOn}</p>
                  <DeleteButton
                    action={padamSnapshotDelima.bind(null, r.id)}
                    confirmText={`Padam snapshot ${periodLabel(r.period)}?`}
                  />
                </div>
              ))
            )}
          </div>
          {sejarah.pageCount > 1 ? (
            <nav className="mt-3 flex items-center justify-between text-sm" aria-label="Halaman sejarah">
              <p className="text-xs text-graphite">
                {sejarah.total} snapshot · halaman {sejarah.page} / {sejarah.pageCount}
              </p>
              <div className="flex gap-2">
                {sejarah.page > 1 ? (
                  <Link
                    href={`/admin/analisis?modul=delima&hal=${sejarah.page - 1}`}
                    className="btn-outline btn-sm"
                  >
                    ← Sebelum
                  </Link>
                ) : null}
                {sejarah.page < sejarah.pageCount ? (
                  <Link
                    href={`/admin/analisis?modul=delima&hal=${sejarah.page + 1}`}
                    className="btn-outline btn-sm"
                  >
                    Seterusnya →
                  </Link>
                ) : null}
              </div>
            </nav>
          ) : null}
        </section>
      ) : null}

      {/* ---------- Sasaran KPI DELIMa ---------- */}
      {modul === "delima" ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Sasaran KPI</h2>
          <p className="mt-1 text-sm text-graphite">
            Sasaran peratus aktif untuk garis KPI carta dan kad DELIMa.
          </p>
          <div className="card mt-3 space-y-3 px-4 py-3">
            {(
              [
                ["kpi_guru", "Sasaran KPI Guru (%)"],
                ["kpi_murid", "Sasaran KPI Murid (%)"],
              ] as const
            ).map(([key, label]) => (
              <ActionForm key={key} action={saveMetric} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="modul" value={modul} />
                <input type="hidden" name="key" value={key} />
                <span className="w-56 shrink-0 text-sm">{label}</span>
                <input
                  name="value"
                  defaultValue={optikMetrics.get(key) ?? ""}
                  className="input w-32"
                  inputMode="decimal"
                />
              </ActionForm>
            ))}
          </div>
        </section>
      ) : (
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Metrik (kunci → nilai)</h2>
        <div className="card mt-3 divide-y divide-fog">
          {metrics.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-2 px-4 py-2">
              <ActionForm action={saveMetric} className="flex flex-1 flex-wrap items-center gap-2">
                <input type="hidden" name="modul" value={modul} />
                <input type="hidden" name="key" value={m.key} />
                <code className="w-44 shrink-0 text-xs">{m.key}</code>
                <input name="value" defaultValue={m.value} className="input max-w-md flex-1" />
              </ActionForm>
              <DeleteButton
                action={deleteMetric.bind(null, m.id)}
                confirmText={`Padam metrik "${m.key}"?`}
              />
            </div>
          ))}
          <div className="px-4 py-3">
            <ActionForm
              action={saveMetric}
              submitLabel="Tambah"
              className="flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="modul" value={modul} />
              <input name="key" placeholder="kunci_baru" className="input w-44" required />
              <input name="value" placeholder="nilai" className="input max-w-md flex-1" />
            </ActionForm>
          </div>
        </div>
      </section>
      )}

      {/* ---------- Pecahan kategori ---------- */}
      {modul !== "delima" ? (
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Pecahan Kategori (lokasi / sekolah)</h2>
        <div className="card mt-3 divide-y divide-fog">
          {breakdown.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-2 px-4 py-2">
              <ActionForm action={saveBreakdown} className="flex flex-1 flex-wrap items-center gap-2">
                <input type="hidden" name="modul" value={modul} />
                <input type="hidden" name="id" value={b.id} />
                <input name="kind" defaultValue={b.kind} className="input w-28" />
                <input name="label" defaultValue={b.label} className="input w-40" />
                <input name="value" defaultValue={b.value} className="input w-24" />
                <input name="sort" type="number" defaultValue={b.sort} className="input w-20" />
              </ActionForm>
              <DeleteButton
                action={deleteBreakdown.bind(null, b.id)}
                confirmText={`Padam "${b.label}"?`}
              />
            </div>
          ))}
          <div className="px-4 py-3">
            <ActionForm
              action={saveBreakdown}
              submitLabel="Tambah"
              className="flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="modul" value={modul} />
              <input name="kind" placeholder="lokasi / sekolah" className="input w-28" required />
              <input name="label" placeholder="label" className="input w-40" required />
              <input name="value" placeholder="nilai" className="input w-24" required />
              <input name="sort" type="number" placeholder="susunan" className="input w-24" />
            </ActionForm>
          </div>
        </div>
      </section>
      ) : null}
        </>
      )}
    </>
  );
}
