import assert from "node:assert/strict";
import test from "node:test";
import {
  getTransferNoteBox,
  getTransferNoteBoxHeight,
} from "../../lib/peralatan/kew-pa17";

test("sizes the KEW.PA-17 catatan overlay to its wrapped text", () => {
  const oneLine = getTransferNoteBoxHeight(1);
  const fiveLines = getTransferNoteBoxHeight(5);
  const fullGrid = getTransferNoteBoxHeight(999);

  assert.equal(oneLine, 32);
  assert.equal(fiveLines, 64);
  assert.equal(fullGrid, 192);
  assert.ok(oneLine < fullGrid);
});

test("extends the Catatan box across every listed unit", () => {
  assert.equal(getTransferNoteBoxHeight(1, 4), 128);
  assert.deepEqual(getTransferNoteBox(1, 4), {
    left: 487.55,
    y: 516.55,
    width: 64.9,
    height: 126.9,
  });
});

test("fills the Catatan cell interior without covering the table grid", () => {
  assert.deepEqual(getTransferNoteBox(1), {
    left: 487.55,
    y: 612.55,
    width: 64.9,
    height: 30.9,
  });
});
