"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateAndStoreEquipmentKewPa9,
  recordEquipmentHandover,
  recordEquipmentReturn,
} from "@/lib/actions/peralatan-admin";
import type {
  EquipmentDocumentStage,
  EquipmentLoanDetail,
  EquipmentSignatureRole,
  EquipmentSignatureStroke,
} from "@/lib/peralatan/types";
import SignaturePad from "./SignaturePad";

type SignerDraft = {
  role: EquipmentSignatureRole;
  label: string;
  signerName: string;
  signerPosition: string;
  strokes: EquipmentSignatureStroke[];
};

function SignatureCard({
  draft,
  onChange,
  disabled,
}: {
  draft: SignerDraft;
  onChange: (draft: SignerDraft) => void;
  disabled: boolean;
}) {
  return (
    <section className="rounded-xl border border-fog bg-cloud/60 p-4">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.11em] text-primary">
          {draft.label}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-graphite">
          Pastikan penandatangan membaca butiran dan nombor siri di atas.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${draft.role}-name`}>
            Nama
          </label>
          <input
            id={`${draft.role}-name`}
            className="input"
            value={draft.signerName}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...draft, signerName: event.target.value })
            }
          />
        </div>
        <div>
          <label className="label" htmlFor={`${draft.role}-position`}>
            Jawatan
          </label>
          <input
            id={`${draft.role}-position`}
            className="input"
            value={draft.signerPosition}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...draft, signerPosition: event.target.value })
            }
          />
        </div>
      </div>
      <div className="mt-3">
        <SignaturePad
          id={`${draft.role}-signature`}
          value={draft.strokes}
          disabled={disabled}
          onChange={(strokes) => onChange({ ...draft, strokes })}
        />
      </div>
    </section>
  );
}

function PdfAction({
  pkgId,
  requestId,
  stage,
  available,
  document,
}: {
  pkgId: string;
  requestId: string;
  stage: EquipmentDocumentStage;
  available: boolean;
  document: EquipmentLoanDetail["documents"][number] | undefined;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const label = stage === "handover" ? "Versi serahan" : "Versi lengkap";
  const downloadUrl = `/admin/peralatan/${pkgId}/permohonan/${requestId}/kew-pa-9?stage=${stage}`;

  if (!available) return null;
  return (
    <div className="rounded-xl border border-fog bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">{label}</p>
          <p className="mt-1 text-xs text-graphite">
            {document?.status === "ready" && document.generatedAt
              ? `Disimpan ${document.generatedAt.toLocaleString("ms-MY")}`
              : document?.status === "failed"
                ? "Simpanan Drive gagal; muat turun masih tersedia."
                : "PDF dijana daripada rekod dan tandatangan semasa."}
          </p>
        </div>
        {document?.status === "ready" && document.publicUrl ? (
          <a
            href={document.publicUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Buka Drive
          </a>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={downloadUrl} className="btn-outline-ink btn-sm">
          Muat turun PDF
        </a>
        <button
          type="button"
          className="btn-primary btn-sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError("");
              const result = await generateAndStoreEquipmentKewPa9(
                pkgId,
                requestId,
                stage,
              );
              if (!result.ok) {
                setError(result.error ?? "PDF tidak dapat disimpan.");
                return;
              }
              router.refresh();
            })
          }
        >
          {pending ? "Menyimpan..." : "Jana & simpan ke Drive"}
        </button>
      </div>
      {error ? (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function EquipmentLoanLifecycle({
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
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const isHandover = request.status === "approved";
  const isReturn = request.status === "handed_over";
  const [drafts, setDrafts] = useState<SignerDraft[]>(() =>
    isHandover
      ? [
          {
            role: "borrower",
            label: "Tandatangan peminjam",
            signerName: request.applicantName,
            signerPosition: request.position,
            strokes: [],
          },
          {
            role: "approver",
            label: "Tandatangan pelulus",
            signerName: manager.name || currentUser.name,
            signerPosition: manager.position || currentUser.position,
            strokes: [],
          },
        ]
      : [
          {
            role: "returner",
            label: "Tandatangan pemulang",
            signerName: request.applicantName,
            signerPosition: request.position,
            strokes: [],
          },
          {
            role: "receiver",
            label: "Tandatangan penerima",
            signerName: manager.name || currentUser.name,
            signerPosition: manager.position || currentUser.position,
            strokes: [],
          },
        ],
  );

  const complete =
    drafts.length === 2 &&
    drafts.every(
      (draft) =>
        draft.signerName.trim().length >= 2 &&
        draft.signerPosition.trim().length >= 2 &&
        draft.strokes.length > 0,
    );

  function updateDraft(next: SignerDraft) {
    setDrafts((current) =>
      current.map((draft) => (draft.role === next.role ? next : draft)),
    );
    setError("");
  }

  function submitSignatures() {
    const formData = new FormData();
    formData.set(
      "signatures",
      JSON.stringify(
        drafts.map(({ label: _label, ...draft }) => draft),
      ),
    );
    startTransition(async () => {
      setError("");
      const result = isHandover
        ? await recordEquipmentHandover(pkgId, request.id, formData)
        : await recordEquipmentReturn(pkgId, request.id, formData);
      if (!result.ok) {
        setError(result.error ?? "Rekod tidak dapat disimpan.");
        return;
      }
      router.refresh();
    });
  }

  const handoverDocument = request.documents.find(
    (document) => document.stage === "handover",
  );
  const finalDocument = request.documents.find(
    (document) => document.stage === "final",
  );
  const handoverReady =
    request.status === "handed_over" || request.status === "returned";
  const finalReady = request.status === "returned";

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-fog px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          KEW.PA-9
        </p>
        <h2 className="mt-1 font-semibold text-ink">
          {isHandover
            ? "Serahan fizikal dan tandatangan"
            : isReturn
              ? "Pemulangan dan penerimaan"
              : "Dokumen pergerakan aset"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-graphite">
          Tandatangan disimpan dahulu bersama masa dan pegawai yang merekodkan.
          Penjanaan PDF dibuat berasingan supaya rekod tidak hilang jika Drive lambat.
        </p>
      </div>

      {isHandover || isReturn ? (
        <div className="p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {drafts.map((draft) => (
              <SignatureCard
                key={draft.role}
                draft={draft}
                disabled={pending}
                onChange={updateDraft}
              />
            ))}
          </div>
          <label className="mt-5 flex items-start gap-3 text-sm text-charcoal">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary"
              checked={confirmed}
              disabled={pending}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              Saya mengesahkan identiti penandatangan, butiran permohonan dan unit
              fizikal telah disemak.
            </span>
          </label>
          {error ? (
            <p className="mt-4 rounded-lg bg-bloom-rose/40 p-3 text-sm text-bloom-deep">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className="btn-primary mt-5"
            disabled={pending || !complete || !confirmed}
            onClick={submitSignatures}
          >
            {pending
              ? "Menyimpan..."
              : isHandover
                ? "Sahkan serahan & aktifkan pinjaman"
                : "Sahkan pemulangan & pulihkan stok"}
          </button>
        </div>
      ) : null}

      {handoverReady ? (
        <div className="grid gap-3 border-t border-fog bg-cloud/50 p-5 sm:p-6 lg:grid-cols-2">
          <PdfAction
            pkgId={pkgId}
            requestId={request.id}
            stage="handover"
            available={handoverReady}
            document={handoverDocument}
          />
          <PdfAction
            pkgId={pkgId}
            requestId={request.id}
            stage="final"
            available={finalReady}
            document={finalDocument}
          />
        </div>
      ) : null}
    </section>
  );
}
