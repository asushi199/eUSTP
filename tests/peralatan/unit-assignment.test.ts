import assert from "node:assert/strict";
import test from "node:test";
import {
  equipmentUnitNoteLabel,
  equipmentUnitOptionLabel,
  sortUnitsForAutoAllocation,
} from "../../lib/peralatan/unit-assignment";

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

test("shows only a numbered Catatan label", () => {
  assert.equal(equipmentUnitNoteLabel("No 3. Tetikus disediakan."), "No 3");
  assert.equal(equipmentUnitNoteLabel("Tetikus disediakan."), "");
});

test("keeps a concise model identifier in a unit option", () => {
  assert.equal(
    equipmentUnitOptionLabel({
      serialNo: "T9N0CV14A473390",
      notes: "No 3. Tetikus disediakan.",
      model: "ASUS VivoBook Go A1405V-ALY409WS",
      typeName: "Komputer riba",
    }),
    "No 3 · ASUS A1405V · T9N0CV14A473390",
  );
});
