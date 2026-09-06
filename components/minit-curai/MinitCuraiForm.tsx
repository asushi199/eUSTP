"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveMinitCurai } from "@/lib/actions/minit-curai";
import { janaKandunganMinit } from "@/lib/actions/minit-curai-ai";
import {
  MINIT_CURAI_GRADES,
  MINIT_CURAI_KAEDAH,
  MINIT_CURAI_STEPS,
  MINIT_CURAI_UNIT,
  emptyMinitItem,
  todayYmd,
  type MinitCuraiStepId,
} from "@/lib/minit-curai/options";
import {
  parseMinitCuraiStepA,
  parseMinitCuraiStepB,
  parseMinitCuraiStepC,
} from "@/lib/minit-curai/validation";
import type { MinitCuraiItem } from "@/lib/schema";

type Officer = { nama: string; jawatan: string };

type MinitFormReport = {
  version: number;
  items: MinitCuraiItem[];
  kaedah: string[];
  reporterName: string;
  reporterTitle: string;
  unitSektor: string;
  tajuk: string;
  anjuran: string;
  meetingDate: string;
  meetingTime: string;
  tempat: string;
  chairperson: string;
  rujukanFail: string;
  lampiran: string;
  targetDate: string | null;
  disebarkanKepada: string;
  tarikhCurai: string;
  kaedahLain: string;
  preparedByName: string;
  preparedByTitle: string;
  preparedAt: string;
  reviewedByName: string;
  reviewedByTitle: string;
  reviewedAt: string | null;
};

export default function MinitCuraiForm({
  id,
  currentUser,
  reporters,
  report,
}: {
  id: string;
  currentUser: Officer;
  reporters: string[];
  report?: MinitFormReport;
}) {
  const router = useRouter();
  const [step, setStep] = useState<MinitCuraiStepId>("A");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<MinitCuraiItem[]>(
    report?.items.length ? report.items : [emptyMinitItem()],
  );
  const [kaedah, setKaedah] = useState<string[]>(report?.kaedah ?? []);
  const [notes, setNotes] = useState("");
  const [briefing, setBriefing] = useState<File | null>(null);
  const [briefingKey, setBriefingKey] = useState(0);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [lastSource, setLastSource] = useState("");
  const officerNames = useMemo(() => {
    const names = new Set(reporters.filter(Boolean));
    if (report?.reporterName) names.add(report.reporterName);
    if (report?.preparedByName) names.add(report.preparedByName);
    if (report?.reviewedByName) names.add(report.reviewedByName);
    return Array.from(names);
  }, [reporters, report]);
  const defaultOfficer = reporters.includes(currentUser.nama) ? currentUser.nama : "";
  const defaultReporter = report?.reporterName || defaultOfficer;
  const gradeOptions = useMemo(() => {
    const grades = new Set<string>(MINIT_CURAI_GRADES);
    if (report?.reporterTitle) grades.add(report.reporterTitle);
    return Array.from(grades);
  }, [report?.reporterTitle]);

  function applyStep(next: MinitCuraiStepId, form: HTMLFormElement) {
    const data = new FormData(form);
    const parsed = step === "A"
      ? parseMinitCuraiStepA(data)
      : step === "B"
        ? parseMinitCuraiStepB(items)
        : parseMinitCuraiStepC(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Sila semak borang.");
      return;
    }
    setError("");
    setStep(next);
  }

  function updateItem(index: number, key: keyof MinitCuraiItem, value: string) {
    setItems((current) => current.map((item, slot) => slot === index ? { ...item, [key]: value } : item));
  }

  function sourceKey() {
    return `${notes.trim()}|${briefing ? `${briefing.name}:${briefing.size}:${briefing.lastModified}` : ""}`;
  }

  async function janaKandungan(form: HTMLFormElement | null) {
    const source = sourceKey();
    if (!form || aiBusy || (lastSource !== "" && source === lastSource)) return;
    if (!notes.trim() && !briefing) {
      setAiError("Sila tampal nota atau muat naik PDF/PPTX dahulu sebelum menjana.");
      return;
    }
    setAiBusy(true);
    setAiError("");
    setError("");
    try {
      const data = new FormData(form);
      const payload = new FormData();
      payload.set("notes", notes);
      payload.set("tajuk", String(data.get("tajuk") ?? ""));
      payload.set("anjuran", String(data.get("anjuran") ?? ""));
      payload.set("chairperson", String(data.get("chairperson") ?? ""));
      payload.set("unitSektor", String(data.get("unitSektor") ?? ""));
      payload.set("officers", JSON.stringify(officerNames));
      if (briefing) payload.set("fail", briefing);
      const result = await janaKandunganMinit(payload);
      if (!result.ok) {
        setAiError(result.error);
        return;
      }
      setItems(result.items);
      setLastSource(source);
    } catch {
      setAiError("Penjanaan gagal. Cuba lagi.");
    } finally {
      setAiBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (step !== "C") {
      applyStep(step === "A" ? "B" : "C", event.currentTarget);
      return;
    }
    const form = new FormData(event.currentTarget);
    const parsed = parseMinitCuraiStepC(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Sila semak borang.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await saveMinitCurai(form);
      if (!result.ok) { setError(result.error); return; }
      router.push(`/admin/minit-curai/${result.id}?saved=1`);
      router.refresh();
    } catch {
      setError("Simpanan belum dapat disahkan. Semak senarai minit sebelum mencuba lagi.");
    } finally {
      setSaving(false);
    }
  }

  const stepIndex = MINIT_CURAI_STEPS.findIndex((item) => item.id === step);

  return (
    <form onSubmit={submit} className="mt-6 space-y-6">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="version" value={report?.version ?? 0} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <ol className="grid gap-3 sm:grid-cols-3" aria-label="Peringkat borang">
        {MINIT_CURAI_STEPS.map((item, index) => {
          const current = item.id === step;
          const done = index < stepIndex;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`flex min-h-11 w-full items-start gap-3 rounded-lg border px-3 py-3 text-left ${
                  current ? "border-ink bg-cloud" : "hairline"
                }`}
                onClick={(event) => {
                  if (index <= stepIndex) {
                    setError("");
                    setStep(item.id);
                    return;
                  }
                  applyStep(item.id, event.currentTarget.form!);
                }}
              >
                <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  current || done ? "bg-ink text-white" : "bg-fog text-graphite"
                }`}>{item.id}</span>
                <span>
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-graphite">{item.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <fieldset disabled={saving} hidden={step !== "A"} className="card space-y-5 p-5 sm:p-7">
          <legend className="sr-only">A. Butiran laporan</legend>
          <h2 className="text-lg font-semibold">A. Butiran laporan</h2>
          <label className="block">
            <span className="label">Nama pegawai / pelapor *</span>
            <select name="reporterName" className="input" required defaultValue={defaultReporter}>
              <option value="" disabled>Pilih pegawai</option>
              {officerNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">Jawatan / gred *</span>
            <select name="reporterTitle" className="input" required defaultValue={report?.reporterTitle ?? ""}>
              <option value="" disabled>Pilih gred</option>
              {gradeOptions.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">Unit / sektor *</span>
            <input name="unitSektor" className="input bg-cloud" readOnly value={MINIT_CURAI_UNIT} />
          </label>
          <label className="block">
            <span className="label">Tajuk taklimat / mesyuarat / kursus / bengkel *</span>
            <input name="tajuk" className="input" required maxLength={500} defaultValue={report?.tajuk} />
          </label>
          <label className="block">
            <span className="label">Anjuran *</span>
            <input name="anjuran" className="input" required maxLength={500} defaultValue={report?.anjuran} />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="label">Tarikh *</span>
              <input type="date" name="meetingDate" className="input" required defaultValue={report?.meetingDate} />
            </label>
            <label className="block">
              <span className="label">Masa *</span>
              <input name="meetingTime" className="input" required maxLength={120} placeholder="Cth: 9.00 pagi – 12.00 tengah hari" defaultValue={report?.meetingTime} />
            </label>
          </div>
          <label className="block">
            <span className="label">Tempat / platform *</span>
            <input name="tempat" className="input" required maxLength={500} placeholder="Cth: Dewan PKG Sitiawan / Google Meet" defaultValue={report?.tempat} />
          </label>
          <label className="block">
            <span className="label">Pengerusi / pegawai yang menyampaikan *</span>
            <input name="chairperson" className="input" required maxLength={200} defaultValue={report?.chairperson} />
          </label>
          <label className="block">
            <span className="label">Rujukan / no. fail (jika ada)</span>
            <input name="rujukanFail" className="input" maxLength={200} defaultValue={report?.rujukanFail} />
          </label>
        </fieldset>

      <fieldset disabled={saving || aiBusy} hidden={step !== "B"} className="space-y-4">
          <legend className="sr-only">B. Kandungan</legend>
          <div className="card space-y-4 p-5 sm:p-7">
            <h2 className="text-lg font-semibold">B. Kandungan</h2>
            <p className="text-sm text-graphite">
              Tampal nota atau muat naik PDF/PPTX. AI memecahkan kepada beberapa perkara secara automatik — semak sebelum menyimpan.
            </p>
            <label className="block">
              <span className="label">Nota pegawai untuk rujukan AI</span>
              <textarea
                className="textarea mt-1"
                rows={6}
                maxLength={8000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Tampal nota mesyuarat, chat atau draf — BM, Inggeris, Cina atau campur."
              />
            </label>
            <label className="block">
              <span className="label">Fail taklimat (PDF atau PPTX)</span>
              <input
                key={briefingKey}
                type="file"
                accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                className="mt-1 block min-h-11 w-full text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setBriefing(file);
                }}
              />
              {briefing ? (
                <p className="mt-1 text-xs text-graphite">
                  {briefing.name} · fail dibaca untuk AI sahaja, tidak disimpan.
                  {" "}
                  <button
                    type="button"
                    className="font-medium text-ink underline-offset-2 hover:underline"
                    onClick={() => {
                      setBriefing(null);
                      setBriefingKey((key) => key + 1);
                    }}
                  >
                    Buang fail
                  </button>
                </p>
              ) : (
                <p className="mt-1 text-xs text-graphite">
                  Maksimum 4MB, tidak masuk Storage. PDF bertulis murah; PDF imbasan/gambar dibaca AI (20 halaman pertama).
                </p>
              )}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-outline-ink disabled:cursor-not-allowed disabled:opacity-50"
                disabled={aiBusy || (lastSource !== "" && sourceKey() === lastSource)}
                title={lastSource !== "" && sourceKey() === lastSource ? "Ubah nota atau fail untuk jana semula" : undefined}
                onClick={(event) => void janaKandungan(event.currentTarget.form)}
              >
                {aiBusy ? "Menjana…" : "✨ Jana dengan AI"}
              </button>
              <p className="text-xs text-graphite">AI menjana beberapa perkara. Hasil menggantikan baris sedia ada. Nota dan fail tidak disimpan.</p>
            </div>
            {aiError && <p role="alert" className="text-sm text-red-700">{aiError}</p>}
          </div>
          {items.map((item, index) => (
            <div key={index} className="card space-y-4 p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">Perkara {index + 1}</h3>
                {items.length > 1 && (
                  <button type="button" className="text-sm text-graphite underline-offset-2 hover:underline" onClick={() => setItems((current) => current.filter((_, slot) => slot !== index))}>
                    Buang
                  </button>
                )}
              </div>
              <label className="block">
                <span className="label">Perkara / isu / makluman *</span>
                <textarea className="textarea" rows={3} required maxLength={4000} value={item.perkara} onChange={(event) => updateItem(index, "perkara", event.target.value)} />
              </label>
              <label className="block">
                <span className="label">Keputusan / penjelasan *</span>
                <textarea className="textarea" rows={3} required maxLength={4000} value={item.keputusan} onChange={(event) => updateItem(index, "keputusan", event.target.value)} />
              </label>
              <label className="block">
                <span className="label">Tindakan susulan *</span>
                <textarea className="textarea" rows={3} required maxLength={4000} value={item.tindakan} onChange={(event) => updateItem(index, "tindakan", event.target.value)} />
              </label>
              <label className="block">
                <span className="label">Pegawai / unit bertanggungjawab *</span>
                <input className="input" required maxLength={500} value={item.pegawai} onChange={(event) => updateItem(index, "pegawai", event.target.value)} />
              </label>
            </div>
          ))}
          <button type="button" className="btn-outline-ink" disabled={items.length >= 30} onClick={() => setItems((current) => [...current, emptyMinitItem()])}>
            Tambah perkara
          </button>
        </fieldset>

      <div hidden={step !== "C"} className="space-y-6">
          <input type="hidden" name="rumusan" value="" />
          <fieldset disabled={saving} className="card space-y-5 p-5 sm:p-7">
            <legend className="sr-only">C. Catatan pelapor</legend>
            <h2 className="text-lg font-semibold">C. Catatan pelapor</h2>
            <p className="text-sm text-graphite">Perkara, keputusan dan tindakan sudah ada dalam Kandungan. Isi lampiran atau tarikh sasaran jika perlu.</p>
            <label className="block">
              <span className="label">Lampiran / bahan diterima</span>
              <textarea name="lampiran" className="textarea" rows={3} maxLength={4000} defaultValue={report?.lampiran} placeholder="Cth: slaid taklimat, minit rasmi, pekeliling" />
            </label>
            <label className="block">
              <span className="label">Tarikh sasaran tindakan susulan selesai</span>
              <input type="date" name="targetDate" className="input" defaultValue={report?.targetDate ?? ""} />
            </label>
          </fieldset>

          <fieldset disabled={saving} className="card space-y-5 p-5 sm:p-7">
            <legend className="sr-only">Penyebaran curai kepada staf</legend>
            <h2 className="text-lg font-semibold">Penyebaran (curai) kepada staf</h2>
            <label className="block">
              <span className="label">Disebarkan kepada *</span>
              <input name="disebarkanKepada" className="input" required maxLength={2000} defaultValue={report?.disebarkanKepada} placeholder="Cth: Semua pegawai USTP / staf PKG Sitiawan" />
            </label>
            <label className="block">
              <span className="label">Tarikh curai kepada staf *</span>
              <input type="date" name="tarikhCurai" className="input" required defaultValue={report?.tarikhCurai ?? todayYmd()} />
            </label>
            <fieldset>
              <legend className="label">Kaedah penyebaran *</legend>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {MINIT_CURAI_KAEDAH.map((item) => (
                  <label key={item} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="kaedah"
                      value={item}
                      className="h-4 w-4 accent-ink"
                      checked={kaedah.includes(item)}
                      onChange={(event) => setKaedah((current) => event.target.checked ? [...current, item] : current.filter((value) => value !== item))}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </fieldset>
            {kaedah.includes("Lain-lain") && (
              <label className="block">
                <span className="label">Nyatakan kaedah lain *</span>
                <input name="kaedahLain" className="input" required maxLength={200} defaultValue={report?.kaedahLain} />
              </label>
            )}
          </fieldset>

          <fieldset disabled={saving} className="card space-y-5 p-5 sm:p-7">
            <legend className="sr-only">Pengesahan</legend>
            <h2 className="text-lg font-semibold">Pengesahan</h2>
            <p className="text-sm font-medium">Disediakan oleh</p>
            <label className="block">
              <span className="label">Nama *</span>
              <select name="preparedByName" className="input" required defaultValue={report?.preparedByName || defaultOfficer}>
                <option value="" disabled>Pilih pegawai</option>
                {officerNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">Jawatan / unit *</span>
              <input name="preparedByTitle" className="input" required maxLength={200} defaultValue={report?.preparedByTitle ?? ""} />
            </label>
            <label className="block">
              <span className="label">Tarikh *</span>
              <input type="date" name="preparedAt" className="input" required defaultValue={report?.preparedAt ?? todayYmd()} />
            </label>
            <p className="pt-2 text-sm font-medium">Disemak / disahkan oleh</p>
            <label className="block">
              <span className="label">Nama</span>
              <input name="reviewedByName" className="input" maxLength={200} list="minit-officer" defaultValue={report?.reviewedByName} />
              <datalist id="minit-officer">{officerNames.map((name) => <option key={name} value={name} />)}</datalist>
            </label>
            <label className="block">
              <span className="label">Jawatan / unit</span>
              <input name="reviewedByTitle" className="input" maxLength={200} defaultValue={report?.reviewedByTitle} />
            </label>
            <label className="block">
              <span className="label">Tarikh</span>
              <input type="date" name="reviewedAt" className="input" defaultValue={report?.reviewedAt ?? ""} />
            </label>
          </fieldset>
        </div>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        {step !== "A" && (
          <button type="button" className="btn-outline-ink" disabled={saving || aiBusy} onClick={() => { setError(""); setStep(step === "C" ? "B" : "A"); }}>
            Kembali
          </button>
        )}
        {step !== "C" ? (
          <button type="button" className="btn-primary" disabled={saving || aiBusy} onClick={(event) => applyStep(step === "A" ? "B" : "C", event.currentTarget.form!)}>
            Seterusnya
          </button>
        ) : (
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan minit…" : "Simpan Minit"}</button>
        )}
        <Link href={report ? `/admin/minit-curai/${id}` : "/admin/minit-curai"} className="btn-outline-ink">Batal</Link>
      </div>
    </form>
  );
}
