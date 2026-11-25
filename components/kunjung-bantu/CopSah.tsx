/** Cop pengesahan elektronik (SVG) untuk cetakan Kunjung Bantu yang telah disahkan. */
export default function CopSah({ tarikh, pegawai }: { tarikh: string; pegawai: string }) {
  const warna = "#1e3a8a";
  return (
    <svg
      viewBox="0 0 200 200"
      width="150"
      height="150"
      role="img"
      aria-label={`Cop pengesahan: disahkan ${tarikh}`}
      style={{ transform: "rotate(-8deg)", color: warna }}
    >
      <defs>
        <path id="cop-atas" d="M 30 100 A 70 70 0 0 1 170 100" />
        <path id="cop-bawah" d="M 22 100 A 78 78 0 0 0 178 100" />
      </defs>
      <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text fill="currentColor" fontSize="13" fontWeight="700" letterSpacing="1.5">
        <textPath href="#cop-atas" startOffset="50%" textAnchor="middle">
          USTP · PPD MANJUNG
        </textPath>
      </text>
      <text fill="currentColor" fontSize="10.5" fontWeight="600" letterSpacing="1">
        <textPath href="#cop-bawah" startOffset="50%" textAnchor="middle">
          KUNJUNG BANTU DELIMa
        </textPath>
      </text>
      <rect x="22" y="80" width="156" height="40" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <text x="100" y="108" fill="currentColor" fontSize="24" fontWeight="800" textAnchor="middle" letterSpacing="2">
        DISAHKAN
      </text>
      <text x="100" y="138" fill="currentColor" fontSize="12" fontWeight="700" textAnchor="middle">
        {tarikh}
      </text>
      <text x="100" y="153" fill="currentColor" fontSize="8.5" textAnchor="middle">
        {pegawai.length > 30 ? `${pegawai.slice(0, 29)}…` : pegawai}
      </text>
    </svg>
  );
}
