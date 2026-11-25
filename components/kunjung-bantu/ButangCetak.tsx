"use client";

export default function ButangCetak({ label = "Cetak / simpan PDF" }: { label?: string }) {
  return (
    <button type="button" className="btn-primary" onClick={() => window.print()}>
      {label}
    </button>
  );
}
