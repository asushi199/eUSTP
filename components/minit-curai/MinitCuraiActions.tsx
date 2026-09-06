"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMinitCurai } from "@/lib/actions/minit-curai";

export default function MinitCuraiActions({
  id,
  version,
  month,
  tajuk,
}: {
  id: string;
  version: number;
  month: string;
  tajuk: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function download() {
    setBusy("pdf");
    setMessage("");
    try {
      const response = await fetch(`/admin/minit-curai/${id}/pdf`, { cache: "no-store" });
      if (!response.ok || !response.headers.get("content-type")?.includes("application/pdf")) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "PDF tidak dapat dijana. Sila log masuk semula atau cuba lagi.");
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Minit-Curai-${id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PDF tidak dapat dijana. Sila cuba lagi.");
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!window.confirm(`Padam minit curai "${tajuk}"?`)) return;
    setBusy("delete");
    setMessage("");
    try {
      const result = await deleteMinitCurai(id, version);
      if (!result.ok) { setMessage(result.error); return; }
      router.push(`/admin/minit-curai?month=${month}`);
      router.refresh();
    } catch {
      setMessage("Pemadaman belum dapat disahkan. Sila muat semula senarai minit.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={!!busy} onClick={download} className="btn-outline-ink">
          {busy === "pdf" ? "Menjana PDF…" : "Muat Turun PDF"}
        </button>
        <button type="button" disabled={!!busy} onClick={remove} className="btn-outline-ink">
          {busy === "delete" ? "Memadam…" : "Padam"}
        </button>
      </div>
      {message && <p role="alert" className="mt-2 text-sm text-red-700">{message}</p>}
    </div>
  );
}
