export const EQUIPMENT_DECLARATION_VERSION = "2026-07-29-v1";

export const EQUIPMENT_DECLARATION_INTRO =
  "Dengan memasukkan nombor MyKad dan menandakan kotak ini, saya mengesahkan bahawa saya ialah pemohon yang dinamakan dan segala maklumat yang diberikan adalah benar. Sekiranya permohonan ini diluluskan dan peralatan diserahkan kepada saya, saya bersetuju untuk:";

export const EQUIPMENT_DECLARATION_POINTS = [
  "menjaga, menggunakan dan menyimpan peralatan tersebut dengan baik bagi tujuan yang diluluskan sahaja;",
  "tidak memindah milik atau menyerahkan peralatan kepada pihak lain tanpa kebenaran;",
  "memulangkan peralatan dalam keadaan baik, lengkap dan pada tarikh yang ditetapkan; dan",
  "melaporkan dengan segera sebarang kerosakan atau kehilangan.",
] as const;

export const EQUIPMENT_DECLARATION_END =
  "Saya memahami bahawa saya bertanggungjawab terhadap kerosakan atau kehilangan yang berpunca daripada kecuaian atau salah guna sepanjang tempoh peralatan berada di bawah jagaan saya, tertakluk kepada peraturan dan pekeliling kerajaan yang sedang berkuat kuasa.";

export const EQUIPMENT_DECLARATION_TEXT = [
  EQUIPMENT_DECLARATION_INTRO,
  ...EQUIPMENT_DECLARATION_POINTS.map(
    (point, index) => `${index + 1}. ${point}`,
  ),
  EQUIPMENT_DECLARATION_END,
].join("\n");
