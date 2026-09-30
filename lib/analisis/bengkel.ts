import type { AnalisisHomeModule, HomeBengkelProgram } from "./summary";

/** Paparan statik. Tiada borang pentadbir — kemas kini di sini apabila ada bengkel baharu. */
export const BENGKEL_PROGRAMS: HomeBengkelProgram[] = [
  {
    title: "Bengkel AI untuk Murid",
    program: "PROGRAM EDUSPARK CoE: BENGKEL AI TOOLS DELIMA MURID GENERASI MADANI",
    value: "400",
    unit: "murid",
  },
  {
    title: "Bengkel AI untuk Guru Bahasa",
    program: "PROGRAM EDUSPARK CoE: BENGKEL AI TOOLS DELIMA GURU DAERAH MANJUNG",
    value: "101",
    unit: "guru",
  },
  {
    title: "Bengkel AI untuk Guru STEM",
    program:
      "PROGRAM EDUSPARK CoE: BENGKEL KERJA LATIHAN BERBANTU KECERDASAN BUATAN (AI) BAGI GURU STEM (SAINS, MATEMATIK, TEKNOLOGI DAN KOMPUTER, KEJURUTERAAN DAN VOKASIONAL) SR & SM",
    value: "404/705",
    unit: "57.3%",
  },
];

export const bengkelHomeModule: AnalisisHomeModule = {
  id: "bengkel",
  label: "Bengkel",
  headlineValue: "3",
  headlineLabel: "Bengkel AI",
  tiles: [],
  bars: [],
  bengkel: BENGKEL_PROGRAMS,
};
