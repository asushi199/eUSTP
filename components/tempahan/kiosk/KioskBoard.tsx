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
    <div className="fixed inset-0 cursor-none overflow-hidden bg-white text-ink">
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
        <section className="mt-8 rounded-xl border-2 border-fog px-6 pb-4 pt-5">
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
              if (!c) return <div key={`k${i}`} className="h-[52px]" />;
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
                    "flex h-[52px] flex-col items-center justify-center",
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
                        className="h-3 w-3 rounded-full"
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
        <div className="mt-8 grid gap-3" style={{ gridTemplateColumns: cols }}>
          <div />
          {rooms.map((r) => (
            <div
              key={r.slug}
              className="border-t-[6px] pt-2 text-[24px] font-semibold leading-tight"
              style={{ borderTopColor: r.color }}
            >
              {r.label}
            </div>
          ))}
        </div>

        {/* 5 hari terperinci */}
        <div className="mt-3 grid min-h-0 flex-1 grid-rows-5 gap-3.5">
          {days.map((d) => {
            const isToday = d.date === today;
            const dow = weekdayOf(d.date);
            return (
              <div
                key={d.date}
                className={`grid min-h-0 gap-3 rounded-lg ${isToday ? "outline outline-[3px] outline-offset-[5px] outline-primary" : ""}`}
                style={{ gridTemplateColumns: cols }}
              >
                <div className="flex flex-col justify-center">
                  <p className="text-[26px] font-semibold leading-tight">{HARI_PENUH[dow]}</p>
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
              <span className="h-5 w-5 rounded bg-ink" /> Ditempah
            </span>
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 rounded border-2 border-dashed border-steel" /> Kosong
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
    return <Booked entry={cell.entry} slotLabel="Sepanjang hari" color={color} lines={4} />;
  }
  return (
    <div className="grid min-h-0 grid-rows-2 gap-1.5">
      {cell.am ? (
        <Booked entry={cell.am} slotLabel="Pagi" color={color} lines={2} />
      ) : (
        <Empty slotLabel="Pagi" />
      )}
      {cell.pm ? (
        <Booked entry={cell.pm} slotLabel="Petang" color={color} lines={2} />
      ) : (
        <Empty slotLabel="Petang" />
      )}
    </div>
  );
}

function Booked({
  entry,
  slotLabel,
  color,
  lines,
}: {
  entry: KioskEntry;
  slotLabel: string;
  color: string;
  lines: 2 | 4;
}) {
  return (
    <div
      className="flex min-h-0 flex-col justify-center overflow-hidden rounded-lg border-l-[6px] bg-ink px-3 py-2 text-white"
      style={{ borderLeftColor: color }}
    >
      <p
        className={`text-[21px] font-semibold leading-[1.15] ${lines === 4 ? "line-clamp-4" : "line-clamp-2"}`}
      >
        {entry.purpose}
      </p>
      <p className="mt-1 truncate text-[17px] text-white/75">
        {slotLabel} · {entry.name}
      </p>
    </div>
  );
}

function Empty({ slotLabel }: { slotLabel: string }) {
  return (
    <div className="flex min-h-0 items-center justify-center rounded-lg border-2 border-dashed border-fog text-[19px] text-steel">
      {slotLabel} · Kosong
    </div>
  );
}
