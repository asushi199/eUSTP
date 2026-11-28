"use client";

import { useMemo, useState } from "react";
import type { RekodAins } from "@/lib/tools/semak-ains/jenis";
import type { Tapisan } from "@/lib/tools/semak-ains/mesej";
import { SemakAinsPaparan, type Sambungan } from "./SemakAinsApp";
import type { Fasa, HasilLaksana, KiraLaksana, StatusTindakan } from "./useSambunganAins";

/*
 * PRATONTON DEV sahaja (/dev/semak-ains): data SINTETIK sepenuhnya — tiada nama/teks murid
 * sebenar, tiada sambungan AINS, tiada log ke DB (tanpaLog). Untuk semakan reka letak.
 */

function prng(benih: number) {
  let a = benih >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Teks dibina daripada serpihan supaya hampir unik (elak pendua palsu dalam pratonton). */
const BM = {
  watak: ["Arnab", "Kancil", "Kucing", "Rama-rama", "Nelayan", "Datuk", "Adik", "Pengakap", "Puteri", "Petani"],
  tempat: ["di Hutan", "di Kampung", "di Kebun", "di Pantai", "di Sekolah", "di Bandar"],
  a: [
    "Buku ini mengisahkan seekor arnab kecil yang tersesat di dalam hutan tebal.",
    "Cerita ini tentang dua sahabat yang membina rumah pokok selepas waktu sekolah.",
    "Watak utama ialah seorang budak yang rajin membantu jirannya di kebun sayur.",
    "Kisah ini berlaku di sebuah kampung nelayan pada musim tengkujuh.",
    "Penulis menceritakan pengalaman sebuah keluarga bercuti semasa musim buah.",
    "Buku ini menerangkan kitaran hidup rama-rama dengan gambar yang menarik.",
    "Seorang murid berlatih bersungguh-sungguh untuk pertandingan pidato daerah.",
    "Cerita ini mengisahkan seekor kucing yang kehilangan anaknya di pasar.",
  ],
  b: [
    "Dia meminta bantuan kawan-kawannya walaupun pada mulanya berasa malu.",
    "Mereka menghadapi banyak cabaran termasuk hujan lebat dan jalan yang licin.",
    "Akhirnya semua masalah dapat diselesaikan dengan sabar dan bijak.",
    "Datuknya memberi nasihat supaya tidak tergesa-gesa membuat keputusan.",
    "Semua penduduk kampung bergotong-royong untuk membantu mereka.",
    "Dia hampir berputus asa tetapi ibunya terus memberi semangat.",
    "Pada akhir cerita mereka berjaya dan meraikannya bersama keluarga.",
  ],
  p1: [
    "Pengajaran yang saya dapat ialah kita mestilah berani mencuba.",
    "Kita hendaklah sentiasa menolong orang yang memerlukan.",
    "Kita perlulah berkongsi dan tidak mementingkan diri sendiri.",
    "Jangan malas belajar kerana ilmu sangat berguna.",
    "Kita mestilah menghormati orang tua dan mendengar nasihat mereka.",
    "Kita perlu bekerjasama supaya kerja lebih mudah.",
  ],
  p2: ["", " Saya akan mengamalkannya di rumah.", " Ini penting untuk masa depan.", " Saya suka buku ini.", " Kita juga mesti bersabar."],
  pendek: [
    ["Cerita tentang arnab yang sesat di hutan.", "Kita mesti berani."],
    ["Dua kawan bina rumah pokok.", "Kena bekerjasama selalu."],
    ["Kucing cari anaknya di pasar.", "Jangan putus asa."],
  ],
};
const ZH = {
  tajuk: ["小兔子回家", "我们的绿色校园", "蝴蝶的一生", "勇敢的小明", "海边的一天", "爷爷的果园"],
  a: [
    "这本书讲述了一只小兔子在森林里迷路，后来在小鸟和松鼠的帮助下终于找到回家的路。",
    "故事讲的是小明和他的好朋友一起参加学校的环保活动，他们捡垃圾、种小树，让校园变得更美丽。",
    "这本书介绍了蝴蝶的一生，从小小的卵变成毛毛虫，再结成蛹，最后变成美丽的蝴蝶。",
    "故事里的小女孩每天放学后都去爷爷的果园帮忙，她学会了怎样照顾果树。",
  ],
  b: [
    "它学会了遇到困难时要冷静思考，也明白了朋友的重要。",
    "作者用简单的文字和图画让我们认识大自然的奇妙。",
    "最后大家一起分享了丰收的水果，心里非常开心。",
  ],
  p: [
    "这个故事告诉我们，遇到困难的时候不要放弃，要勇敢面对，也要懂得感谢帮助我们的人。",
    "我学会了我们应该爱护环境，不要乱丢垃圾，要从小养成好习惯。",
    "我明白了大自然很奇妙，我们要好好学习，多观察身边的事物。",
    "我们要孝顺长辈，多帮忙做家务，不能只顾着玩。",
  ],
};
const EN = {
  tajuk: ["Mia and the Lost Puppy", "The Little Seed", "A Kite for Sam", "The Brave Little Boat"],
  a: [
    "The story is about a girl named Mia who finds a lost puppy near her house.",
    "This book tells how a small seed grows into a big tree with sun and water.",
    "Sam builds a kite with his grandfather during the school holidays.",
    "A little boat sails across the sea to bring medicine to an island.",
  ],
  b: [
    "She asks her neighbours for help and finally finds the owner.",
    "Many animals come to live in the tree when it becomes tall.",
    "They fly it together at the beach on a windy afternoon.",
    "The journey is difficult but the boat never gives up.",
  ],
  p: [
    "We should always be kind and help others who are in trouble.",
    "I learned that we must be patient because good things take time.",
    "We should spend time with our family and learn from our grandparents.",
    "We must be brave and never give up when things are hard.",
  ],
};

function janaRekod(): RekodAins[] {
  const r = prng(20261126);
  const pilih = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length)] as T;
  const kelas = ["TAHUN 4 4A", "TAHUN 4 4B", "TAHUN 5 5A", "TAHUN 3 3C"];
  const murid = Array.from({ length: 24 }, (_, i) => ({
    nama: `MURID CONTOH ${String(i + 1).padStart(2, "0")}`,
    kelas: kelas[i % kelas.length] as string,
  }));
  const senarai: RekodAins[] = [];
  let id = 900001;
  const tambah = (m: (typeof murid)[number]) => {
    const hari = 10 + Math.floor(r() * 15);
    const meta = `Buku / e-Buku · Dihantar ${hari} Nov 2026, ${1 + Math.floor(r() * 11)}:${String(Math.floor(r() * 60)).padStart(2, "0")} pm`;
    const tajukBm = `${pilih(BM.watak)} ${pilih(BM.tempat)}`;
    const x = r();
    let tajuk = tajukBm;
    let rumusan: string;
    let pengajaran: string;
    if (x < 0.55) {
      rumusan = `${pilih(BM.a)} ${pilih(BM.b)}`;
      pengajaran = `${pilih(BM.p1)}${pilih(BM.p2)}`;
    } else if (x < 0.7) {
      tajuk = pilih(ZH.tajuk);
      rumusan = `${pilih(ZH.a)}${pilih(ZH.b)}`;
      pengajaran = pilih(ZH.p);
    } else if (x < 0.8) {
      tajuk = pilih(EN.tajuk);
      rumusan = `${pilih(EN.a)} ${pilih(EN.b)}`;
      pengajaran = pilih(EN.p);
    } else if (x < 0.9) {
      [rumusan, pengajaran] = pilih(BM.pendek) as [string, string];
    } else if (x < 0.95) {
      rumusan = "Best.";
      pengajaran = "Bagus.";
    } else if (x < 0.98) {
      tajuk = pilih(ZH.tajuk);
      rumusan = `${pilih(EN.a)} ${pilih(EN.b)}`;
      pengajaran = pilih(EN.p);
    } else {
      rumusan = "asdfgh jkl asdfgh jkl qwerty qwerty";
      pengajaran = "asdfgh jkl asdfgh";
    }
    senarai.push({ id: String(id++), tajuk, meta, rumusan, pengajaran, murid: m.nama, kelas: m.kelas });
  };
  for (let i = 0; i < 52; i++) tambah(murid[0]!);
  for (const m of murid.slice(1)) for (let i = 0; i < 3 + Math.floor(r() * 6); i++) tambah(m);
  return senarai;
}


const FASA: Fasa[] = ["tiada-penanda", "menunggu", "sedia", "membaca", "keputusan", "melaksana"];

export default function ContohSemakAins({ fasaAwal }: { fasaAwal: Fasa }) {
  const rekod = useMemo(janaRekod, []);
  const [fasa, setFasa] = useState<Fasa>(fasaAwal);
  const [status, setStatus] = useState<Map<string, StatusTindakan>>(() => new Map());
  const [hasil, setHasil] = useState<HasilLaksana | null>(null);
  const [kira, setKira] = useState<KiraLaksana>({ jumlah: 40, diproses: 26, berjaya: 26, gagal: 0 });
  const [tapisan, setTapisan] = useState<Tapisan>({});
  const [notis, setNotis] = useState(false);
  const [penandaLama, setPenandaLama] = useState(false);
  const [terputus, setTerputus] = useState(false);

  const s: Sambungan = {
    fasa,
    sekolah: { nama: "SEKOLAH CONTOH NEXA (DATA SINTETIK)", kod: "XYZ0000", versiPenanda: penandaLama ? 4 : 8 },
    rekod: fasa === "membaca" ? rekod.slice(0, 60) : rekod,
    bacaan: { halaman: 6, jumlahHalaman: Math.ceil(rekod.length / 10) },
    bacaanKe: 1,
    ralat: null,
    ralatSambungan: notis ? "Tiada respons daripada tab AINS. Klik penanda sekali lagi dalam tab AINS, kemudian baca semula." : null,
    terputus,
    mengesahkan: null,
    halamanGagal: notis ? [7, 12] : [],
    status,
    kira,
    hasilLaksana: hasil,
    tapisan,
    mula: (t) => {
      setTapisan(t);
      setFasa("keputusan");
    },
    bacaSemula: () => setFasa("keputusan"),
    tukarTapisan: () => setFasa("sedia"),
    kembaliKeputusan: () => setFasa("keputusan"),
    laksana: (tindakan, item) => {
      /* Simulasi: mula (diproses 0) → separuh → selesai. */
      setKira({ jumlah: item.length, diproses: 0, berjaya: 0, gagal: 0 });
      setFasa("melaksana");
      window.setTimeout(() => {
        setKira({ jumlah: item.length, diproses: Math.ceil(item.length / 2), berjaya: Math.ceil(item.length / 2), gagal: 0 });
      }, 1200);
      window.setTimeout(() => {
        setStatus((lama) => {
          const baru = new Map(lama);
          for (const it of item) baru.set(it.id, { tindakan, berjaya: true, jawapan: "success", masa: new Date().toISOString() });
          return baru;
        });
        setHasil({ tindakan, berjaya: item.length, gagal: 0, masihMenunggu: [], dihentikan: false, ralat: null });
        setFasa("keputusan");
      }, 2600);
    },
    henti: () => setFasa("keputusan"),
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-steel bg-white p-3 text-xs">
        <span className="font-semibold text-graphite">DEV · fasa:</span>
        {FASA.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFasa(f)}
            className={`rounded-full border px-2.5 py-1 ${f === fasa ? "border-ink bg-ink text-white" : "border-fog text-charcoal"}`}
          >
            {f}
          </button>
        ))}
        <label className="ml-2 flex items-center gap-1.5 text-charcoal">
          <input type="checkbox" checked={notis} onChange={(e) => setNotis(e.target.checked)} /> notis ralat
        </label>
        <label className="flex items-center gap-1.5 text-charcoal">
          <input type="checkbox" checked={penandaLama} onChange={(e) => setPenandaLama(e.target.checked)} /> penanda lama (v4)
        </label>
        <label className="flex items-center gap-1.5 text-charcoal">
          <input type="checkbox" checked={terputus} onChange={(e) => setTerputus(e.target.checked)} /> terputus
        </label>
      </div>
      <SemakAinsPaparan s={s} tanpaLog />
    </>
  );
}
