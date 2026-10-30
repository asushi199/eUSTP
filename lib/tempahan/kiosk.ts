/**
 * Paparan kiosk tempahan bilik (skrin menegak 1080×1920 di lobi PKG).
 * Tulen — tiada IO. Hanya PKG yang ada kiosk fizikal disenaraikan di sini;
 * hanya bilik yang benar-benar disewakan dipaparkan (bukan semua bilik PKG).
 */

export type KioskRoom = {
  slug: string;
  /** Label paparan (nama bilik dalam DB terlalu panjang / huruf besar). */
  label: string;
  /** Warna titik kalendar + jalur kepala lajur. */
  color: string;
};

export type KioskConfig = { rooms: KioskRoom[] };

export const KIOSK_CONFIG: Record<string, KioskConfig> = {
  sitiawan: {
    rooms: [
      { slug: "bilik_cenderawasih", label: "Bilik Cenderawasih", color: "#e0592a" },
      { slug: "bilik_multimedia", label: "Bilik Multimedia", color: "#16a06a" },
      { slug: "studio_digital_maker_hub", label: "Studio Digital Maker Hub", color: "#7c5cdb" },
    ],
  },
};

export function getKioskConfig(pkgId: string): KioskConfig | null {
  return KIOSK_CONFIG[pkgId] ?? null;
}

/** Bilangan hari (termasuk hujung minggu) dipaparkan terperinci, bermula hari ini. */
export const KIOSK_HARI = 5;

const TZ = "Asia/Kuala_Lumpur";

export const HARI_PENUH = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
export const HARI_PENDEK = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];
export const BULAN_PENDEK = [
  "Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis",
];
export const BULAN_PENUH = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember",
];

/** Tarikh hari ini (yyyy-MM-dd) di Malaysia — pelayan berjalan dalam UTC. */
export function todayIsoKL(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

/** "10:42" waktu Malaysia. */
export function clockKL(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

function toUtcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function addDaysIso(iso: string, days: number): string {
  const d = toUtcDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Ahad … 6 = Sabtu. */
export function weekdayOf(iso: string): number {
  return toUtcDate(iso).getUTCDay();
}

/** "Jumaat, 30 Oktober 2026" */
export function longDateLabel(iso: string): string {
  const d = toUtcDate(iso);
  return `${HARI_PENUH[d.getUTCDay()]}, ${d.getUTCDate()} ${BULAN_PENUH[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export type KioskCalendarCell = { date: string; inMonth: boolean } | null;

/**
 * Grid kalendar bulan semasa (mula Isnin). Jika tetingkap 5 hari melepasi hujung
 * bulan, minggu seterusnya ditambah supaya hari itu tetap kelihatan pada kalendar.
 * Hari bulan lepas di baris pertama dibiarkan kosong.
 */
export function buildKioskCalendar(todayIso: string, windowEnd: string): KioskCalendarCell[][] {
  const first = `${todayIso.slice(0, 7)}-01`;
  const d = toUtcDate(first);
  const lastOfMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);
  const until = windowEnd > lastOfMonth ? windowEnd : lastOfMonth;

  const startOffset = (weekdayOf(first) + 6) % 7;
  let cursor = addDaysIso(first, -startOffset);
  const weeks: KioskCalendarCell[][] = [];
  while (cursor <= until) {
    const week: KioskCalendarCell[] = [];
    for (let i = 0; i < 7; i++) {
      if (cursor < first) week.push(null);
      else week.push({ date: cursor, inMonth: cursor <= lastOfMonth });
      cursor = addDaysIso(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** Julat tarikh (inklusif) yang perlu diambil dari DB untuk kalendar + butiran. */
export function kioskRange(todayIso: string): {
  from: string;
  to: string;
  windowEnd: string;
  calendar: KioskCalendarCell[][];
} {
  const windowEnd = addDaysIso(todayIso, KIOSK_HARI - 1);
  const calendar = buildKioskCalendar(todayIso, windowEnd);
  const cells = calendar.flat().filter((c): c is NonNullable<KioskCalendarCell> => c !== null);
  return {
    from: cells[0].date,
    to: cells[cells.length - 1].date,
    windowEnd,
    calendar,
  };
}
