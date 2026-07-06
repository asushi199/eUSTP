"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import KhidmatRequestCard from "./KhidmatRequestCard";
import GroupedRequestList from "./GroupedRequestList";
import ApprovedCalendar from "./ApprovedCalendar";
import { getServiceDate } from "@/lib/khidmat-bantu/date-group";
import { cn } from "@/lib/cn";
import type { KhidmatBantuRow } from "@/lib/khidmat-bantu/queries";

type View = "senarai" | "kalendar";

/**
 * Kawalan pandangan admin: gilir tunggu-kelulusan (sentiasa di atas) +
 * suis Senarai/Kalendar untuk rekod. Pilihan pandangan diingat via ?view.
 */
export default function KhidmatBantuAdminView({
  pending,
  others,
}: {
  pending: KhidmatBantuRow[];
  others: KhidmatBantuRow[];
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [view, setViewState] = useState<View>(
    params.get("view") === "kalendar" ? "kalendar" : "senarai",
  );

  function setView(next: View) {
    setViewState(next);
    const p = new URLSearchParams(window.location.search);
    if (next === "senarai") p.delete("view");
    else p.set("view", next);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }

  const sortedPending = useMemo(
    () =>
      [...pending].sort((a, b) =>
        (getServiceDate(a) ?? "9999-99-99").localeCompare(getServiceDate(b) ?? "9999-99-99"),
      ),
    [pending],
  );
  const approved = useMemo(() => others.filter((r) => r.status === "approved"), [others]);

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="text-lg font-semibold">Menunggu kelulusan ({sortedPending.length})</h2>
        {sortedPending.length === 0 ? (
          <div className="card mt-3 p-8 text-center text-sm text-graphite">
            Tiada permohonan menunggu.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {sortedPending.map((row) => (
              <KhidmatRequestCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {view === "kalendar" ? "Kalendar diluluskan" : "Rekod permohonan"}
          </h2>
          <div className="inline-flex rounded-full border border-fog p-0.5">
            {(["senarai", "kalendar"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition",
                  view === v ? "bg-primary text-white" : "text-graphite hover:text-ink",
                )}
              >
                {v === "senarai" ? "Senarai" : "Kalendar"}
              </button>
            ))}
          </div>
        </div>

        {view === "kalendar" ? (
          <ApprovedCalendar rows={approved} />
        ) : (
          <GroupedRequestList rows={others} />
        )}
      </section>
    </div>
  );
}
