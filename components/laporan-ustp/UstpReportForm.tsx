"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveUstpReport } from "@/lib/actions/laporan-ustp";
import { compressImageForLaporan } from "@/lib/client/compress-image";
import type { UstpReport } from "@/lib/schema";
import { USTP_CLUSTERS, USTP_EQUIPMENT, USTP_PHOTO_MAX_BYTES, USTP_PKGS, USTP_TERAS, formatUstpMoney } from "@/lib/laporan-ustp/options";

const AMOUNTS = [
  ["os29000Sen", "OS29000 (RM)"], ["os42000Sen", "OS42000 (RM)"],
  ["os21000Sen", "OS21000 (RM)"], ["otherSen", "Peruntukan lain (RM)"],
] as const;

export default function UstpReportForm({ id, preparedBy, report }: { id: string; preparedBy: string; report?: UstpReport }) {
  const router = useRouter();
  const [equipmentUsed, setEquipmentUsed] = useState(report?.equipmentUsed ?? "Tidak");
  const [equipment, setEquipment] = useState<string[]>(report?.equipment ?? []);
  const [startDate, setStartDate] = useState(report?.startDate ?? "");
  const [amounts, setAmounts] = useState(() => Object.fromEntries(AMOUNTS.map(([key]) => [key, ((report?.[key] ?? 0) / 100).toFixed(2)])));
  const [picked, setPicked] = useState<Array<{ file: File; url: string } | null>>([null, null]);
  const previewUrls = useRef<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedWarning, setSavedWarning] = useState("");
  const busy = saving || processing;
  const total = Object.values(amounts).reduce((sum, value) => sum + Math.round((Number(value) || 0) * 100), 0);

  useEffect(() => () => { previewUrls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  async function pickPhoto(index: number, file: File | undefined) {
    if (!file) return;
    setProcessing(true);
    setError("");
    try {
      const compressed = await compressImageForLaporan(file, { forceJpeg: true });
      if (compressed.file.size > USTP_PHOTO_MAX_BYTES) throw new Error("Gambar melebihi 3 MB selepas mampatan. Sila pilih gambar lebih kecil.");
      const url = URL.createObjectURL(compressed.file);
      const oldUrl = picked[index]?.url;
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      previewUrls.current = previewUrls.current.filter((item) => item !== oldUrl).concat(url);
      setPicked((previous) => previous.map((old, slot) => slot === index ? { file: compressed.file, url } : old));
    } catch {
      setError("Gambar tidak dapat diproses. Sila pilih gambar JPG, PNG atau WebP yang lebih kecil.");
    } finally { setProcessing(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || savedWarning) return;
    const form = new FormData(event.currentTarget);
    picked.forEach((photo, index) => { if (photo) form.set(`photo${index}`, photo.file); });
    setSaving(true);
    setError("");
    try {
      const result = await saveUstpReport(form);
      if (!result.ok) { setError(result.error); return; }
      if (result.warning) { setSavedWarning(result.warning); return; }
      router.push(`/admin/laporan-ustp/${result.id}?saved=1`);
      router.refresh();
    } catch {
      setError("Simpanan belum dapat disahkan. Semak senarai laporan sebelum mencuba lagi.");
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-6">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="version" value={report?.version ?? 0} />
      <fieldset disabled={busy || !!savedWarning} className="card space-y-5 p-5 sm:p-7">
        <legend className="sr-only">Maklumat program</legend>
        <h2 className="text-lg font-semibold">Maklumat program</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="label">KOD PKG *</span>
            <select name="pkgCode" className="input" required defaultValue={report?.pkgCode ?? ""}>
              <option value="" disabled>Pilih PKG</option>
              {USTP_PKGS.map((pkg) => <option key={pkg.code} value={pkg.code}>{pkg.code} {pkg.name}</option>)}
            </select>
          </label>
          <label className="block"><span className="label">Kluster program/aktiviti *</span>
            <select name="cluster" className="input" required defaultValue={report?.cluster ?? ""}>
              <option value="" disabled>Pilih kluster</option>
              {USTP_CLUSTERS.map((cluster) => <option key={cluster}>{cluster}</option>)}
            </select>
          </label>
        </div>
        <label className="block"><span className="label">Nama program/aktiviti *</span><input name="programName" className="input" required maxLength={500} defaultValue={report?.programName} /></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="label">Tarikh mula *</span><input type="date" name="startDate" className="input" required value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label className="block"><span className="label">Tarikh akhir *</span><input type="date" name="endDate" className="input" required min={startDate || undefined} defaultValue={report?.endDate} /></label>
          <label className="block"><span className="label">Tempat *</span><input name="location" className="input" required maxLength={500} defaultValue={report?.location} /></label>
          <label className="block"><span className="label">Penganjur *</span><input name="organiser" className="input" required maxLength={500} defaultValue={report?.organiser} /></label>
        </div>
      </fieldset>
      <fieldset disabled={busy || !!savedWarning} className="card space-y-5 p-5 sm:p-7">
        <legend className="sr-only">Penyertaan dan objektif</legend>
        <h2 className="text-lg font-semibold">Penyertaan dan objektif</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {([["schoolCount", "Bil. sekolah terlibat"], ["teacherCount", "Bil. pegawai/guru terlibat"], ["studentCount", "Bil. murid terlibat"], ["communityCount", "Bil. komuniti terlibat"]] as const).map(([key, label]) => (
            <label key={key} className="block"><span className="label">{label}</span><input type="number" name={key} className="input" required min="0" max="9999999" step="1" defaultValue={report?.[key] ?? 0} /></label>
          ))}
        </div>
        <fieldset><legend className="label">Teras dalam DPD</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">{USTP_TERAS.map((teras) => <label key={teras} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="teras" value={teras} defaultChecked={report?.teras.includes(teras)} className="h-4 w-4 accent-ink" />{teras}</label>)}</div>
        </fieldset>
        <label className="block"><span className="label">Objektif aktiviti *</span><textarea name="objectives" className="textarea" rows={5} required maxLength={20000} defaultValue={report?.objectives} /></label>
      </fieldset>
      <fieldset disabled={busy || !!savedWarning} className="card space-y-5 p-5 sm:p-7">
        <legend className="sr-only">Peralatan dan peruntukan</legend>
        <h2 className="text-lg font-semibold">Peralatan dan peruntukan</h2>
        <fieldset><legend className="text-sm font-medium text-ink">Penggunaan peralatan CoE *</legend>
          <div className="flex gap-6">{["Ya", "Tidak"].map((value) => <label key={value} className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="equipmentUsed" value={value} checked={equipmentUsed === value} onChange={() => { setEquipmentUsed(value); if (value === "Tidak") setEquipment([]); }} className="h-4 w-4 accent-ink" />{value}</label>)}</div>
        </fieldset>
        {equipmentUsed === "Ya" && <fieldset><legend className="text-sm font-medium text-ink">Peralatan CoE yang digunakan *</legend>
          <div className="mt-2 grid gap-x-5 gap-y-1 sm:grid-cols-2">{USTP_EQUIPMENT.map((item) => <label key={item} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="equipment" value={item} checked={equipment.includes(item)} onChange={(event) => setEquipment((old) => event.target.checked ? [...old, item] : old.filter((value) => value !== item))} className="h-4 w-4 shrink-0 accent-ink" />{item}</label>)}</div>
        </fieldset>}
        <div className="grid gap-5 sm:grid-cols-2">
          {AMOUNTS.map(([key, label]) => <label key={key} className="block"><span className="label">{label}</span><input type="number" name={key} className="input" required min="0" max="9999999.99" step="0.01" value={amounts[key]} onChange={(event) => setAmounts((old) => ({ ...old, [key]: event.target.value }))} /></label>)}
        </div>
        <label className="block"><span className="label">Nyatakan peruntukan lain</span><input name="otherAllocation" className="input" maxLength={1000} required={Number(amounts.otherSen) > 0} defaultValue={report?.otherAllocation} /></label>
        <p className="text-sm font-semibold">Jumlah (RM): <output aria-live="polite">{formatUstpMoney(total)}</output></p>
      </fieldset>
      <fieldset disabled={busy || !!savedWarning} className="card space-y-5 p-5 sm:p-7">
        <legend className="sr-only">Refleksi dan gambar</legend>
        <h2 className="text-lg font-semibold">Refleksi dan gambar</h2>
        <label className="block"><span className="label">Refleksi *</span><textarea name="reflection" className="textarea" rows={5} required maxLength={20000} defaultValue={report?.reflection} /></label>
        <label className="block"><span className="label">Disediakan oleh *</span><input name="preparedBy" className="input" required maxLength={200} defaultValue={report?.preparedBy ?? preparedBy} /></label>
        <p className="text-sm text-graphite">Pilih dua gambar program. Gambar dimampatkan secara automatik.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          {[0, 1].map((index) => {
            const src = picked[index]?.url ?? report?.photos[index]?.publicUrl;
            return <div key={index}>
              {src && <img src={src} alt={`Gambar program ${index + 1}`} className="mb-3 h-48 w-full rounded-lg border hairline object-contain" />}
              <label className="block"><span className="label">Gambar {index + 1} *</span><input type="file" accept="image/jpeg,image/png,image/webp" required={!src} className="block min-h-11 w-full text-sm" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void pickPhoto(index, file); }} /></label>
            </div>;
          })}
        </div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {savedWarning && <p role="status" className="text-sm text-graphite">{savedWarning} <Link href={`/admin/laporan-ustp/${id}`} className="link-blue">Lihat laporan</Link></p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={busy || !!savedWarning}>{saving ? "Menyimpan laporan…" : processing ? "Memproses gambar…" : "Simpan Laporan"}</button>
        <Link href={report ? `/admin/laporan-ustp/${id}` : "/admin/laporan-ustp"} className="btn-outline-ink">Kembali</Link>
      </div>
    </form>
  );
}
