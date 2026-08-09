"use client";

import QrCode from "@/components/tempahan/QrCode";

export default function CetakKehadiranPoster({
  title,
  programName,
  dateLine,
  timeLine,
  locationLine,
  qrUrl,
  requiresCertificate,
  logoSrc,
}: {
  title: string;
  programName: string;
  dateLine: string;
  timeLine: string;
  locationLine: string;
  qrUrl: string;
  requiresCertificate: boolean;
  logoSrc?: string | null;
}) {
  return (
    <div className="cetak-kehadiran-root mx-auto max-w-[210mm] bg-white px-6 py-8 text-ink sm:px-10">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-graphite">Pratonton poster cetak A4</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary btn-sm" onClick={() => window.print()}>
            Cetak
          </button>
          <a
            href={qrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-ink btn-sm"
          >
            Buka halaman kehadiran
          </a>
        </div>
      </div>

      <article className="cetak-kehadiran-sheet flex min-h-[260mm] flex-col items-center px-4 py-10 text-center sm:px-8">
        {logoSrc ? (
          <img src={logoSrc} alt="NEXa Manjung" className="mb-4 h-14 w-auto object-contain" />
        ) : (
          <div className="mb-4 h-14 w-14 rounded-full border border-fog bg-cloud" aria-hidden />
        )}

        <h1 className="text-xl font-bold uppercase tracking-[0.04em] sm:text-2xl">
          {title}
        </h1>

        <div className="mt-8 space-y-2 text-sm font-semibold italic leading-snug sm:text-base">
          <p className="uppercase">{programName}</p>
          <p className="uppercase">{dateLine}</p>
          <p className="uppercase">{timeLine}</p>
          <p className="uppercase">{locationLine}</p>
        </div>

        <div className="my-10 flex flex-1 items-center justify-center">
          <QrCode value={qrUrl} size={280} />
        </div>

        <p className="max-w-xl text-sm font-semibold uppercase tracking-wide">
          Sila imbas/scan kod QR di atas untuk mendaftar kehadiran anda.
        </p>

        {requiresCertificate && (
          <p className="mt-3 text-xs font-medium text-graphite">
            Kehadiran diperlukan untuk kelayakan sijil.
          </p>
        )}

        <p className="mt-10 max-w-xl text-xs italic leading-relaxed text-graphite">
          <span className="font-semibold not-italic">NOTA :</span> Sila patuhi
          peraturan-peraturan yang telah ditetapkan sebelum, semasa dan selepas
          menggunakan fasiliti. Terima kasih !
        </p>
      </article>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .cetak-kehadiran-root,
          .cetak-kehadiran-root * {
            visibility: visible !important;
          }
          .cetak-kehadiran-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .cetak-kehadiran-sheet {
            min-height: auto;
            padding: 12mm 14mm;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
