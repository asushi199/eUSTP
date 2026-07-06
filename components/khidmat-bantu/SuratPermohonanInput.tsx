"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

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
  id = "suratPermohonan",
}: {
  disabled?: boolean;
  id?: string;
}) {
  const inputId = id;
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function applyFile(file: File | null): boolean {
    setError(null);
    if (!file) {
      setSelected(null);
      if (inputRef.current) inputRef.current.value = "";
      return false;
    }
    if (file.size > MAX_BYTES) {
      setError("Fail melebihi 8 MB. Sila pilih fail lebih kecil.");
      setSelected(null);
      if (inputRef.current) inputRef.current.value = "";
      return false;
    }
    const allowed = ACCEPT.split(",").map((s) => s.trim());
    if (!allowed.includes(file.type)) {
      setError("Format tidak disokong. Sila muat naik PDF atau imej (JPG/PNG/WebP).");
      setSelected(null);
      if (inputRef.current) inputRef.current.value = "";
      return false;
    }
    setSelected(file);
    return true;
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    applyFile(e.target.files?.[0] ?? null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0] ?? null;
    if (!file) return;
    if (applyFile(file) && inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
    }
  }

  function clearFile() {
    applyFile(null);
  }

  const kind = selected ? fileKind(selected.name, selected.type) : null;

  return (
    <div>
      <input
        ref={inputRef}
        id={inputId}
        name="suratPermohonan"
        type="file"
        className="sr-only"
        accept={ACCEPT}
        required
        disabled={disabled}
        onChange={onInputChange}
        tabIndex={-1}
      />

      {!selected ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
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
            disabled && "cursor-not-allowed opacity-50",
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
            <p className="text-xs text-graphite">{formatBytes(selected.size)}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className="btn-outline-ink btn-sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              Tukar
            </button>
            <button
              type="button"
              className="text-xs font-medium text-bloom-deep hover:underline disabled:opacity-50"
              disabled={disabled}
              onClick={clearFile}
            >
              Buang
            </button>
          </div>
        </div>
      )}

      <p className="mt-2 text-xs text-graphite">
        PDF atau imej (JPG/PNG/WebP), maksimum 8 MB. Fail disimpan mengikut nama sekolah/unit
        dan bulan dalam Google Drive.
      </p>
      {error && <p className="mt-1 text-xs text-bloom-deep">{error}</p>}
    </div>
  );
}
