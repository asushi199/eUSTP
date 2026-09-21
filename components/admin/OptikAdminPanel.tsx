import ActionForm from "@/components/admin/ActionForm";
import OptikArkibTable from "@/components/admin/OptikArkibTable";
import OptikCsvUploadForm from "@/components/admin/OptikCsvUploadForm";
import { saveOptikKpi, saveOptikTov } from "@/lib/actions/analisis-optik";
import {
  listOptikSnapshots,
  optikKpiDisplayMode,
  optikKpiPrevious,
  optikKpiValue,
  optikKpiYear,
} from "@/lib/analisis/optik-queries";
import { optikTovYear, optikTovValue, type MetricMap } from "@/lib/analisis/queries";

export default async function OptikAdminPanel({
  metrics,
  today,
}: {
  metrics: MetricMap;
  today: string;
}) {
  const snapshots = await listOptikSnapshots();
  const kpiYear = optikKpiYear(metrics);
  const kpiValue = optikKpiValue(metrics) ?? 79;
  const kpiPrev = optikKpiPrevious(metrics);
  const kpiPrevYear = kpiPrev?.year ?? "2025";
  const kpiPrevValue = kpiPrev?.value ?? 55;
  const kpiDisplay = optikKpiDisplayMode(metrics);
  const tovYear = optikTovYear(metrics);
  const tovValue = optikTovValue(metrics) ?? 86.43;

  return (
    <>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="text-lg font-semibold">KPI Kebangsaan</h2>
          <p className="mt-1 text-xs text-graphite">
            Boleh papar satu tahun atau dua tahun. Carta memakai garis sasaran mengikut
            tahun yang dipaparkan.
          </p>
          <ActionForm action={saveOptikKpi} className="mt-3 grid gap-3 sm:grid-cols-2" submitLabel="Simpan KPI">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="kpi-display">
                Paparan
              </label>
              <select id="kpi-display" name="kpiDisplay" defaultValue={kpiDisplay} className="input">
                <option value="both">Kedua-dua tahun</option>
                <option value="one">Satu tahun (tahun semasa)</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="kpi-prev-year">
                Tahun terdahulu
              </label>
              <input
                id="kpi-prev-year"
                name="kpiPrevYear"
                defaultValue={kpiPrevYear}
                className="input"
                placeholder="cth. 2025"
              />
            </div>
            <div>
              <label className="label" htmlFor="kpi-prev-value">
                Sasaran terdahulu (%)
              </label>
              <input
                id="kpi-prev-value"
                name="kpiPrevValue"
                defaultValue={kpiPrevValue}
                className="input"
                placeholder="cth. 55"
              />
            </div>
            <div>
              <label className="label" htmlFor="kpi-year">
                Tahun semasa
              </label>
              <input id="kpi-year" name="kpiYear" defaultValue={kpiYear} className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="kpi-value">
                Sasaran semasa (%)
              </label>
              <input
                id="kpi-value"
                name="kpiValue"
                defaultValue={kpiValue}
                className="input"
                required
              />
            </div>
          </ActionForm>
        </div>
        <div className="card p-4">
          <h2 className="text-lg font-semibold">TOV (tahun lepas)</h2>
          <p className="mt-1 text-xs text-graphite">
            Titik pertama carta. Nilai semasa diambil daripada snapshot 27 Nov 2025 (86.43%).
          </p>
          <ActionForm action={saveOptikTov} className="mt-3 grid gap-3 sm:grid-cols-2" submitLabel="Simpan TOV">
            <div>
              <label className="label" htmlFor="tov-year">
                Tahun TOV
              </label>
              <input id="tov-year" name="tovYear" defaultValue={tovYear} className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="tov-value">
                Peratus
              </label>
              <input
                id="tov-value"
                name="tovValue"
                defaultValue={tovValue}
                className="input"
                required
              />
            </div>
          </ActionForm>
        </div>
      </section>

      <section className="card mt-6 p-4">
        <h2 className="text-lg font-semibold">Muat naik CSV</h2>
        <p className="mt-1 text-sm text-graphite">
        Setiap muat naik menjadi paparan semasa dan menambah satu titik pada carta. Snapshot
        lama kekal dalam arkib. Fail guru (Nama + Status) membolehkan klik sekolah untuk
        lihat siapa yang belum selesai.
        </p>
        <div className="mt-4">
          <OptikCsvUploadForm today={today} />
        </div>
      </section>

      <OptikArkibTable snapshots={snapshots} />
    </>
  );
}
