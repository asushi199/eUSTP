import Link from "next/link";
import { ROLE_ORDER, ROLE_INFO } from "@/lib/direktori/config";

export const metadata = { title: "Direktori — eUSTP Manjung" };

export default function DirektoriPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
        Direktori Guru Penyelaras
      </h1>
      <p className="mt-3 max-w-xl text-graphite">
        Rujukan terkini GPM, GPICT dan GP DELIMa bagi semua sekolah daerah
        Manjung. Pilih peranan untuk melihat senarai.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {ROLE_ORDER.map((role) => {
          const info = ROLE_INFO[role];
          return (
            <Link
              key={role}
              href={`/direktori/${info.slug}`}
              className="card group p-6 transition hover:-translate-y-0.5 hover:shadow-modal"
            >
              <p className="text-xl font-semibold">{info.short}</p>
              <p className="mt-0.5 text-sm font-medium text-charcoal">{info.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-graphite">
                {info.description}
              </p>
              <span className="link-blue mt-4 inline-block text-sm">
                Lihat senarai →
              </span>
            </Link>
          );
        })}
      </div>

      <div className="card-cloud mt-10 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold">Maklumat sekolah anda berubah?</p>
          <p className="mt-1 text-sm text-graphite">
            Kemas kini nama dan nombor telefon guru penyelaras melalui borang awam —
            tiada log masuk diperlukan.
          </p>
        </div>
        <Link href="/direktori/kemaskini" className="btn-primary shrink-0">
          Kemas Kini
        </Link>
      </div>
    </div>
  );
}
