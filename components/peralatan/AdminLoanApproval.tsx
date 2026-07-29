"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveEquipmentLoan,
  rejectEquipmentLoan,
} from "@/lib/actions/peralatan-admin";
import { EQUIPMENT_LOAN_STATUS_LABEL } from "@/lib/peralatan/status";
import type { EquipmentLoanDetail } from "@/lib/peralatan/types";
import EquipmentLoanLifecycle from "./EquipmentLoanLifecycle";

export default function AdminLoanApproval({
  pkgId,
  request,
  currentUser,
  manager,
}: {
  pkgId: string;
  request: EquipmentLoanDetail;
  currentUser: { name: string; position: string };
  manager: { name: string; position: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [decisionNote, setDecisionNote] = useState(request.decisionNote);
  const [error, setError] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      request.items.map((item) => [
        item.id,
        item.allocatedUnits.map((unit) => unit.id),
      ]),
    ),
  );

  const selectedUnitIds = useMemo(
    () => Object.values(selections).flat().filter(Boolean),
    [selections],
  );
  const fullyAllocated = request.items.every(
    (item) =>
      (selections[item.id] ?? []).filter(Boolean).length === item.quantity,
  );

  function updateSelection(itemId: string, index: number, unitId: string) {
    setSelections((current) => {
      const next = [...(current[itemId] ?? [])];
      next[index] = unitId;
      return { ...current, [itemId]: next };
    });
    setError("");
  }

  function runDecision(decision: "approve" | "reject") {
    if (
      decision === "reject" &&
      !window.confirm("Tolak permohonan ini? Tindakan akan direkodkan.")
    ) {
      return;
    }
    const formData = new FormData();
    formData.set("decisionNote", decisionNote);
    formData.set(
      "allocations",
      JSON.stringify(
        request.items.map((item) => ({
          requestItemId: item.id,
          unitIds: (selections[item.id] ?? []).filter(Boolean),
        })),
      ),
    );
    startTransition(async () => {
      const result =
        decision === "approve"
          ? await approveEquipmentLoan(pkgId, request.id, formData)
          : await rejectEquipmentLoan(pkgId, request.id, formData);
      if (!result.ok) {
        setError(result.error ?? "Tindakan tidak berjaya.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                {request.referenceNo}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">
                Permohonan {request.orgName}
              </h2>
              <p className="mt-1 text-sm text-graphite">
                Dihantar pada {request.createdAt.toLocaleString("ms-MY")}
              </p>
            </div>
            <span className="status-badge">
              <span
                className={`status-dot ${
                  request.status === "approved"
                    ? "bg-primary"
                    : request.status === "rejected"
                      ? "bg-bloom-deep"
                      : "bg-amber-400"
                }`}
              />
              {EQUIPMENT_LOAN_STATUS_LABEL[request.status]}
            </span>
          </div>

          <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-fog pt-5 sm:grid-cols-2">
            {[
              ["Nama pemohon", request.applicantName],
              ["Jawatan", request.position],
              ["Sekolah / Unit", request.orgName],
              ["Nombor telefon", request.contact],
              ["Tujuan", request.purpose],
              ["Tempat digunakan", request.usageLocation],
              ["Tarikh dipinjam", request.borrowDate],
              ["Dijangka pulang", request.expectedReturnDate],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-graphite">
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-medium leading-relaxed text-ink">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-fog px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">Peruntukkan nombor siri</h2>
                <p className="mt-1 text-sm text-graphite">
                  Unit berubah kepada status ditempah selepas diluluskan.
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-charcoal">
                {selectedUnitIds.length} /{" "}
                {request.items.reduce((sum, item) => sum + item.quantity, 0)} dipilih
              </span>
            </div>
          </div>

          <div className="divide-y divide-fog">
            {request.items.map((item) => (
              <div key={item.id} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-ink">{item.typeName}</h3>
                    <p className="mt-1 text-sm text-graphite">{item.model}</p>
                  </div>
                  <span className="rounded-md bg-cloud px-2.5 py-1 text-sm font-semibold">
                    {item.quantity} unit
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: item.quantity }, (_, index) => {
                    const selectedId = selections[item.id]?.[index] ?? "";
                    const options =
                      request.status === "pending"
                        ? item.availableUnits
                        : item.allocatedUnits;
                    return (
                      <div key={`${item.id}-${index}`}>
                        <label className="label" htmlFor={`${item.id}-${index}`}>
                          Unit {index + 1}
                        </label>
                        <select
                          id={`${item.id}-${index}`}
                          className="input font-mono text-sm"
                          value={selectedId}
                          disabled={request.status !== "pending"}
                          onChange={(event) =>
                            updateSelection(item.id, index, event.target.value)
                          }
                        >
                          <option value="">Pilih nombor siri</option>
                          {options.map((unit) => (
                            <option
                              key={unit.id}
                              value={unit.id}
                              disabled={
                                selectedUnitIds.includes(unit.id) &&
                                selectedId !== unit.id
                              }
                            >
                              {unit.serialNo}
                              {unit.governmentAssetNo
                                ? ` · ${unit.governmentAssetNo}`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
                {request.status === "pending" &&
                item.availableUnits.length < item.quantity ? (
                  <p className="mt-3 text-sm font-medium text-bloom-deep">
                    Stok tersedia tidak mencukupi untuk meluluskan item ini.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {request.status === "approved" ||
        request.status === "handed_over" ||
        request.status === "returned" ? (
          <EquipmentLoanLifecycle
            key={request.status}
            pkgId={pkgId}
            request={request}
            currentUser={currentUser}
            manager={manager}
          />
        ) : null}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <section className="card p-5">
          <label className="label" htmlFor="approval-note">
            Catatan keputusan
          </label>
          <textarea
            id="approval-note"
            className="textarea min-h-24"
            value={decisionNote}
            disabled={request.status !== "pending"}
            onChange={(event) => setDecisionNote(event.target.value)}
            placeholder="Catatan kepada pemohon, jika ada"
          />

          {error ? (
            <p className="mt-3 rounded-lg bg-bloom-rose/40 p-3 text-sm text-bloom-deep">
              {error}
            </p>
          ) : null}

          {request.status === "pending" ? (
            <>
              <button
                type="button"
                className="btn-primary mt-4 w-full"
                disabled={pending || !fullyAllocated}
                onClick={() => runDecision("approve")}
              >
                {pending ? "Memproses…" : "Lulus & tempah unit"}
              </button>
              <button
                type="button"
                className="btn-outline-ink mt-2 w-full"
                disabled={pending}
                onClick={() => runDecision("reject")}
              >
                Tolak permohonan
              </button>
              {!fullyAllocated ? (
                <p className="mt-3 text-center text-xs leading-relaxed text-graphite">
                  Lengkapkan semua nombor siri sebelum meluluskan.
                </p>
              ) : null}
            </>
          ) : (
            <div className="mt-4 rounded-lg bg-cloud p-4 text-sm text-graphite">
              Keputusan telah direkodkan. Perubahan seterusnya mesti melalui aliran
              serahan atau pemulangan.
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
