/**
 * DATA CONTOH untuk pratonton dev `/dev/pentas` SAHAJA (tiada akses DB; tidak digunakan dalam
 * produksi). Nama sekolah & statistik rawak; 13 perkara = kandungan sebenar minit Bil.1/2026.
 */
import type { DataPentas, ItemPembentangan } from "@/lib/mjkd/pembentangan";

function rawak(benih: number) {
  let b = benih;
  return () => (b = (b * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const POKOK = ["Cempaka", "Kenanga", "Melati", "Teratai", "Seroja", "Mawar", "Dahlia", "Angsana", "Meranti", "Tembusu", "Ketapang", "Bakau", "Nipah", "Pandan", "Kemuning", "Cendana", "Merbau", "Jati", "Tualang", "Rambai", "Kasturi", "Delima", "Belimbing", "Kesumba", "Selasih", "Keledang", "Gelam", "Pulai", "Rengas", "Medang"];
const AWAL = ["Taman", "Bukit", "Kampung", "Sungai", "Seri", "Bandar", "Telok", "Batu", "Padang", "Changkat"];
const CINA = ["Hua", "Min", "Chung", "Yuk", "Pei", "Kai", "Wah", "Nan", "Sin", "Keng", "Tak", "Yit", "Ping", "Hwa", "Choon", "Ming"];

const PERKARA: [string, string, string, string, string][] = [
  ["1.3", "10", "SEMUA", "Pengetua dan Guru Besar", "Permohonan Guru Cemerlang dan Pensyarah Cemerlang dibuka 16 Mac hingga 24 April 2026. PGB menggalakkan guru yang berminat memohon. PGB juga digalakkan memohon Pengetua Cemerlang, Guru Besar Cemerlang dan JUSA."],
  ["1.4", "10", "SEMUA", "Pengetua dan Guru Besar", "Matrik Pembelajaran (Tahun 4 pada tahun ini, Tingkatan 3 pada tahun hadapan): beri kefahaman kepada ibu bapa bahawa matrik bukan penanda aras kedudukan, tetapi untuk pengukuhan dan intervensi."],
  ["1.6", "11", "SEMUA", "Pengetua dan Guru Besar", "Budayakan PLC: tetapkan sasaran pelaksanaan PLC berdasarkan bilangan guru dan hari persekolahan, dan galakkan kolaborasi Perkongsian Amalan Terbaik dengan sekolah berdekatan."],
  ["3.3", "13", "SM", "Pengetua", "Pengarah meminta impak Dialog Prestasi Task Force yang telah dilaksanakan, dari aspek peningkatan kefahaman dan pengetahuan, pencapaian dan prestasi sekolah."],
  ["4.1.3 (iii)", "15", "SEMUA", "Pengetua dan Guru Besar", "Laporan Perbelanjaan PCG 2025: jumlah PCG diterima, peratus penggunaan, isu berbangkit dan tindakan menangani isu."],
  ["4.1.3 (vii)", "15", "SEMUA", "Pengetua dan Guru Besar", "Dasar 60:40 (STEM A): tubuhkan Jawatankuasa Task Force sekolah yang berfokus kepada kecemerlangan atau penambahan enrolmen kelas STEM A."],
  ["5.5", "17", "SM", "Semua Pengetua", "Muat turun JSU Tingkatan 4 dan modul intervensi, tukar kata laluan esces, dan pastikan kerahsiaan dokumen."],
  ["6.4", "17", "KHUSUS-SM", "Pengetua (2 sekolah)", "Program TRAS: sediakan perancangan takwim, perancangan program dan aktiviti serta One Page Report (OPR), dan kongsikan dengan Timbalan Sektor Pembelajaran."],
  ["7.3.4", "20", "KHUSUS-SR", "Guru Besar (2 sekolah)", "Sasaran 90% murid Tahap 2 hingga Tingkatan 5 cergas dalam ujian SEGAK. Isu 2025: ujian SEGAK dan PAJSK."],
  ["7.3.5", "20", "SJK", "Guru Besar SJK(C)/SJK(T)", "Rancang dan laksanakan program ko-akademik Bahasa Melayu dan Bahasa Inggeris. Guru menggunakan Bahasa Melayu sepenuhnya semasa mengajar BM."],
  ["7.4", "20", "SEMUA", "Pengetua dan Guru Besar", "Pencerapan guru dirancang dan dilaksanakan sepenuhnya menggunakan borang pencerapan: Guru Kanan, kemudian Ketua Panitia, kemudian guru mata pelajaran."],
  ["17.1–17.3, 17.6", "40–42", "SEMUA", "Pengetua dan Guru Besar", "SEGAK dan BMI 2026: maklumkan guru berkaitan isu pelaksanaan Ujian SEGAK serta tarikh Ujian 1 dan Ujian 2."],
  ["22.1", "47", "SEMUA", "Pengetua dan Guru Besar", "Pemantauan pelaksanaan kurikulum sekolah dan laporan tindakan susulan kepada PPD mengikut takwim yang ditetapkan."],
];

const STATUS = ["SELESAI", "DALAM_PELAKSANAAN", "BELUM", "TIDAK_BERKAITAN"] as const;

export type SimContoh = {
  data: DataPentas;
  versi: { utama: number; hadir: number };
  /** Sekolah belum menghantar seterusnya menghantar (semua perkara terpakai). */
  hantar: () => string | null;
  /** n sekolah baru hadir (+ pegawai). */
  hadir: (n?: number) => void;
};

export function binaContoh(hariIni: string): SimContoh {
  const r = rawak(20261021);
  const pilih = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)]!;
  const guna = new Set<string>();
  const unik = (f: () => string) => {
    let n = f();
    while (guna.has(n)) n = f();
    guna.add(n);
    return n;
  };
  const jenisSusun: string[] = [];
  for (const [j, n] of [["SK", 42], ["SJKC", 24], ["SJKT", 15], ["SM", 21]] as const) for (let i = 0; i < n; i++) jenisSusun.push(j);
  const awalanKod: Record<string, string> = { SK: "ABA", SJKC: "ABC", SJKT: "ABD", SM: "AEA" };
  const sekolah = jenisSusun.map((jenis, i) => ({
    code: `${awalanKod[jenis]}${String(1000 + i)}`,
    name: unik(() =>
      jenis === "SK"
        ? `SK ${pilih(AWAL)} ${pilih(POKOK)}`.toUpperCase()
        : jenis === "SJKC"
          ? `SJK(C) ${pilih(CINA)} ${pilih(CINA)}`.toUpperCase()
          : jenis === "SJKT"
            ? `SJK(T) LADANG ${pilih(POKOK)}`.toUpperCase()
            : `SMK ${pilih(AWAL)} ${pilih(POKOK)}`.toUpperCase(),
    ),
    jenis,
  }));
  // Satu nama sangat panjang (uji jubin 2 baris).
  sekolah[3]!.name = "SK SERI SAMUDERA LUMUT AYER TAWAR PANTAI REMIS MANJUNG";
  const sm = sekolah.filter((s) => s.jenis === "SM").map((s) => s.code);
  const sr = sekolah.filter((s) => s.jenis !== "SM").map((s) => s.code);

  const perkara = PERKARA.map(([para, ms, sasaran, tindakan, teks], i) => ({
    id: `p${i + 1}`,
    para,
    mukaSurat: ms,
    perkara: teks,
    tindakan,
    sasaran: sasaran.startsWith("KHUSUS") ? "SEMUA" : sasaran,
    sekolahKhusus: sasaran === "KHUSUS-SM" ? sm.slice(0, 2) : sasaran === "KHUSUS-SR" ? sr.slice(5, 7) : [],
    aktif: true,
    sort: i + 1,
  }));

  const terpakai = (p: (typeof perkara)[number], s: (typeof sekolah)[number]) => {
    if (p.sekolahKhusus.length) return p.sekolahKhusus.includes(s.code);
    if (p.sasaran === "SEMUA") return true;
    if (p.sasaran === "SM") return s.jenis === "SM";
    if (p.sasaran === "SJK") return s.jenis === "SJKC" || s.jenis === "SJKT";
    return false;
  };

  const catatan5w = (s: { jenis: string }) =>
    `Apa: Taklimat kepada guru dan ibu bapa berkaitan perkara ini. Siapa: ${s.jenis === "SM" ? "Pengetua" : "Guru Besar"} bersama PK Kurikulum, ${20 + Math.floor(r() * 40)} guru. Bila: ${3 + Math.floor(r() * 25)} Mac 2026. Di mana: Bilik Mesyuarat Utama. Mengapa: Memastikan semua warga sekolah memahami tindakan yang ditetapkan. Bagaimana: Taklimat 30 minit, sesi soal jawab dan edaran nota ringkas melalui kumpulan WhatsApp guru.`;

  const maklumBalas: DataPentas["maklumBalas"] = [];
  const items: ItemPembentangan[] = [];
  const hantarSekolah = (s: (typeof sekolah)[number], masa: string, cemerlang = false) => {
    const id = `mb-${s.code}`;
    maklumBalas.push({
      id,
      schoolCode: s.code,
      namaPengisi: `${pilih(["Pn.", "En.", "Dr.", "Tn."])} ${pilih(["Aisyah", "Rahman", "Lim", "Kumar", "Nurul", "Faizal", "Tan", "Siti", "Ravi", "Hafiz"])} ${pilih(["Ahmad", "Hassan", "Wei Ming", "Muthu", "Ismail"])}`,
      jawatanPengisi: s.jenis === "SM" ? "Pengetua" : "Guru Besar",
      tarikhHantar: masa,
    });
    for (const p of perkara) {
      if (!terpakai(p, s)) continue;
      const x = cemerlang ? 0 : r();
      items.push({
        id: `${id}-${p.id}`,
        maklumBalasId: id,
        perkaraId: p.id,
        status: x < 0.62 ? STATUS[0] : x < 0.84 ? STATUS[1] : x < 0.93 ? STATUS[2] : STATUS[3],
        catatan: catatan5w(s),
        pautanBukti: r() < 0.45 ? `https://www.canva.com/design/DAG${Math.floor(r() * 1e7)}/view` : "",
        fotoBukti: Array.from({ length: Math.floor(r() * 4) }, (_, k) => `contoh/${k}`),
        dipilih: r() < 0.05,
      });
    }
  };
  const asas = Date.parse("2026-10-10T01:00:00Z");
  for (const s of sekolah) {
    if (r() < 0.86) hantarSekolah(s, new Date(asas + Math.floor(r() * 7 * 86_400_000)).toISOString(), r() < 0.16);
  }
  // Contoh sengaja: catatan ringkas tanpa label, dan rentetan panjang tanpa ruang.
  const p2 = items.filter((it) => it.perkaraId === "p2");
  if (p2[0]) {
    p2[0].catatan =
      "Sekolah telah mengadakan sesi penerangan bersama ibu bapa murid Tahun 4 semasa Hari Bertemu Pelanggan. Penekanan diberikan bahawa matrik pembelajaran digunakan untuk intervensi dan bukan untuk menentukan kedudukan murid dalam kelas.";
    p2[0].fotoBukti = ["contoh/0", "contoh/1", "contoh/2"];
    p2[0].pautanBukti = "https://www.canva.com/design/DAGabcdefgh/view";
  }
  if (p2[1]) {
    p2[1].catatan =
      "Apa: Penerangan matrik. Siapa: GB. Bila: 12 Mac 2026. Di mana: Dewan. Mengapa: Kefahaman ibu bapa. Bagaimana: Rujukan bukti — https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEfGhIjKlMnOpQrStUvWxYz" +
      "x".repeat(220);
  }
  if (p2[2]) p2[2].catatan = "Y".repeat(300);

  const rekod: DataPentas["kehadiran"]["rekod"] = [];
  const sektor = ["Pembelajaran", "Pembangunan Murid", "Pengurusan Sekolah", "Perancangan", ""];
  for (const s of sekolah) if (r() < 0.6) rekod.push({ jenis: "PGB", schoolCode: s.code, tarikh: hariIni });
  for (let i = 0; i < 23; i++) rekod.push({ jenis: "PEGAWAI", schoolCode: null, tarikh: hariIni, sektor: pilih(sektor) });

  const data: DataPentas = {
    rujukan: { bil: 1, tahun: 2026, tarikh: "2026-02-27", tempat: "Park Avenue Hotel, Sungai Petani Kedah", minitUrl: "" },
    perkara,
    sekolah: sekolah.map(({ code, name }) => ({ code, name })),
    maklumBalas,
    items,
    bahan: [
      { id: "b1", sektorUnit: "Sektor Pembelajaran", tajuk: "Analisis UASA dan PBD 2026", namaPembentang: "Pn. Rohana binti Ahmad", hari: ["2026-10-21"], jenis: "PAUTAN", url: "https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrSt/edit", storagePath: "", createdAt: "2026-10-01T01:00:00Z" },
      { id: "b2", sektorUnit: "Sektor Pembangunan Murid", tajuk: "SEGAK, PAJSK dan kokurikulum", namaPembentang: "En. Hafiz Rahman", hari: ["2026-10-21"], jenis: "PAUTAN", url: "https://www.canva.com/design/DAGabcdefgh/view", storagePath: "", createdAt: "2026-10-02T01:00:00Z" },
      { id: "b3", sektorUnit: "USTP", tajuk: "Pendigitalan PdP dan DELIMa", namaPembentang: "Cik Aisyah M.", hari: ["2026-10-22"], jenis: "PAUTAN", url: "https://contoh.my/bahan-tidak-boleh-benam", storagePath: "", createdAt: "2026-10-03T01:00:00Z" },
    ],
    kehadiran: { hariIni, rekod },
    dimuatPada: new Date().toISOString(),
  };

  const sim: SimContoh = {
    data,
    versi: { utama: 1, hadir: 1 },
    hantar: () => {
      const sudah = new Set(data.maklumBalas.map((m) => m.schoolCode));
      const s = sekolah.find((x) => !sudah.has(x.code));
      if (!s) return null;
      hantarSekolah(s, new Date().toISOString());
      sim.versi.utama += 1;
      return s.name;
    },
    hadir: (n = 1) => {
      const sudah = new Set(rekod.map((x) => x.schoolCode));
      for (const s of sekolah.filter((x) => !sudah.has(x.code)).slice(0, n)) {
        rekod.push({ jenis: "PGB", schoolCode: s.code, tarikh: hariIni });
      }
      if (r() < 0.5) rekod.push({ jenis: "PEGAWAI", schoolCode: null, tarikh: hariIni, sektor: pilih(sektor) });
      sim.versi.hadir += 1;
    },
  };
  return sim;
}

/** Gambar contoh (SVG data URL) — satu potret untuk menguji `object-fit: contain`. */
export function fotoContoh(path: string): string {
  const i = Number(path.split("/")[1] ?? 0);
  const tema = [
    ["#0E7490", "#E3B341", "Taklimat ibu bapa"],
    ["#10B981", "#0b2530", "Sesi PLC guru"],
    ["#F43F5E", "#F5D27A", "Bengkel STEM A (potret)"],
  ][i % 3]!;
  const [w, h] = i % 3 === 2 ? [600, 900] : [900, 600];
  return (
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><defs><linearGradient id='g' x2='1' y2='1'><stop offset='0' stop-color='${tema[0]}'/><stop offset='1' stop-color='${tema[1]}'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><rect x='8' y='8' width='${w - 16}' height='${h - 16}' fill='none' stroke='#fff' stroke-width='8'/><text x='50%' y='50%' font-family='sans-serif' font-size='44' fill='#fff' text-anchor='middle'>${tema[2]}</text></svg>`,
    )
  );
}
