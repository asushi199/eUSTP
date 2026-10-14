import { urlBukaFotoBukti, urlFotoBukti } from "@/lib/mjkd/validation";

/** Gambar kecil bukti (Drive) — klik untuk buka saiz penuh di tab baharu. */
export default function FotoBuktiThumbs({
  foto,
  className = "",
}: {
  foto: readonly string[];
  className?: string;
}) {
  if (foto.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {foto.map((f, i) => (
        <a
          key={f}
          href={urlBukaFotoBukti(f)}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-md border hairline bg-cloud"
          title={`Gambar bukti ${i + 1}`}
        >
          <img
            src={urlFotoBukti(f, 400)}
            alt={`Gambar bukti ${i + 1}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-24 w-32 object-cover"
          />
        </a>
      ))}
    </div>
  );
}
