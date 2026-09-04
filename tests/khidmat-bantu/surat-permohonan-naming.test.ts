import assert from "node:assert/strict";
import test from "node:test";
import { buildSuratPermohonanNaming } from "../../lib/khidmat-bantu/surat-permohonan-naming";

test("nests Khidmat Bantu letters under the module folder before year and month", () => {
  const path = buildSuratPermohonanNaming(
    {
      orgName: "SK Manjung",
      activityDate: "2026-07-15",
      serviceType: "Program",
    },
    "surat.pdf",
    "application/pdf",
  );
  assert.deepEqual(path.subPath, ["Khidmat-Bantu", "2026", "2026-07"]);
  assert.match(path.fileName, /^2026-07-15_SK-Manjung_Program_.+\.pdf$/);
});
