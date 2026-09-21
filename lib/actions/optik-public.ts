"use server";

import { getAnalisisData } from "@/lib/analisis/queries";
import {
  applySchoolDirectoryNames,
  getOptikPublicView,
  getOptikSchoolDetail,
} from "@/lib/analisis/optik-queries";
import type { OptikSchoolPublicRow, OptikTeacherPublicRow } from "@/lib/analisis/optik-types";

export type OptikSchoolListPayload = {
  schools: OptikSchoolPublicRow[];
  summary: string | null;
};

export type OptikTeacherListPayload = {
  school: OptikSchoolPublicRow;
  teachers: OptikTeacherPublicRow[];
  snapshotLabel: string;
};

function schoolSummary(view: {
  current: {
    selesaiPct: number;
    selesaiBil: number;
    totalBil: number;
    sekolahSelesai: number;
    sekolahBelum: number;
    chartLabel: string;
  } | null;
}): string | null {
  if (!view.current) return null;
  const pct = view.current.selesaiPct.toLocaleString("ms-MY", { maximumFractionDigits: 2 });
  const done = view.current.selesaiBil.toLocaleString("ms-MY");
  const total = view.current.totalBil.toLocaleString("ms-MY");
  return `${pct}% selesai (${done} / ${total} guru) · ${view.current.sekolahSelesai} sekolah selesai, ${view.current.sekolahBelum} belum · ${view.current.chartLabel}.`;
}

export async function loadOptikSchools(): Promise<OptikSchoolListPayload> {
  const optik = await getAnalisisData("optik");
  const view = await getOptikPublicView(optik.metrics);
  return {
    schools: await applySchoolDirectoryNames(view.schools),
    summary: schoolSummary(view),
  };
}

export async function loadOptikSchoolTeachers(
  kod: string,
): Promise<OptikTeacherListPayload | null> {
  const code = kod.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return null;
  const detail = await getOptikSchoolDetail(code);
  if (!detail?.school) return null;
  return {
    school: detail.school,
    teachers: detail.teachers,
    snapshotLabel: detail.snapshotLabel,
  };
}
