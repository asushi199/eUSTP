"use client";

import { useState, useTransition } from "react";
import { muatNaikBahanAwam, type BahanDisimpan } from "@/lib/actions/mjkd-bahan";
import { BAHAN_PDF_MAKS_BYTE } from "@/lib/mjkd/bahan";
import { MESEJ_BAHAN_TIDAK_PASTI } from "@/lib/mjkd/ralat-db";

export type PilihanHariBorang = { label: string; nilai: string };

type Props = {
  pilihanHari: PilihanHariBorang[];
  cadanganSektor: string[];
};

export default function MuatNaikBahanForm({ pilihanHari, cadanganSektor }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [disimpan, setDisimpan] = useState<BahanDisimpan | null>(null);
  const [jenis, setJenis] = useState<"PAUTAN" | "PDF">("PAUTAN");
  const [kunciBorang, setKunciBorang] = useState(0);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const fail = formData.get("fail");
    if (jenis === "PDF" && fail instanceof File && fail.size > BAHAN_PDF_MAKS_BYTE) {
      setError("Fail PDF melebihi 3 MB. Sila kecilkan fail atau guna pautan.");
      return;
    }
    if (jenis === "PAUTAN") formData.delete("fail");
    startTransition(async () => {
      let res: Awaited<ReturnType<typeof muatNaikBahanAwam>>;
      try {
        res = await muatNaikBahanAwam(formData);
      } catch {
        // Rangkaian/500: fail mungkin sudah dimuat naik — status tidak pasti.
        setError(MESEJ_BAHAN_TIDAK_PASTI);
        return;
      }
      if (!res.ok || !res.bahan) {
        setError(res.error ?? "Gagal memuat naik bahan.");
        return;
      }
      setDisimpan(res.bahan);
    });
  }

  if (disimpan) {
    return (
      <section className="card p-6" aria-live="polite">
        <h2 className="text-xl font-semibold text-ink">Bahan berjaya disimpan</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-graphite">Sektor / Unit</dt>
            <dd className="font-semibold text-ink">{disimpan.sektorUnit}</dd>
          </div>
          <div>
            <dt className="text-graphite">Tajuk bahan</dt>
            <dd className="text-ink">{disimpan.tajuk}</dd>
          </div>
          <div>
            <dt className="text-graphite">Nama pembentang</dt>
            <dd className="text-ink">{disimpan.namaPembentang}</dd>
          </div>
          <div>
            <dt className="text-graphite">Tarikh pembentangan</dt>
            <dd className="text-ink">{disimpan.hariLabel}</dd>
          </div>
          <div>
            <dt className="text-graphite">{disimpan.jenis === "PDF" ? "Fail PDF" : "Pautan"}</dt>
            <dd className="break-all text-ink">
              <a href={disimpan.url} target="_blank" rel="noopener noreferrer" className="link-blue">
                {disimpan.jenis === "PDF" ? "Papar fail" : disimpan.url}
              </a>
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-graphite">
          Untuk membuat pembetulan, sila hubungi urusetia MJKD (pembentang tidak boleh menyunting
          sendiri).
        </p>
        <button
          type="button"
          className="btn-outline-ink mt-6"
          onClick={() => {
            setDisimpan(null);
            setKunciBorang((k) => k + 1);
          }}
        >
          Muat naik bahan lain
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6" key={kunciBorang}>
      <div>
        <label className="label" htmlFor="bahan-kod">
          Kod muat naik *
        </label>
        <input
          id="bahan-kod"
          name="kod"
          className="input font-mono uppercase"
          required
          autoComplete="off"
          maxLength={20}
          placeholder="XXXX-XXXX"
        />
        <p className="mt-1 text-xs text-graphite">Kod diberi oleh urusetia MJKD.</p>
      </div>

      <div>
        <label className="label" htmlFor="bahan-sektor">
          Sektor / Unit *
        </label>
        <input
          id="bahan-sektor"
          name="sektorUnit"
          className="input"
          required
          maxLength={150}
          list="bahan-sektor-cadangan"
          autoComplete="off"
        />
        <datalist id="bahan-sektor-cadangan">
          {cadanganSektor.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="label" htmlFor="bahan-tajuk">
          Tajuk bahan *
        </label>
        <input id="bahan-tajuk" name="tajuk" className="input" required maxLength={300} />
      </div>

      <div>
        <label className="label" htmlFor="bahan-pembentang">
          Nama pembentang *
        </label>
        <input
          id="bahan-pembentang"
          name="namaPembentang"
          className="input"
          required
          maxLength={200}
        />
      </div>

      <fieldset>
        <legend className="label">Tarikh pembentangan *</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {pilihanHari.map((p, i) => (
            <label key={p.nilai} className="block cursor-pointer">
              <input
                type="radio"
                name="hari"
                value={p.nilai}
                className="peer sr-only"
                required
                defaultChecked={i === 0 && pilihanHari.length === 1}
              />
              <span className="flex min-h-11 items-center rounded-md border border-steel bg-white px-4 py-2 text-sm text-ink transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2">
                {p.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Jenis bahan *</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["PAUTAN", "Pautan"],
              ["PDF", "Fail PDF (maks 3 MB)"],
            ] as const
          ).map(([nilai, label]) => (
            <label key={nilai} className="block cursor-pointer">
              <input
                type="radio"
                name="jenis"
                value={nilai}
                className="peer sr-only"
                checked={jenis === nilai}
                onChange={() => setJenis(nilai)}
              />
              <span className="flex min-h-11 items-center rounded-md border border-steel bg-white px-4 py-2 text-sm text-ink transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {jenis === "PAUTAN" ? (
        <div>
          <label className="label" htmlFor="bahan-url">
            Pautan bahan (https) *
          </label>
          <input
            id="bahan-url"
            name="url"
            className="input"
            type="url"
            inputMode="url"
            required
            maxLength={1000}
            placeholder="https://www.canva.com/design/… atau pautan Google Slides"
          />
          <div className="mt-2 rounded-lg border hairline bg-cloud/60 px-4 py-3 text-xs leading-relaxed text-charcoal">
            <p className="font-semibold text-ink">Supaya bahan boleh dipratonton terus di laman:</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>
                <span className="font-semibold">Canva:</span> klik <em>Kongsi</em> (Share) → di
                bawah &quot;Akses pautan&quot; pilih{" "}
                <em>Sesiapa yang ada pautan</em> (Anyone with the link) → salin pautan.
              </li>
              <li>
                <span className="font-semibold">Google Slides / Docs / Drive:</span> kongsi sebagai
                &quot;sesiapa yang ada pautan boleh melihat&quot;.
              </li>
              <li>Pautan lain tetap diterima, tetapi hanya boleh dibuka di tab baharu.</li>
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="bahan-fail">
            Fail PDF *
          </label>
          <input
            id="bahan-fail"
            name="fail"
            className="input"
            type="file"
            accept="application/pdf,.pdf"
            required
          />
        </div>
      )}

      {error && (
        <p className="rounded-md border border-bloom-deep/30 bg-white px-4 py-3 text-sm text-bloom-deep">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? "Memuat naik…" : "Hantar bahan"}
      </button>
    </form>
  );
}
