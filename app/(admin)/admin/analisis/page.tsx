import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { requireKandunganAccess } from "@/lib/rbac";
import { db } from "@/lib/db";
import { analisisBreakdown, analisisMetrics, analisisModul, analisisMonthly } from "@/lib/schema";
import {
  deleteBreakdown,
  deleteMetric,
  deleteMonthly,
  saveBreakdown,
  saveMetric,
  saveMonthly,
} from "@/lib/actions/analisis";
import ActionForm from "@/components/admin/ActionForm";
import DeleteButton from "@/components/admin/DeleteButton";

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
  searchParams: Promise<{ modul?: string }>;
}) {
  await requireKandunganAccess();
  const sp = await searchParams;
  const moduls = analisisModul.enumValues;
  const modul = moduls.includes(sp.modul as (typeof moduls)[number])
    ? (sp.modul as (typeof moduls)[number])
    : "delima";

  const [metrics, monthly, breakdown] = await Promise.all([
    db
      .select()
      .from(analisisMetrics)
      .where(eq(analisisMetrics.modul, modul))
      .orderBy(asc(analisisMetrics.key)),
    db
      .select()
      .from(analisisMonthly)
      .where(eq(analisisMonthly.modul, modul))
      .orderBy(asc(analisisMonthly.sort)),
    db
      .select()
      .from(analisisBreakdown)
      .where(eq(analisisBreakdown.modul, modul))
      .orderBy(asc(analisisBreakdown.kind), asc(analisisBreakdown.sort)),
  ]);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Data Analisis USTP</h1>
      <p className="mt-1 text-sm text-graphite">
        Kemas kini nombor untuk halaman awam /analisis — perubahan terpapar serta-merta.
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

      {/* ---------- Metrik KV ---------- */}
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

      {/* ---------- Siri bulanan ---------- */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Siri Bulanan (guru % / murid %)</h2>
        <div className="card mt-3 divide-y divide-fog">
          {monthly.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 px-4 py-2">
              <ActionForm action={saveMonthly} className="flex flex-1 flex-wrap items-center gap-2">
                <input type="hidden" name="modul" value={modul} />
                <input type="hidden" name="id" value={r.id} />
                <input name="monthLabel" defaultValue={r.monthLabel} className="input w-20" />
                <input
                  name="guruPct"
                  defaultValue={r.guruPct ?? ""}
                  className="input w-24"
                  placeholder="guru %"
                />
                <input
                  name="muridPct"
                  defaultValue={r.muridPct ?? ""}
                  className="input w-24"
                  placeholder="murid %"
                />
                <input
                  name="chartLabel"
                  defaultValue={r.chartLabel}
                  className="input w-28"
                  placeholder="label carta"
                />
                <input
                  name="sort"
                  type="number"
                  defaultValue={r.sort}
                  className="input w-20"
                  title="Susunan"
                />
                <label className="flex items-center gap-1 text-xs text-graphite">
                  <input type="checkbox" name="includeChart" defaultChecked={r.includeChart} />
                  carta
                </label>
              </ActionForm>
              <DeleteButton
                action={deleteMonthly.bind(null, r.id)}
                confirmText={`Padam baris "${r.monthLabel}"?`}
              />
            </div>
          ))}
          <div className="px-4 py-3">
            <ActionForm
              action={saveMonthly}
              submitLabel="Tambah"
              className="flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="modul" value={modul} />
              <input name="monthLabel" placeholder="Bulan (cth. Jan)" className="input w-28" required />
              <input name="guruPct" placeholder="guru %" className="input w-24" />
              <input name="muridPct" placeholder="murid %" className="input w-24" />
              <input name="sort" type="number" placeholder="susunan" className="input w-24" />
              <label className="flex items-center gap-1 text-xs text-graphite">
                <input type="checkbox" name="includeChart" defaultChecked />
                carta
              </label>
            </ActionForm>
          </div>
        </div>
      </section>

      {/* ---------- Pecahan kategori ---------- */}
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
    </>
  );
}
