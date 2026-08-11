import assert from "node:assert/strict";
import test from "node:test";
import {
  getReturnNoteBox,
  getReturnNoteBoxHeight,
} from "../../lib/peralatan/kew-pa9";

test("sizes the KEW.PA-9 return-note overlay to its wrapped text", () => {
  const oneLine = getReturnNoteBoxHeight(1);
  const twoLines = getReturnNoteBoxHeight(2);
  const fullGrid = getReturnNoteBoxHeight(999);

  assert.equal(oneLine, 17.16);
  assert.equal(twoLines, 34.32);
  assert.equal(fullGrid, 343.2);
  assert.ok(oneLine < fullGrid);
});

test("fills the Catatan cell interior without drawing through the return note", () => {
  assert.deepEqual(getReturnNoteBox(5), {
    left: 510.48,
    top: 241.13,
    width: 51.96,
    height: 50.88,
  });
});
