import type { AnalisisHomeModule, HomeBengkelProgram } from "./summary";

/** Paparan statik. Tiada borang pentadbir — kemas kini di sini apabila ada bengkel baharu. */
export const BENGKEL_PROGRAMS: HomeBengkelProgram[] = [
  {
    title: "Bengkel AI untuk Murid",
    program: "PROGRAM EDUSPARK CoE: BENGKEL AI TOOLS DELIMA MURID GENERASI MADANI",
    value: "400",
    unit: "murid",
    peruntukan: "RM2,500.00",
  },
  {
    title: "Bengkel AI untuk Guru Bahasa",
    program: "PROGRAM EDUSPARK CoE: BENGKEL AI TOOLS DELIMA GURU DAERAH MANJUNG",
    value: "101",
    unit: "guru",
    peruntukan: "RM2,000.00",
  },
  {
    title: "Bengkel AI untuk Guru STEM",
    program:
      "PROGRAM EDUSPARK CoE: BENGKEL KERJA LATIHAN BERBANTU KECERDASAN BUATAN (AI) BAGI GURU STEM (SAINS, MATEMATIK, TEKNOLOGI DAN KOMPUTER, KEJURUTERAAN DAN VOKASIONAL) SR & SM",
    value: "404/705",
    unit: "57.3%\nguru",
    peruntukan: "RM11,395.10",
  },
  {
    title: "Bengkel Penataran untuk Guru Penyelaras ICT",
    program: "PROGRAM EDUSPARK CoE: PENATARAN MODUL PENDIGITALAN GOOGLE, CANVA & MICROSOFT",
    value: "50",
    unit: "guru",
    peruntukan: "RM1,000.00",
  },
  {
    title: "Bengkel Penataran untuk Guru Penyelaras DELIMa",
    program:
      "PROGRAM EDUSPARK CoE: BENGKEL PENATARAN DELIMa 3.0 KEPADA GP DELIMa DAERAH MANJUNG",
    value: "101",
    unit: "guru",
    peruntukan: "RM2,500.00",
  },
];

export const bengkelHomeModule: AnalisisHomeModule = {
  id: "bengkel",
  label: "Bengkel",
  headlineValue: "5",
  headlineLabel: "Bengkel & penataran",
  tiles: [],
  bars: [],
  bengkel: BENGKEL_PROGRAMS,
};
