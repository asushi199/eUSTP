"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveUstpReport } from "@/lib/actions/laporan-ustp";
import { janaTeksLaporan } from "@/lib/actions/laporan-ustp-ai";
import { compressImageForLaporan } from "@/lib/client/compress-image";
import type { UstpReport } from "@/lib/schema";
import { USTP_CLUSTERS, USTP_EQUIPMENT, USTP_PHOTO_MAX_BYTES, USTP_PKGS, USTP_TERAS, formatUstpMoney } from "@/lib/laporan-ustp/options";

const AMOUNTS = [
  ["os29000Sen", "OS29000 (RM)"], ["os42000Sen", "OS42000 (RM)"],
  ["os21000Sen", "OS21000 (RM)"], ["otherSen", "Peruntukan lain (RM)"],
] as const;

export default function UstpReportForm({ id, responsibleByPkgCode, report }: { id: string; responsibleByPkgCode: Record<string, string>; report?: UstpReport }) {
  const router = useRouter();
  const [pkgCode, setPkgCode] = useState(report?.pkgCode ?? "");
  const selectedPkg = USTP_PKGS.find((pkg) => pkg.code === pkgCode);
  const [preparedBy, setPreparedBy] = useState(report?.preparedBy ?? "");
  const preparedByOptions = useMemo(() => {
    const names = new Set(Object.values(responsibleByPkgCode));
    if (preparedBy) names.add(preparedBy); // kekalkan nilai sedia ada (rekod lama)
    return Array.from(names);
  }, [responsibleByPkgCode, preparedBy]);
  const [objectives, setObjectives] = useState(report?.objectives ?? "");
  const [reflection, setReflection] = useState(report?.reflection ?? "");
  const [dapatan, setDapatan] = useState("");
  const [refleksiBebas, setRefleksiBebas] = useState(false);
  const [aiField, setAiField] = useState<null | "objektif" | "refleksi">(null);
  const [aiError, setAiError] = useState<{ field: "objektif" | "refleksi"; msg: string } | null>(null);
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

  async function janaTeks(field: "objektif" | "refleksi", form: HTMLFormElement | null) {
    if (!form || aiField) return;
    const fd = new FormData(form);
    const programName = String(fd.get("programName") ?? "").trim();
    if (!programName) {
      setAiError({ field, msg: "Sila isi Nama program dahulu sebelum menjana." });
      return;
    }
    setAiError(null);
    setAiField(field);
    try {
      const res = await janaTeksLaporan({
        field,
        programName,
        cluster: String(fd.get("cluster") ?? ""),
        teras: fd.getAll("teras").map(String),
        schoolCount: Number(fd.get("schoolCount") ?? 0),
        teacherCount: Number(fd.get("teacherCount") ?? 0),
        studentCount: Number(fd.get("studentCount") ?? 0),
        communityCount: Number(fd.get("communityCount") ?? 0),
        location: String(fd.get("location") ?? ""),
        organiser: String(fd.get("organiser") ?? ""),
        dapatan: field === "refleksi" && !refleksiBebas ? dapatan : "",
      });
      if (!res.ok) {
        setAiError({ field, msg: res.error });
        return;
      }
      if (field === "objektif") setObjectives(res.text);
      else setReflection(res.text);
    } catch {
      setAiError({ field, msg: "Penjanaan gagal. Cuba lagi." });
    } finally {
      setAiField(null);
    }
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
        <div className="space-y-5">
          <label className="block"><span className="label">KOD PKG *</span>
            <select name="pkgCode" className="input" required value={pkgCode} onChange={(event) => { const code = event.target.value; setPkgCode(code); const name = responsibleByPkgCode[code]; if (name) setPreparedBy(name); }}>
              <option value="" disabled>Pilih kod PKG</option>
              {USTP_PKGS.map((pkg) => <option key={pkg.code} value={pkg.code}>{pkg.code}</option>)}
            </select>
          </label>
          <div className="space-y-5" aria-live="polite">
            <label className="block"><span className="label">Negeri</span><input className="input bg-cloud text-steel" readOnly value={selectedPkg ? "Perak" : ""} /></label>
            <label className="block"><span className="label">SSTP/USTP</span><input className="input bg-cloud text-steel" readOnly value={selectedPkg ? "Manjung" : ""} /></label>
            <label className="block"><span className="label">PKG</span><input className="input bg-cloud text-steel" readOnly value={selectedPkg?.name ?? ""} /></label>
          </div>
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
        <div className="block">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="objectives" className="label">Objektif aktiviti *</label>
            <button type="button" className="btn-outline-ink !h-9 !min-h-0 shrink-0 px-3 py-0 text-xs" disabled={aiField !== null} onClick={(event) => janaTeks("objektif", event.currentTarget.form)}>{aiField === "objektif" ? "Menjana…" : "✨ Jana dengan AI"}</button>
          </div>
          <textarea id="objectives" name="objectives" className="textarea mt-1" rows={5} required maxLength={20000} value={objectives} onChange={(event) => setObjectives(event.target.value)} />
          {aiError?.field === "objektif" && <p role="alert" className="mt-1 text-sm text-red-700">{aiError.msg}</p>}
        </div>
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
        <div className="block">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="reflection" className="label">Refleksi *</label>
            <button type="button" className="btn-outline-ink !h-9 !min-h-0 shrink-0 px-3 py-0 text-xs" disabled={aiField !== null} onClick={(event) => janaTeks("refleksi", event.currentTarget.form)}>{aiField === "refleksi" ? "Menjana…" : "✨ Jana dengan AI"}</button>
          </div>
          <div className="mt-1 rounded-lg border hairline bg-cloud p-3">
            <label htmlFor="dapatan" className="label">Dapatan / pendapat untuk rujukan AI</label>
            <textarea id="dapatan" className="textarea mt-1" rows={3} maxLength={4000} value={dapatan} disabled={refleksiBebas} onChange={(event) => setDapatan(event.target.value)} placeholder="Cth: sambutan menggalakkan, 45 murid hadir, cabaran capaian internet…" />
            <label className="mt-2 flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-ink" checked={refleksiBebas} onChange={(event) => setRefleksiBebas(event.target.checked)} />
              Jana bebas tanpa rujukan
            </label>
            <p className="text-xs text-graphite">Medan ini hanya membantu AI — tidak disimpan dalam laporan.</p>
          </div>
          <textarea id="reflection" name="reflection" className="textarea mt-3" rows={5} required maxLength={20000} value={reflection} onChange={(event) => setReflection(event.target.value)} />
          {aiError?.field === "refleksi" && <p role="alert" className="mt-1 text-sm text-red-700">{aiError.msg}</p>}
        </div>
        <label className="block"><span className="label">Disediakan oleh *</span>
          <select name="preparedBy" className="input" required value={preparedBy} onChange={(event) => setPreparedBy(event.target.value)}>
            <option value="" disabled>Pilih pegawai bertanggungjawab</option>
            {preparedByOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
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
