"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BULAN_PENDEK,
  HARI_PENUH,
  clockKL,
  longDateLabel,
  todayIsoKL,
  weekdayOf,
  type KioskRoom,
} from "@/lib/tempahan/kiosk";

export type KioskEntry = { purpose: string; name: string };
export type KioskCell =
  | { kind: "full"; entry: KioskEntry }
  | { kind: "half"; am: KioskEntry | null; pm: KioskEntry | null };
export type KioskDay = { date: string; cells: KioskCell[] };
export type KioskCalendarDay = { date: string; inMonth: boolean; booked: boolean[] };

const LEBAR = 1080;
const TINGGI = 1920;
/** Data dimuat semula dari pelayan setiap 5 minit. */
const REFRESH_MS = 5 * 60 * 1000;
const JAM_MS = 15 * 1000;

const WEEK_HEAD = ["Isn", "Sel", "Rab", "Kha", "Jum", "Sab", "Ahd"];
/** Bayang kad — kad putih terangkat di atas latar kelabu-biru. */
const KAD = "shadow-[0_4px_14px_rgba(15,40,80,0.10)]";

/**
 * Papan kiosk menegak: kanvas tetap 1080×1920 diskala seragam ke skrin (jalur putih
 * di tepi jika nisbah berbeza). Tiada interaksi — jam berdetik, data dimuat semula
 * berkala dan apabila tarikh bertukar (tengah malam).
 */
export default function KioskBoard({
  pkgName,
  logoSrc,
  rooms,
  today,
  windowEnd,
  monthLabel,
  calendar,
  days,
  generatedAt,
}: {
  pkgName: string;
  logoSrc: string | null;
  rooms: KioskRoom[];
  today: string;
  windowEnd: string;
  monthLabel: string;
  calendar: (KioskCalendarDay | null)[][];
  days: KioskDay[];
  generatedAt: string;
}) {
  const router = useRouter();
  const [skala, setSkala] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date(generatedAt));

  useEffect(() => {
    const kira = () => setSkala(Math.min(window.innerWidth / LEBAR, window.innerHeight / TINGGI));
    kira();
    window.addEventListener("resize", kira);
    return () => window.removeEventListener("resize", kira);
  }, []);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d);
      if (todayIsoKL(d) !== today) router.refresh();
    };
    tick();
    const id = setInterval(tick, JAM_MS);
    return () => clearInterval(id);
  }, [router, today]);

  const cols = `120px repeat(${rooms.length}, minmax(0, 1fr))`;

  return (
    <div className="fixed inset-0 cursor-none overflow-hidden bg-[#e9eef5] text-ink">
      <div
        className="absolute left-1/2 top-1/2 flex flex-col px-14 py-14"
        style={{
          width: LEBAR,
          height: TINGGI,
          transform: `translate(-50%, -50%) scale(${skala ?? 1})`,
          visibility: skala === null ? "hidden" : "visible",
        }}
      >
        {/* Kepala */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            {logoSrc && (
              <img
                src={logoSrc}
                alt=""
                className="h-20 w-20 rounded-xl border border-fog bg-white object-contain"
              />
            )}
            <div>
              <h1 className="text-[46px] font-semibold leading-none tracking-tight">
                Tempahan Bilik
              </h1>
              <p className="mt-2 text-[24px] text-graphite">{pkgName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[72px] font-semibold leading-none tabular-nums tracking-tight">
              {clockKL(now)}
            </p>
            <p className="mt-2 text-[22px] text-graphite">{longDateLabel(todayIsoKL(now))}</p>
          </div>
        </header>

        {/* Kalendar bulan: satu titik setiap bilik */}
        <section className={`mt-8 rounded-2xl bg-white px-6 pb-4 pt-5 ${KAD}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-[30px] font-semibold">{monthLabel}</h2>
            <div className="flex gap-6">
              {rooms.map((r) => (
                <span key={r.slug} className="flex items-center gap-2 text-[19px] text-charcoal">
                  <span className="h-4 w-4 rounded-full" style={{ background: r.color }} />
                  {r.label}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-7 text-center">
            {WEEK_HEAD.map((w) => (
              <div key={w} className="pb-1 text-[18px] text-graphite">
                {w}
              </div>
            ))}
            {calendar.flat().map((c, i) => {
              if (!c) return <div key={`k${i}`} className="h-[48px]" />;
              const inWindow = c.date >= today && c.date <= windowEnd;
              const isToday = c.date === today;
              const past = c.date < today;
              const col = i % 7;
              const startBand = inWindow && (c.date === today || col === 0);
              const endBand = inWindow && (c.date === windowEnd || col === 6);
              const dayNum = Number(c.date.slice(8, 10));
              const label =
                !c.inMonth && dayNum === 1
                  ? `1 ${BULAN_PENDEK[Number(c.date.slice(5, 7)) - 1]}`
                  : String(dayNum);
              return (
                <div
                  key={c.date}
                  className={[
                    "flex h-[48px] flex-col items-center justify-center",
                    inWindow ? "bg-primary-soft/50" : "",
                    startBand ? "rounded-l-lg" : "",
                    endBand ? "rounded-r-lg" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-8 min-w-8 items-center justify-center rounded-full px-1 text-[21px] leading-none tabular-nums",
                      isToday ? "bg-ink font-semibold text-white" : "",
                      past ? "text-steel" : "",
                      !c.inMonth && !isToday ? "text-graphite" : "",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                  <span className={`mt-1 flex gap-[5px] ${past ? "opacity-40" : ""}`}>
                    {rooms.map((r, ri) => (
                      <span
                        key={r.slug}
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ background: c.booked[ri] ? r.color : "#e8e8e8" }}
                      />
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Kepala lajur bilik */}
        <div className="mt-7 grid gap-3 px-3" style={{ gridTemplateColumns: cols }}>
          <div />
          {rooms.map((r) => (
            <div
              key={r.slug}
              className={`flex min-h-[76px] items-center rounded-xl px-4 py-2 text-[24px] font-bold leading-tight text-white ${KAD}`}
              style={{ background: r.color }}
            >
              {r.label}
            </div>
          ))}
        </div>

        {/* 5 hari terperinci — setiap hari satu kad */}
        <div className="mt-4 grid min-h-0 flex-1 grid-rows-5 gap-4">
          {days.map((d) => {
            const isToday = d.date === today;
            const dow = weekdayOf(d.date);
            return (
              <div
                key={d.date}
                className={`grid min-h-0 gap-3 rounded-2xl bg-white p-3 ${KAD} ${isToday ? "ring-4 ring-primary" : ""}`}
                style={{ gridTemplateColumns: cols }}
              >
                <div className="flex flex-col justify-center pl-1">
                  <p className="text-[26px] font-bold leading-tight">{HARI_PENUH[dow]}</p>
                  <p className="text-[20px] text-graphite">
                    {Number(d.date.slice(8, 10))} {BULAN_PENDEK[Number(d.date.slice(5, 7)) - 1]}
                  </p>
                  {isToday && (
                    <p className="mt-1 text-[18px] font-semibold text-primary">Hari ini</p>
                  )}
                </div>
                {d.cells.map((cell, ri) => (
                  <RoomCell key={rooms[ri].slug} cell={cell} color={rooms[ri].color} />
                ))}
              </div>
            );
          })}
        </div>

        <footer className="mt-6 flex items-center justify-between text-[18px] text-graphite">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="flex gap-1">
                {rooms.map((r) => (
                  <span key={r.slug} className="h-5 w-3 rounded-sm" style={{ background: r.color }} />
                ))}
              </span>
              Ditempah
            </span>
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 rounded bg-white" /> Kosong
            </span>
            <span>Pagi 8:00–12:00 · Petang 2:00–5:00</span>
          </div>
          <span>Dikemas kini {clockKL(new Date(generatedAt))}</span>
        </footer>
      </div>
    </div>
  );
}

function RoomCell({ cell, color }: { cell: KioskCell; color: string }) {
  if (cell.kind === "full") {
    return <Booked entry={cell.entry} color={color} lines={4} />;
  }
  // Bilik kosong sepanjang hari: satu blok, bukan dua — kurangkan bunyi visual.
  if (!cell.am && !cell.pm) return <Empty slotLabel="Sepanjang hari" />;
  return (
    <div className="grid min-h-0 grid-rows-2 gap-1.5">
      {cell.am ? <Booked entry={cell.am} color={color} lines={2} /> : <Empty slotLabel="Pagi" />}
      {cell.pm ? <Booked entry={cell.pm} color={color} lines={2} /> : <Empty slotLabel="Petang" />}
    </div>
  );
}

/** Slot difahami daripada kedudukan blok (atas = pagi, bawah = petang, penuh = sepanjang hari). */
function Booked({ entry, color, lines }: { entry: KioskEntry; color: string; lines: 2 | 4 }) {
  return (
    <div
      className="flex min-h-0 flex-col justify-center overflow-hidden rounded-xl px-3.5 py-1.5 text-white shadow-[0_6px_14px_rgba(15,30,60,0.28),inset_0_1px_0_rgba(255,255,255,0.25)]"
      style={{ background: color }}
    >
      <p
        className={`font-bold leading-[1.1] ${lines === 4 ? "line-clamp-4 text-[22px]" : "line-clamp-2 text-[20px]"}`}
      >
        {entry.purpose}
      </p>
      <p
        className={`mt-0.5 text-[17px] font-medium leading-tight text-white/90 ${lines === 4 ? "line-clamp-2" : "truncate"}`}
      >
        {entry.name}
      </p>
    </div>
  );
}

function Empty({ slotLabel }: { slotLabel: string }) {
  return (
    <div className="flex min-h-0 flex-col items-center justify-center rounded-xl bg-[#f2f5f9] text-steel">
      <span className="text-[22px] font-semibold text-[#9aa5b1]">Kosong</span>
      <span className="text-[15px] text-[#b0b9c3]">{slotLabel}</span>
    </div>
  );
}
