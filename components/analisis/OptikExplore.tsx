"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OptikSchoolTable from "@/components/analisis/OptikSchoolTable";
import OptikPenggunaan from "@/components/analisis/OptikPenggunaan";
import OptikTeacherTable from "@/components/analisis/OptikTeacherTable";
import {
  loadOptikPenggunaan,
  loadOptikSchools,
  loadOptikSchoolTeachers,
  type OptikPenggunaanPayload,
  type OptikSchoolListPayload,
  type OptikTeacherListPayload,
} from "@/lib/actions/optik-public";
import type { OptikSchoolPublicRow } from "@/lib/analisis/optik-types";

export type OptikExploreLayer = "overview" | "schools" | "teachers" | "penggunaan";

export default function OptikExplore({
  children,
  initialLayer = "overview",
  initialSchoolCode,
  schools: schoolsProp,
  summary: summaryProp,
  schoolsBackHref,
  schoolsBackLabel = "← Laman utama",
  onLayerChange,
}: {
  children?: React.ReactNode;
  initialLayer?: OptikExploreLayer;
  initialSchoolCode?: string;
  schools?: OptikSchoolPublicRow[];
  summary?: string | null;
  schoolsBackHref?: string;
  schoolsBackLabel?: string;
  onLayerChange?: (layer: OptikExploreLayer) => void;
}) {
  const [layer, setLayer] = useState<OptikExploreLayer>(
    initialSchoolCode ? "teachers" : initialLayer,
  );
  const [list, setList] = useState<OptikSchoolListPayload | null>(
    schoolsProp
      ? { schools: schoolsProp, summary: summaryProp ?? null }
      : null,
  );
  const [detail, setDetail] = useState<OptikTeacherListPayload | null>(null);
  const [penggunaan, setPenggunaan] = useState<OptikPenggunaanPayload | null | undefined>(undefined);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function go(next: OptikExploreLayer) {
    setLayer(next);
    onLayerChange?.(next);
  }

  async function ensureSchools() {
    if (list) return list;
    setLoadingList(true);
    setError(null);
    try {
      const data = await loadOptikSchools();
      setList(data);
      return data;
    } catch {
      setError("Senarai sekolah tidak dapat dimuatkan.");
      return null;
    } finally {
      setLoadingList(false);
    }
  }

  async function openSchools() {
    go("schools");
    await ensureSchools();
  }

  async function openPenggunaan() {
    go("penggunaan");
    if (penggunaan !== undefined) return;
    setError(null);
    try {
      setPenggunaan(await loadOptikPenggunaan());
    } catch {
      setError("Data penggunaan tidak dapat dimuatkan.");
      setPenggunaan(null);
    }
  }

  async function openTeachers(code: string) {
    go("teachers");
    setDetail(null);
    setLoadingTeachers(true);
    setError(null);
    try {
      const data = await loadOptikSchoolTeachers(code);
      if (!data) {
        setError("Sekolah ini tiada dalam snapshot semasa.");
        return;
      }
      setDetail(data);
    } catch {
      setError("Senarai guru tidak dapat dimuatkan.");
    } finally {
      setLoadingTeachers(false);
    }
  }

  useEffect(() => {
    if (!initialSchoolCode) return;
    let cancelled = false;
    setLoadingTeachers(true);
    setError(null);
    void loadOptikSchoolTeachers(initialSchoolCode)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError("Sekolah ini tiada dalam snapshot semasa.");
          setDetail(null);
        } else {
          setDetail(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Senarai guru tidak dapat dimuatkan.");
      })
      .finally(() => {
        if (!cancelled) setLoadingTeachers(false);
      });
    if (!schoolsProp) {
      void loadOptikSchools().then((data) => {
        if (!cancelled) setList(data);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [initialSchoolCode, schoolsProp]);

  if (layer === "teachers") {
    const belum = detail?.teachers.filter((row) => row.plcStatus !== "Selesai").length ?? 0;
    const murid =
      detail && detail.school.muridJumlah > 0
        ? ` · Murid ${detail.school.muridAi.toLocaleString("ms-MY")} / ${detail.school.muridJumlah.toLocaleString("ms-MY")} guna AI Tools`
        : "";
    return (
      <div className="mt-4">
        <button
          type="button"
          className="text-sm text-graphite hover:text-ink"
          onClick={() => {
            setError(null);
            go("schools");
          }}
        >
          ← Senarai sekolah
        </button>
        {detail ? (
          <>
            <h3 className="mt-3 text-lg font-semibold tracking-tight">{detail.school.schoolName}</h3>
            <p className="mt-1 text-sm text-graphite">
              {detail.school.schoolCode} · {detail.snapshotLabel} ·{" "}
              {detail.school.selesaiBil.toLocaleString("ms-MY")} /{" "}
              {detail.school.totalBil.toLocaleString("ms-MY")} guru selesai (
              {detail.school.pctAi.toLocaleString("ms-MY", { maximumFractionDigits: 2 })}%) · PLC{" "}
              {detail.school.plcStatus}
              {detail.teachers.length > 0 ? ` · ${belum} belum selesai` : ""}
              {murid}.
            </p>
            <OptikTeacherTable teachers={detail.teachers} />
          </>
        ) : loadingTeachers ? (
          <p className="mt-4 text-sm text-graphite">Memuatkan senarai guru…</p>
        ) : (
          <p className="mt-4 text-sm text-graphite">{error ?? "Tiada data guru."}</p>
        )}
      </div>
    );
  }

  if (layer === "penggunaan") {
    return (
      <div className="mt-4">
        <button type="button" className="text-sm text-graphite hover:text-ink" onClick={() => go("overview")}>
          ← Carta
        </button>
        <h3 className="mt-3 text-lg font-semibold tracking-tight">Penggunaan AI Tools</h3>
        {error ? <p className="mt-3 text-sm text-graphite">{error}</p> : null}
        {penggunaan === undefined ? (
          <p className="mt-4 text-sm text-graphite">Memuatkan…</p>
        ) : penggunaan === null ? (
          <p className="mt-4 text-sm text-graphite">Data hari aktif belum tersedia.</p>
        ) : (
          <OptikPenggunaan data={penggunaan} />
        )}
      </div>
    );
  }

  if (layer === "schools") {
    return (
      <div className="mt-4">
        {initialLayer === "overview" ? (
          <button type="button" className="text-sm text-graphite hover:text-ink" onClick={() => go("overview")}>
            ← Carta
          </button>
        ) : schoolsBackHref ? (
          <Link href={schoolsBackHref} className="text-sm text-graphite hover:text-ink">
            {schoolsBackLabel}
          </Link>
        ) : null}
        <h3 className="mt-3 text-lg font-semibold tracking-tight">AI Tools mengikut sekolah</h3>
        {list?.summary ? <p className="mt-1 text-sm text-graphite">{list.summary}</p> : null}
        {error ? <p className="mt-3 text-sm text-graphite">{error}</p> : null}
        {loadingList && !list ? (
          <p className="mt-4 text-sm text-graphite">Memuatkan senarai sekolah…</p>
        ) : (
          <div className="mt-4">
            <OptikSchoolTable schools={list?.schools ?? []} onSelectSchool={(row) => void openTeachers(row.schoolCode)} />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {children}
      <p className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-outline btn-sm" onClick={() => void openSchools()}>
          Lihat senarai sekolah
        </button>
        <button type="button" className="btn-outline btn-sm" onClick={() => void openPenggunaan()}>
          Penggunaan &amp; guru paling aktif
        </button>
      </p>
    </>
  );
}
