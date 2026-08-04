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
} from "@/lib/peralatan/types";

function KewPa9Action({
  pkgId,
  request,
  stage,
}: {
  pkgId: string;
  request: EquipmentLoanDetail;
  stage: EquipmentDocumentStage;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const document = request.documents.find((item) => item.stage === stage);
  const downloadUrl = `/admin/peralatan/${pkgId}/permohonan/${request.id}/kew-pa-9?stage=${stage}`;
  const isActiveLoan = stage === "handover";

  return (
    <div className="rounded-xl border border-fog bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">KEW.PA-9 untuk tandatangan</p>
          <p className="mt-1 text-xs leading-relaxed text-graphite">
            {document?.status === "ready" && document.generatedAt
              ? `Disimpan ${document.generatedAt.toLocaleString("ms-MY")}`
              : document?.status === "failed"
                ? "Simpanan Drive gagal; muat turun masih tersedia."
                : isActiveLoan
                  ? "Borang rasmi. Tarikh pemulangan dibiarkan kosong sehingga peralatan dipulangkan. Cetak melalui muat turun PDF; simpan ke Drive selepas pemulangan."
                  : "Selepas pemulangan, jana semula supaya tarikh pemulangan diisi. Lengkapkan empat tandatangan pada satu salinan bercetak."}
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
          disabled={pending || isActiveLoan}
          title={
            isActiveLoan
              ? "Simpan ke Drive hanya selepas pemulangan."
              : undefined
          }
          onClick={() =>
            startTransition(async () => {
              setError("");
              const result = await generateAndStoreEquipmentKewPa9(
                pkgId,
                request.id,
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
      {isActiveLoan ? (
        <p className="mt-3 text-xs leading-relaxed text-graphite">
          Muat turun PDF dibenarkan sekarang. Simpan ke Drive hanya selepas
          peralatan dipulangkan (tarikh pemulangan telah diisi).
        </p>
      ) : null}
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
}: {
  pkgId: string;
  request: EquipmentLoanDetail;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const isHandover = request.status === "approved";
  const isReturn = request.status === "handed_over";
  const showKewPa9 =
    request.status === "handed_over" || request.status === "returned";
  const kewPa9Stage: EquipmentDocumentStage =
    request.status === "returned" ? "final" : "handover";

  function submitConfirmation() {
    startTransition(async () => {
      setError("");
      const result = isHandover
        ? await recordEquipmentHandover(pkgId, request.id)
        : await recordEquipmentReturn(pkgId, request.id);
      if (!result.ok) {
        setError(result.error ?? "Rekod tidak dapat disimpan.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-fog px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          Rekod pergerakan
        </p>
        <h2 className="mt-1 font-semibold text-ink">
          {isHandover
            ? "Pengesahan serahan peralatan"
            : isReturn
              ? "Pengesahan pemulangan peralatan"
              : "KEW.PA-9"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-graphite">
          Permohonan menggunakan Akuan Pemohon dan MyKad. Empat tandatangan
          dilengkapkan pada satu salinan bercetak KEW.PA-9.
        </p>
      </div>

      {isHandover || isReturn ? (
        <div className="p-5 sm:p-6">
          <div className="rounded-xl border border-fog bg-cloud/60 p-4 text-sm leading-relaxed text-charcoal">
            {isHandover
              ? `Sahkan identiti pemohon berdasarkan MyKad ${request.applicantMykadMasked}, semua nombor siri dan unit fizikal sebelum serahan.`
              : "Periksa semua unit, aksesori dan keadaan fizikal sebelum memulihkan stok sebagai tersedia."}
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
              {isHandover
                ? "Saya mengesahkan identiti pemohon, butiran permohonan dan unit fizikal telah disemak serta diserahkan."
                : "Saya mengesahkan semua unit telah diterima semula dan keadaan fizikal telah diperiksa."}
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
            disabled={pending || !confirmed}
            onClick={submitConfirmation}
          >
            {pending
              ? "Menyimpan..."
              : isHandover
                ? "Sahkan serahan & aktifkan pinjaman"
                : "Sahkan pemulangan & pulihkan stok"}
          </button>
        </div>
      ) : null}

      {showKewPa9 ? (
        <div className="border-t border-fog bg-cloud/50 p-5 sm:p-6">
          <KewPa9Action pkgId={pkgId} request={request} stage={kewPa9Stage} />
        </div>
      ) : null}
    </section>
  );
}
