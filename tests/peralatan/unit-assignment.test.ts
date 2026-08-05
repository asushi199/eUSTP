import assert from "node:assert/strict";
import test from "node:test";
import { sortUnitsForAutoAllocation } from "../../lib/peralatan/unit-assignment";

test("prioritises the number recorded in Catatan for automatic allocation", () => {
  const units = sortUnitsForAutoAllocation([
    { serialNo: "SN-20", notes: "" },
    { serialNo: "SN-03", notes: "No 3" },
    { serialNo: "SN-09", notes: "no. 1 - ketua set" },
    { serialNo: "SN-02", notes: "Tiada nombor" },
  ]);

  assert.deepEqual(
    units.map((unit) => unit.serialNo),
    ["SN-09", "SN-03", "SN-02", "SN-20"],
  );
});
