"use client";

import { useState } from "react";

type Props = {
  schoolCode: string;
  schoolName?: string | null;
  ticket: string;
};

function buildMemoText({
  schoolCode,
  schoolName,
  ticket,
}: Props): string {
  const lines = [
    "NEXa Manjung — Laporan Akhbar 2026",
    "Rujukan nombor tiket tinjauan",
    "",
    `Kod sekolah: ${schoolCode || "—"}`,
    schoolName ? `Nama sekolah: ${schoolName}` : null,
    `Nombor tiket: ${ticket || "—"}`,
    "",
    "Simpan fail ini. Nombor tiket diperlukan untuk mengemaskini atau menyemak status.",
    "Jika hilang, hubungi PPD Manjung — tiada carian awam untuk nombor tiket.",
  ];
  return lines.filter((line) => line != null).join("\n");
}

export default function TicketSaveActions({
  schoolCode,
  schoolName,
  ticket,
}: Props) {
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const ready = Boolean(schoolCode && ticket);

  async function onCopy() {
    if (!ready) return;
    const text = `${schoolCode} | ${ticket}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg("Disalin ke papan klip.");
    } catch {
      setCopyMsg("Gagal salin. Sila salin nombor tiket secara manual.");
    }
  }

  function onDownload() {
    if (!ready) return;
    const body = buildMemoText({ schoolCode, schoolName, ticket });
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tiket-laporan-akhbar-${schoolCode}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setCopyMsg("Fail teks dimuat turun di peranti anda.");
  }

  function onPrint() {
    window.print();
  }

  return (
    <div className="space-y-3 print:hidden">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-primary"
          disabled={!ready}
          onClick={onCopy}
        >
          Salin nombor tiket
        </button>
        <button
          type="button"
          className="btn-outline-ink"
          disabled={!ready}
          onClick={onDownload}
        >
          Muat turun .txt
        </button>
        <button
          type="button"
          className="btn-outline-ink"
          onClick={onPrint}
        >
          Cetak / simpan PDF
        </button>
      </div>
      {copyMsg && <p className="text-xs text-graphite">{copyMsg}</p>}
    </div>
  );
}
