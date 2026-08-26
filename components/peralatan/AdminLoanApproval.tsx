"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveEquipmentLoan,
  rejectEquipmentLoan,
} from "@/lib/actions/peralatan-admin";
import type { NotifyPemohonPrompt } from "@/lib/admin/notify-pemohon";
import NotifyPemohonDialog from "@/components/admin/NotifyPemohonDialog";
import { buildEquipmentDecisionWhatsAppUrl } from "@/lib/peralatan/whatsapp";
import { EQUIPMENT_LOAN_STATUS_LABEL } from "@/lib/peralatan/status";
import type { EquipmentLoanDetail } from "@/lib/peralatan/types";
import {
  equipmentUnitOptionLabel,
  sortUnitsForAutoAllocation,
} from "@/lib/peralatan/unit-assignment";
import EquipmentLoanLifecycle from "./EquipmentLoanLifecycle";

export default function AdminLoanApproval({
  pkgId,
  request,
}: {
  pkgId: string;
  request: EquipmentLoanDetail;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [decisionNote, setDecisionNote] = useState(request.decisionNote);
  const [approvedBorrowDate, setApprovedBorrowDate] = useState(
    request.borrowDate,
  );
  const [approvedReturnDate, setApprovedReturnDate] = useState(
    request.expectedReturnDate,
  );
  const [approvedQuantities, setApprovedQuantities] = useState<
    Record<string, number>
  >(() => Object.fromEntries(request.items.map((item) => [item.id, item.quantity])));
  const [approvedQuantityInputs, setApprovedQuantityInputs] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      request.items.map((item) => [item.id, String(item.quantity)]),
    ),
  );
  const [error, setError] = useState("");
  const [notify, setNotify] = useState<NotifyPemohonPrompt | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
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
      (selections[item.id] ?? []).filter(Boolean).length ===
      approvedQuantities[item.id],
  );
  const hasValidApprovedQuantities = request.items.every((item) => {
    const quantity = Number(approvedQuantityInputs[item.id]);
    return (
      Number.isInteger(quantity) &&
      quantity >= 1 &&
      quantity <= item.quantity &&
      quantity === approvedQuantities[item.id]
    );
  });
  const decisionWhatsappUrl =
    notify?.href ||
    (request.status === "approved" ||
    request.status === "rejected" ||
    request.status === "handed_over"
      ? buildEquipmentDecisionWhatsAppUrl(request.contact, {
          referenceNo: request.referenceNo,
          applicantName: request.applicantName,
          pkgName: request.pkgName,
          borrowDate: request.borrowDate,
          expectedReturnDate: request.expectedReturnDate,
          items: request.items.map((item) => `${item.categoryName} (${item.quantity})`),
          decisionNote: request.decisionNote,
          decision:
            request.status === "rejected"
              ? "rejected"
              : request.status === "handed_over"
                ? "handed_over"
                : "approved",
        })
      : "");

  function updateApprovedQuantity(
    itemId: string,
    requestedQuantity: number,
    value: string,
  ) {
    setApprovedQuantityInputs((current) => ({ ...current, [itemId]: value }));
    const quantity = Number(value);
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > requestedQuantity
    ) {
      return;
    }
    setApprovedQuantities((current) => ({ ...current, [itemId]: quantity }));
    setSelections((current) => ({
      ...current,
      [itemId]: (current[itemId] ?? []).slice(0, quantity),
    }));
    setError("");
  }

  function restoreApprovedQuantity(itemId: string) {
    setApprovedQuantityInputs((current) => ({
      ...current,
      [itemId]: String(approvedQuantities[itemId]),
    }));
  }

  function updateSelection(itemId: string, index: number, unitId: string) {
    setSelections((current) => {
      const next = [...(current[itemId] ?? [])];
      next[index] = unitId;
      return { ...current, [itemId]: next };
    });
    setError("");
  }

  function autoAllocateRemainingUnits() {
    const usedUnitIds = new Set(selectedUnitIds);
    const nextSelections = Object.fromEntries(
      request.items.map((item) => {
        const current = selections[item.id] ?? [];
        const next = Array.from(
          { length: approvedQuantities[item.id] },
          (_, index) => {
            const selectedId = current[index] ?? "";
            if (selectedId) return selectedId;
            const unit = sortUnitsForAutoAllocation(item.availableUnits).find(
              (candidate) => !usedUnitIds.has(candidate.id),
            );
            if (!unit) return "";
            usedUnitIds.add(unit.id);
            return unit.id;
          },
        );
        return [item.id, next];
      }),
    );
    setSelections(nextSelections);
    setError("");
  }

  function runDecision(decision: "approve" | "reject") {
    if (decision === "approve" && !hasValidApprovedQuantities) {
      setError("Masukkan kuantiti diluluskan yang sah.");
      return;
    }
    if (
      decision === "reject" &&
      !window.confirm("Tolak permohonan ini? Tindakan akan direkodkan.")
    ) {
      return;
    }
    const formData = new FormData();
    formData.set("decisionNote", decisionNote);
    formData.set("approvedBorrowDate", approvedBorrowDate);
    formData.set("approvedReturnDate", approvedReturnDate);
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
      const notifyDecision = decision === "approve" ? "approved" : "rejected";
      const prompt: NotifyPemohonPrompt = {
        href: buildEquipmentDecisionWhatsAppUrl(request.contact, {
          referenceNo: request.referenceNo,
          applicantName: request.applicantName,
          pkgName: request.pkgName,
          borrowDate:
            decision === "approve" ? approvedBorrowDate : request.borrowDate,
          expectedReturnDate:
            decision === "approve"
              ? approvedReturnDate
              : request.expectedReturnDate,
          items: request.items.map(
            (item) =>
              `${item.categoryName} (${
                decision === "approve"
                  ? approvedQuantities[item.id]
                  : item.quantity
              })`,
          ),
          decisionNote,
          decision: notifyDecision,
        }),
        decision: notifyDecision,
      };
      setNotify(prompt);
      setNotifyOpen(true);
    });
  }

  return (
    <>
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
              ["No. MyKad", request.applicantMykadMasked],
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

        <section className="card p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.11em] text-primary">
            Akuan pemohon
          </p>
          <h2 className="mt-1 font-semibold text-ink">
            Persetujuan tanggungjawab
          </h2>
          {request.declarationAcceptedAt && request.declarationText ? (
            <>
              <p className="mt-3 whitespace-pre-line rounded-xl border border-fog bg-cloud/60 p-4 text-sm leading-relaxed text-charcoal">
                {request.declarationText}
              </p>
              <p className="mt-3 text-xs text-graphite">
                Dipersetujui pada{" "}
                {request.declarationAcceptedAt.toLocaleString("ms-MY")} · Versi{" "}
                {request.declarationVersion}
              </p>
            </>
          ) : (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Akuan elektronik tidak tersedia bagi rekod lama ini.
            </p>
          )}
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
                {request.items.reduce(
                  (sum, item) => sum + approvedQuantities[item.id],
                  0,
                )} dipilih
              </span>
            </div>
            {request.status === "pending" ? (
              <button
                type="button"
                className="btn-outline-ink btn-sm mt-3"
                onClick={autoAllocateRemainingUnits}
              >
                Isi baki secara automatik
              </button>
            ) : null}
          </div>

          <div className="divide-y divide-fog">
            {request.items.map((item) => (
              <div key={item.id} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-ink">
                      {item.categoryName}
                    </h3>
                    <p className="mt-1 text-sm text-graphite">
                      Model boleh dipilih mengikut unit yang tersedia.
                    </p>
                  </div>
                  <span className="rounded-md bg-cloud px-2.5 py-1 text-sm font-semibold">
                    {item.quantity} dimohon
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {request.status === "pending" ? (
                    <div className="sm:col-span-2">
                      <label className="label" htmlFor={`quantity-${item.id}`}>
                        Kuantiti diluluskan
                      </label>
                      <input
                        id={`quantity-${item.id}`}
                        className="input max-w-36"
                        type="number"
                        min="1"
                        max={item.quantity}
                        step="1"
                        inputMode="numeric"
                        value={approvedQuantityInputs[item.id] ?? ""}
                        onChange={(event) =>
                          updateApprovedQuantity(
                            item.id,
                            item.quantity,
                            event.target.value,
                          )
                        }
                        onBlur={() => restoreApprovedQuantity(item.id)}
                      />
                      <p className="mt-1 text-xs text-graphite">
                        Maksimum {item.quantity} unit seperti yang dimohon.
                      </p>
                    </div>
                  ) : null}
                  {Array.from({ length: approvedQuantities[item.id] }, (_, index) => {
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
                          className="input font-mono text-xs"
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
                              {equipmentUnitOptionLabel(unit)}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
                {request.status === "pending" &&
                item.availableUnits.length < approvedQuantities[item.id] ? (
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

          {request.status === "pending" ? (
            <div className="mt-5 grid gap-4 border-t border-fog pt-5">
              <div>
                <label className="label" htmlFor="approved-borrow-date">
                  Tarikh pinjaman diluluskan
                </label>
                <input
                  id="approved-borrow-date"
                  className="input"
                  type="date"
                  value={approvedBorrowDate}
                  onChange={(event) =>
                    setApprovedBorrowDate(event.target.value)
                  }
                />
              </div>
              <div>
                <label className="label" htmlFor="approved-return-date">
                  Tarikh pulang diluluskan
                </label>
                <input
                  id="approved-return-date"
                  className="input"
                  type="date"
                  value={approvedReturnDate}
                  min={approvedBorrowDate}
                  onChange={(event) =>
                    setApprovedReturnDate(event.target.value)
                  }
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mt-3 rounded-lg bg-bloom-rose/40 p-3 text-sm text-bloom-deep">
              {error}
            </p>
          ) : null}

          {request.status === "pending" && !notify ? (
            <>
              <button
                type="button"
                className="btn-primary mt-4 w-full"
                disabled={pending || !fullyAllocated || !hasValidApprovedQuantities}
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
            <div className="mt-4 space-y-3 rounded-lg bg-cloud p-4 text-sm text-graphite">
              <p>
                Keputusan telah direkodkan. Perubahan seterusnya mesti melalui aliran
                serahan atau pemulangan.
              </p>
              {decisionWhatsappUrl ? (
                <a
                  href={decisionWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary mt-3 w-full"
                >
                  WhatsApp pemohon
                </a>
              ) : null}
            </div>
          )}
        </section>
      </aside>
    </div>
      <NotifyPemohonDialog
        open={notifyOpen}
        href={notify?.href ?? ""}
        decision={notify?.decision ?? "approved"}
        onClose={() => {
          setNotifyOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
