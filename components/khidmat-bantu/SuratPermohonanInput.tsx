"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { uploadSuratPermohonanAction } from "@/lib/actions/khidmat-bantu";
import { compressImageForLaporan } from "@/lib/client/compress-image";
import { cn } from "@/lib/cn";
import type { KhidmatSuratPermohonan } from "@/lib/schema";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
const MAX_BYTES = 8 * 1024 * 1024;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(name: string, type: string): "pdf" | "image" {
  if (type === "application/pdf" || name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "image";
}

export default function SuratPermohonanInput({
  disabled,
  orgName,
  activityDate,
  serviceType,
  onReadyChange,
}: {
  disabled?: boolean;
  orgName: string;
  activityDate: string;
  serviceType: string;
  onReadyChange?: (ready: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<KhidmatSuratPermohonan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, startUpload] = useTransition();

  const metaKey = `${orgName}|${activityDate}|${serviceType}`;

  useEffect(() => {
    onReadyChange?.(!!uploaded && !uploading);
  }, [uploaded, uploading, onReadyChange]);

  useEffect(() => {
    setSelected(null);
    setUploaded(null);
    setError(null);
    setNotice(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [metaKey]);

  function canUploadMeta(): string | null {
    if (!orgName.trim()) return "Sila isi nama sekolah/unit dahulu.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(activityDate)) return "Sila pilih tarikh cadangan dahulu.";
    return null;
  }

  function validateFile(file: File | null): string | null {
    if (!file) return "Fail tidak sah.";
    if (file.size > MAX_BYTES) return "Fail melebihi 8 MB. Sila pilih fail lebih kecil.";
    const allowed = ACCEPT.split(",").map((s) => s.trim());
    if (!allowed.includes(file.type)) {
      return "Format tidak disokong. Sila muat naik PDF atau imej (JPG/PNG/WebP).";
    }
    return null;
  }

  function startUploadFile(file: File) {
    const metaErr = canUploadMeta();
    if (metaErr) {
      setError(metaErr);
      setSelected(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const fileErr = validateFile(file);
    if (fileErr) {
      setError(fileErr);
      setSelected(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setSelected(file);
    setUploaded(null);
    setError(null);
    setNotice(null);

    startUpload(async () => {
      try {
        let uploadFile = file;
        let compressNotice: string | undefined;
        if (file.type.startsWith("image/")) {
          const compressed = await compressImageForLaporan(file);
          uploadFile = compressed.file;
          compressNotice = compressed.notice;
        }

        const fd = new FormData();
        fd.set("file", uploadFile);
        fd.set("orgName", orgName.trim());
        fd.set("activityDate", activityDate);
        fd.set("serviceType", serviceType);

        const res = await uploadSuratPermohonanAction(fd);
        if (!res.ok) {
          setError(res.error);
          setUploaded(null);
          return;
        }

        setUploaded(res.surat);
        setNotice(
          compressNotice
            ? `${compressNotice} Fail berjaya dimuat naik.`
            : "Fail berjaya dimuat naik.",
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat naik surat permohonan.");
        setUploaded(null);
      }
    });
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    startUploadFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0] ?? null;
    if (!file) return;
    startUploadFile(file);
  }

  function clearFile() {
    setSelected(null);
    setUploaded(null);
    setError(null);
    setNotice(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const kind = selected ? fileKind(selected.name, selected.type) : null;
  const busy = disabled || uploading;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={ACCEPT}
        disabled={busy}
        onChange={onInputChange}
        tabIndex={-1}
      />

      {uploaded && (
        <>
          <input type="hidden" name="suratStoragePath" value={uploaded.storagePath} />
          <input type="hidden" name="suratFileName" value={uploaded.fileName} />
          <input type="hidden" name="suratOriginalName" value={uploaded.originalName} />
        </>
      )}

      {!selected ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            if (!busy) setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={onDrop}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition",
            dragOver
              ? "border-primary bg-primary-soft/25"
              : "border-steel bg-cloud/40 hover:border-ink hover:bg-cloud/70",
            busy && "cursor-not-allowed opacity-50",
          )}
        >
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border",
              dragOver ? "border-primary/30 bg-white text-primary" : "border-fog bg-white text-graphite",
            )}
            aria-hidden
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V4m0 0l-4 4m4-4l4 4M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1"
              />
            </svg>
          </span>
          <span className="text-sm font-semibold text-ink">
            {dragOver ? "Lepaskan fail di sini" : "Ketik untuk pilih fail"}
          </span>
          <span className="text-xs text-graphite">
            atau seret &amp; lepas surat permohonan
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-fog/70 bg-cloud/50 px-4 py-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-fog bg-white text-xs font-bold uppercase text-primary"
            aria-hidden
          >
            {kind === "pdf" ? "PDF" : "IMG"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{selected.name}</p>
            <p className="text-xs text-graphite">
              {uploading
                ? "Memuat naik ke Google Drive…"
                : uploaded
                  ? `✓ Dimuat naik · ${formatBytes(selected.size)}`
                  : formatBytes(selected.size)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className="btn-outline-ink btn-sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              Tukar
            </button>
            <button
              type="button"
              className="text-xs font-medium text-bloom-deep hover:underline disabled:opacity-50"
              disabled={busy}
              onClick={clearFile}
            >
              Buang
            </button>
          </div>
        </div>
      )}

      <p className="mt-2 text-xs text-graphite">
        PDF atau imej (JPG/PNG/WebP), maksimum 8 MB. Fail dimuat naik serta-merta selepas dipilih
        (imej akan dimampatkan). Pastikan tarikh cadangan dan nama unit/sekolah sudah diisi.
      </p>
      {notice && !error && <p className="mt-1 text-xs text-primary">{notice}</p>}
      {error && <p className="mt-1 text-xs text-bloom-deep">{error}</p>}
    </div>
  );
}
